import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import salaryData from "../../seed-data/salary-statistics.json";
import deductionData from "../../seed-data/deduction-rules.json";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding salary statistics...");
  for (const row of salaryData) {
    await db.insert(schema.salaryStatistics).values({
      year: row.year,
      occupation: row.occupation,
      region: row.region,
      ageGroup: row.ageGroup,
      median: row.median,
      p25: row.p25,
      p75: row.p75,
      source: row.source,
    });
  }
  console.log(`Inserted ${salaryData.length} salary statistics rows.`);

  console.log("Seeding deduction rules...");
  for (const rule of deductionData) {
    await db.insert(schema.deductionRules).values({
      name: rule.name,
      category: rule.category as "income" | "credit",
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
