const TAX_BRACKETS = [
  { upper: 1_950_000, rate: 0.05, deduction: 0 },
  { upper: 3_300_000, rate: 0.1, deduction: 97_500 },
  { upper: 6_950_000, rate: 0.2, deduction: 427_500 },
  { upper: 9_000_000, rate: 0.23, deduction: 636_000 },
  { upper: 18_000_000, rate: 0.33, deduction: 1_536_000 },
  { upper: 40_000_000, rate: 0.4, deduction: 2_796_000 },
  { upper: Infinity, rate: 0.45, deduction: 4_796_000 },
] as const;

const RESIDENT_TAX_RATE = 0.1;

export function calcEmploymentIncomeDeduction(annualIncome: number): number {
  if (annualIncome <= 1_625_000) return 550_000;
  if (annualIncome <= 1_800_000) return annualIncome * 0.4 - 100_000;
  if (annualIncome <= 3_600_000) return annualIncome * 0.3 + 80_000;
  if (annualIncome <= 6_600_000) return annualIncome * 0.2 + 440_000;
  if (annualIncome <= 8_500_000) return annualIncome * 0.1 + 1_100_000;
  return 1_950_000;
}

export function calcTaxableIncome(annualIncome: number): number {
  const employmentDeduction = calcEmploymentIncomeDeduction(annualIncome);
  const basicDeduction = 480_000;
  const taxable = annualIncome - employmentDeduction - basicDeduction;
  return Math.max(0, taxable);
}

export function getIncomeTaxRate(taxableIncome: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.upper) {
      return bracket.rate;
    }
  }
  return 0.45;
}

export function calcIncomeTax(annualIncome: number): number {
  const taxableIncome = calcTaxableIncome(annualIncome);
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.upper) {
      return Math.floor(taxableIncome * bracket.rate - bracket.deduction);
    }
  }
  return 0;
}

export function calcResidentTax(annualIncome: number): number {
  const taxableIncome = calcTaxableIncome(annualIncome);
  return Math.floor(taxableIncome * RESIDENT_TAX_RATE);
}

export function calcDeductionSaving(params: {
  annualIncome: number;
  deductionAmount: number;
  type: "income" | "credit";
}): { incomeTax: number; residentTax: number; total: number } {
  if (params.type === "credit") {
    return {
      incomeTax: params.deductionAmount,
      residentTax: 0,
      total: params.deductionAmount,
    };
  }

  const taxableIncome = calcTaxableIncome(params.annualIncome);
  const rate = getIncomeTaxRate(taxableIncome);
  const incomeTax = Math.floor(params.deductionAmount * rate);
  const residentTax = Math.floor(params.deductionAmount * RESIDENT_TAX_RATE);

  return {
    incomeTax,
    residentTax,
    total: incomeTax + residentTax,
  };
}
