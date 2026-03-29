import {
  calcDeductionSaving,
  calcTaxableIncome,
  getIncomeTaxRate,
} from "./calculator";

export type FormulaType = Record<string, unknown>;

export type DeductionRule = {
  id: number;
  name: string;
  category: "income" | "credit" | "benefit";
  questionKey: string;
  condition: string;
  formula: FormulaType;
  legalBasis: string;
  maxAmount: number | null;
  description: string;
  howTo: string;
};

export type UserAnswers = {
  annualIncome: number;
  [questionKey: string]: { using: boolean; amount?: number } | number;
};

export type DeductionResult = {
  name: string;
  category: "income" | "credit" | "benefit";
  potentialSaving: number;
  deductionAmount: number;
  legalBasis: string;
  description: string;
  howTo: string;
};

function calcFurusatoLimit(annualIncome: number): number {
  const taxableIncome = calcTaxableIncome(annualIncome);
  const rate = getIncomeTaxRate(taxableIncome);
  const limit = Math.floor(
    (taxableIncome * 0.1 * 0.2) / (1 - 0.1 - rate * 1.021) + 2_000
  );
  return Math.min(limit, annualIncome * 0.3);
}

function calcDeductionAmount(
  rule: DeductionRule,
  annualIncome: number,
  _answer: { using: boolean; amount?: number }
): number {
  const f = rule.formula as Record<string, unknown>;
  const formulaType = f.type as string;

  switch (formulaType) {
    case "excess": {
      return 0;
    }
    case "fixed": {
      // monthlyMax or annualMax
      const monthlyMax = f.monthlyMax as number | undefined;
      const annualMax = f.annualMax as number | undefined;
      const annual = monthlyMax ? monthlyMax * 12 : (annualMax ?? 0);
      return rule.maxAmount ? Math.min(annual, rule.maxAmount) : annual;
    }
    case "furusato": {
      return Math.max(0, calcFurusatoLimit(annualIncome) - ((f.selfBurden as number) ?? 2000));
    }
    case "percentage": {
      const rate = (f.rate as number) ?? 0;
      const cap = (f.cap as number) ?? Infinity;
      const amount = annualIncome * rate;
      return Math.min(amount, cap);
    }
    case "tax_free": {
      // NISA等: 非課税枠として年間上限の20%を概算節税額とする
      const limit = (f.annual_limit as number) ?? 0;
      return Math.round(limit * 0.05); // 投資利益率5%想定 × 税率20%
    }
    default: {
      // 未知のformulaタイプはmaxAmountをフォールバックとして使用
      return rule.maxAmount ?? 0;
    }
  }
}

export function evaluateDeductions(
  answers: UserAnswers,
  rules: DeductionRule[]
): DeductionResult[] {
  const results: DeductionResult[] = [];
  const annualIncome = answers.annualIncome as number;

  if (!annualIncome || annualIncome <= 0) return results;

  for (const rule of rules) {
    const answer = answers[rule.questionKey];
    if (!answer || typeof answer === "number") continue;

    // 「はい」= 該当する = using: true → 対象として表示
    // 「いいえ」= 該当しない = using: false → スキップ
    if (!answer.using) continue;

    // 給付金は「もらえるお金」として表示
    if (rule.category === "benefit") {
      results.push({
        name: rule.name,
        category: rule.category,
        potentialSaving: rule.maxAmount ?? 0,
        deductionAmount: 0,
        legalBasis: rule.legalBasis,
        description: rule.description,
        howTo: rule.howTo,
      });
      continue;
    }

    const deductionAmount = calcDeductionAmount(rule, annualIncome, answer);
    if (!deductionAmount || isNaN(deductionAmount)) continue;

    const saving = calcDeductionSaving({
      annualIncome,
      deductionAmount,
      type: rule.category as "income" | "credit",
    });

    results.push({
      name: rule.name,
      category: rule.category,
      potentialSaving: saving.total,
      deductionAmount,
      legalBasis: rule.legalBasis,
      description: rule.description,
      howTo: rule.howTo,
    });
  }

  return results;
}
