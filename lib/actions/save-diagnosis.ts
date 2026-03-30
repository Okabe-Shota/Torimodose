"use server";

import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

export async function saveDiagnosis(params: {
  type: "quick" | "full";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  totalPotentialSaving?: number;
  answers?: Record<string, unknown>;
  diagnosisInputData?: {
    income: number;
    age: number;
    occupation: string;
    region: string;
  };
}) {
  const session = await auth();
  const userId = session?.user?.id || null;

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error("SAVE-DIAGNOSIS FAIL: ENCRYPTION_KEY not set");
    return { error: "Encryption key not configured" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("SAVE-DIAGNOSIS FAIL: SUPABASE_URL not set");
    return { error: "Supabase URL not configured" };
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    console.error("SAVE-DIAGNOSIS FAIL: NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
    return { error: "Supabase anon key not configured" };
  }

  let encryptedInput: string;
  try {
    encryptedInput = encrypt(JSON.stringify(params.input), encryptionKey);
  } catch (e) {
    console.error("SAVE-DIAGNOSIS FAIL: encrypt() threw:", e instanceof Error ? e.message : e);
    return { error: "Encryption failed" };
  }

  try {
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/save-diagnosis`;
    console.log("SAVE-DIAGNOSIS: calling", edgeFunctionUrl);

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        userId,
        type: params.type,
        input: encryptedInput,
        result: params.result,
        totalPotentialSaving: params.totalPotentialSaving || 0,
        answers: params.answers,
        diagnosisInputData: params.diagnosisInputData || null,
      }),
    });

    console.log("SAVE-DIAGNOSIS: response status", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("SAVE-DIAGNOSIS FAIL: response not ok:", response.status, errorBody);
      return { error: `Edge Function returned ${response.status}` };
    }

    const data = await response.json();
    const diagnosisId = data.data?.[0]?.id;
    console.log("SAVE-DIAGNOSIS SUCCESS: diagnosisId =", diagnosisId);
    return { success: true, data, diagnosisId };
  } catch (error) {
    console.error("SAVE-DIAGNOSIS FAIL: fetch threw:", error instanceof Error ? error.message : error);
    return { error: "Failed to save diagnosis" };
  }
}
