import { describe, it, expect } from "vitest";
import {
  getIncomeTaxRate,
  calcIncomeTax,
  calcResidentTax,
  calcDeductionSaving,
} from "@/lib/engine/calculator";

describe("getIncomeTaxRate", () => {
  it("returns 5% for taxable income under 1,950,000", () => {
    expect(getIncomeTaxRate(1_500_000)).toBe(0.05);
  });

  it("returns 10% for taxable income 1,950,001 - 3,300,000", () => {
    expect(getIncomeTaxRate(2_500_000)).toBe(0.1);
  });

  it("returns 20% for taxable income 3,300,001 - 6,950,000", () => {
    expect(getIncomeTaxRate(4_000_000)).toBe(0.2);
  });

  it("returns 23% for taxable income 6,950,001 - 9,000,000", () => {
    expect(getIncomeTaxRate(8_000_000)).toBe(0.23);
  });

  it("returns 33% for taxable income 9,000,001 - 18,000,000", () => {
    expect(getIncomeTaxRate(12_000_000)).toBe(0.33);
  });
});

describe("calcDeductionSaving", () => {
  it("calculates saving from income deduction (income tax + resident tax)", () => {
    const saving = calcDeductionSaving({
      annualIncome: 4_000_000,
      deductionAmount: 100_000,
      type: "income",
    });
    expect(saving.incomeTax).toBe(10_000);
    expect(saving.residentTax).toBe(10_000);
    expect(saving.total).toBe(20_000);
  });

  it("calculates saving from tax credit deduction", () => {
    const saving = calcDeductionSaving({
      annualIncome: 4_000_000,
      deductionAmount: 100_000,
      type: "credit",
    });
    expect(saving.total).toBe(100_000);
  });
});

describe("calcIncomeTax", () => {
  it("calculates income tax for annual income 3,000,000", () => {
    const tax = calcIncomeTax(3_000_000);
    expect(tax).toBe(77_000);
  });

  it("calculates income tax for annual income 5,000,000", () => {
    const tax = calcIncomeTax(5_000_000);
    expect(tax).toBe(210_500);
  });
});

describe("calcResidentTax", () => {
  it("calculates resident tax at flat 10%", () => {
    const tax = calcResidentTax(3_000_000);
    expect(tax).toBe(154_000);
  });
});
