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
  console.log("STEP1: auth done, userId=", userId);

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error("FAIL: no ENCRYPTION_KEY");
    return { error: "Encryption key not configured" };
  }
  console.log("STEP2: encryptionKey present");

  let encryptedInput: string;
  try {
    encryptedInput = encrypt(JSON.stringify(params.input), encryptionKey);
    console.log("STEP3: encrypt ok");
  } catch (e) {
    console.error("FAIL at encrypt:", String(e).slice(0, 80));
    return { error: "Encryption failed" };
  }

  try {
    console.log("STEP4: inserting diagnosis");
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

    console.log("STEP5: diagnosis saved id=", inserted.id);

    if (inserted.id && params.diagnosisInputData) {
      console.log("STEP6: inserting inputs");
      await db.insert(diagnosisInputs).values({
        diagnosisId: inserted.id,
        income: params.diagnosisInputData.income,
        age: params.diagnosisInputData.age,
        occupation: params.diagnosisInputData.occupation,
        region: params.diagnosisInputData.region,
      });
      console.log("STEP7: inputs saved");
    }

    return { success: true, diagnosisId: inserted.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("FAIL at step4+:", msg.slice(0, 100));
    console.error("FAIL detail:", msg.slice(100, 200));
    return { error: "Failed to save diagnosis" };
  }
}
