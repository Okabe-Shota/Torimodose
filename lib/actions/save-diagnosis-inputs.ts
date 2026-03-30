"use server";

import { db } from "@/lib/db";
import { diagnosisInputs } from "@/lib/db/schema";

export async function saveDiagnosisInputs(params: {
  diagnosisId: string;
  income: number;
  age: number;
  occupation: string;
  region: string;
}) {
  try {
    console.log("Saving diagnosis inputs with params:", {
      diagnosisId: params.diagnosisId,
      income: params.income,
      age: params.age,
      occupation: params.occupation,
      region: params.region,
    });

    const result = await db.insert(diagnosisInputs).values({
      diagnosisId: params.diagnosisId,
      income: params.income,
      age: params.age,
      occupation: params.occupation,
      region: params.region,
    });

    console.log("Successfully saved diagnosis inputs:", result);
    return { success: true };
  } catch (error) {
    console.error("Error saving diagnosis inputs:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error; // Re-throw so we can see the error on the client side
  }
}
