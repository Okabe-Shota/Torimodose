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

  // 暗号化キーがあれば暗号化、なければ平文（匿名データのため問題なし）
  const encryptionKey = process.env.ENCRYPTION_KEY;
  let inputData: string;
  if (encryptionKey) {
    inputData = encrypt(JSON.stringify(params.input), encryptionKey);
  } else {
    inputData = JSON.stringify(params.input);
  }

  try {
    const [inserted] = await db
      .insert(diagnoses)
      .values({
        userId: userId,
        type: params.type,
        input: inputData,
        result: params.result,
        totalPotentialSaving: params.totalPotentialSaving || 0,
        answers: params.answers || null,
      })
      .returning({ id: diagnoses.id });

    // diagnosis_inputs も保存
    if (inserted.id && params.diagnosisInputData) {
      await db.insert(diagnosisInputs).values({
        diagnosisId: inserted.id,
        income: params.diagnosisInputData.income,
        age: params.diagnosisInputData.age,
        occupation: params.diagnosisInputData.occupation,
        region: params.diagnosisInputData.region,
      });
    }

    return { success: true, diagnosisId: inserted.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("SAVE-DIAGNOSIS FAIL:", msg.slice(0, 120));
    return { error: "Failed to save diagnosis" };
  }
}
