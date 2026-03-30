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

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { error: `Missing env: url=${!!supabaseUrl} key=${!!serviceKey}` };
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  let inputData: string;
  if (encryptionKey) {
    inputData = encrypt(JSON.stringify(params.input), encryptionKey);
  } else {
    inputData = JSON.stringify(params.input);
  }

  try {
    // PostgREST API で INSERT（Drizzle/postgres.js をバイパス）
    const res = await fetch(`${supabaseUrl}/rest/v1/diagnoses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        type: params.type,
        input: inputData,
        result: params.result,
        total_potential_saving: params.totalPotentialSaving || 0,
        answers: params.answers || null,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { error: `REST ${res.status}: ${body.slice(0, 120)}` };
    }

    const data = await res.json();
    const diagnosisId = data?.[0]?.id;

    // diagnosis_inputs も PostgREST で INSERT
    if (diagnosisId && params.diagnosisInputData) {
      const res2 = await fetch(`${supabaseUrl}/rest/v1/diagnosis_inputs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          diagnosis_id: diagnosisId,
          income: params.diagnosisInputData.income,
          age: params.diagnosisInputData.age,
          occupation: params.diagnosisInputData.occupation,
          region: params.diagnosisInputData.region,
        }),
      });

      if (!res2.ok) {
        const body2 = await res2.text();
        return { error: `inputs REST ${res2.status}: ${body2.slice(0, 120)}` };
      }
    }

    return { success: true, diagnosisId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { error: `catch: ${msg.slice(0, 120)}` };
  }
}
