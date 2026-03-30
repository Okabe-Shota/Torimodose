"use server";

import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { diagnoses, diagnosisInputs } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

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
  let inputData: string;
  if (encryptionKey) {
    inputData = encrypt(JSON.stringify(params.input), encryptionKey);
  } else {
    inputData = JSON.stringify(params.input);
  }

  try {
    // まず最小限の raw SQL で INSERT テスト
    const resultRows = await db.execute(
      sql`INSERT INTO diagnoses (type, input, result, total_potential_saving, answers)
          VALUES (${params.type}, ${inputData}, ${JSON.stringify(params.result)}::jsonb, ${params.totalPotentialSaving || 0}, ${JSON.stringify(params.answers || null)}::jsonb)
          RETURNING id`
    );

    const diagnosisId = (resultRows as unknown as Array<{ id: string }>)[0]?.id;

    if (diagnosisId && params.diagnosisInputData) {
      await db.execute(
        sql`INSERT INTO diagnosis_inputs (diagnosis_id, income, age, occupation, region)
            VALUES (${diagnosisId}, ${params.diagnosisInputData.income}, ${params.diagnosisInputData.age}, ${params.diagnosisInputData.occupation}, ${params.diagnosisInputData.region})`
      );
    }

    return { success: true, diagnosisId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { error: msg };
  }
}
