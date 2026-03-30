import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import salaryData from "../../seed-data/salary-statistics.json";
import deductionData from "../../seed-data/deduction-rules.json";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  // 既存データをクリアして再投入
  console.log("Clearing existing salary statistics...");
  await db.delete(schema.salaryStatistics);

  console.log("Seeding salary statistics...");
  // バッチINSERT（50件ずつ）
  const BATCH_SIZE = 50;
  for (let i = 0; i < salaryData.length; i += BATCH_SIZE) {
    const batch = salaryData.slice(i, i + BATCH_SIZE).map((row) => ({
      year: row.year,
      occupation: row.occupation,
      region: row.region,
      ageGroup: row.ageGroup,
      median: row.median,
      p25: row.p25,
      p75: row.p75,
      source: row.source,
    }));
    await db.insert(schema.salaryStatistics).values(batch);
  }
  console.log(`Inserted ${salaryData.length} salary statistics rows.`);

  console.log("Clearing existing deduction rules...");
  await db.delete(schema.deductionRules);

  console.log("Seeding deduction rules...");
  for (const rule of deductionData) {
    await db.insert(schema.deductionRules).values({
      name: rule.name,
      category: rule.category as "income" | "credit" | "benefit",
      questionKey: rule.questionKey,
      condition: rule.condition,
      formula: rule.formula,
      legalBasis: rule.legalBasis,
      maxAmount: rule.maxAmount ?? null,
      description: rule.description,
      howTo: rule.howTo,
    });
  }
  console.log(`Inserted ${deductionData.length} deduction rules.`);

  console.log("Seed complete.");
}

seed().catch(console.error);
