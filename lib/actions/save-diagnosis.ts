"use server";

import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { diagnoses, diagnosisInputs } from "@/lib/db/schema";

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

  try {
    const encryptedInput = encrypt(JSON.stringify(params.input), encryptionKey);

    // Drizzle ORM で直接 INSERT（Edge Function を経由しない）
    const [inserted] = await db
      .insert(diagnoses)
      .values({
        userId: userId,
        type: params.type,
        input: encryptedInput,
        result: params.result,
        totalPotentialSaving: params.totalPotentialSaving || 0,
        answers: params.answers || null,
      })
      .returning({ id: diagnoses.id });

    console.log("SAVE-DIAGNOSIS SUCCESS: diagnosisId =", inserted.id);

    // diagnosis_inputs も直接 INSERT
    if (inserted.id && params.diagnosisInputData) {
      await db.insert(diagnosisInputs).values({
        diagnosisId: inserted.id,
        income: params.diagnosisInputData.income,
        age: params.diagnosisInputData.age,
        occupation: params.diagnosisInputData.occupation,
        region: params.diagnosisInputData.region,
      });
      console.log("SAVE-DIAGNOSIS-INPUTS SUCCESS");
    }

    return { success: true, diagnosisId: inserted.id };
  } catch (error) {
    console.error("SAVE-DIAGNOSIS FAIL:", error instanceof Error ? error.message : error);
    return { error: "Failed to save diagnosis" };
  }
}
