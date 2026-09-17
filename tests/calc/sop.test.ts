import { describe, expect, it } from "vitest";
import {
  computeDeviation,
  computeSopUsageFromSales,
  computePurchasePriceVariance,
  flagForDeviationPct,
  resolveEffectiveSopLines,
} from "@/lib/calc/sop";
import type { SopLine } from "@/lib/data/types";

describe("flagForDeviationPct", () => {
  it("flags Investigate above 5%, Watch above 2%, Below SOP under -2%, OK otherwise", () => {
    expect(flagForDeviationPct(5.1)).toBe("investigate");
    expect(flagForDeviationPct(2.1)).toBe("watch");
    expect(flagForDeviationPct(-2.1)).toBe("below_sop");
    expect(flagForDeviationPct(1)).toBe("ok");
    expect(flagForDeviationPct(-1)).toBe("ok");
    // Boundaries are exclusive on the "investigate"/"below_sop" side but each
    // threshold still satisfies the next tier down (5% is not >5% but is >2%).
    expect(flagForDeviationPct(5)).toBe("watch");
    expect(flagForDeviationPct(2)).toBe("ok");
    expect(flagForDeviationPct(-2)).toBe("ok");
  });
});

describe("computeDeviation", () => {
  it("computes unexplained = actual - sop - wastage, and value = qty * rate", () => {
    const result = computeDeviation(
      { sopUsageQty: 100, actualUsageQty: 112, wastageQty: 4 },
      65,
    );
    expect(result.unexplainedQty).toBe(8);
    expect(result.deviationPct).toBe(8);
    expect(result.unexplainedValue).toBe(520);
    expect(result.flag).toBe("investigate");
  });

  it("handles a below-SOP (negative deviation) ingredient", () => {
    const result = computeDeviation(
      { sopUsageQty: 200, actualUsageQty: 190, wastageQty: 5 },
      10,
    );
    expect(result.unexplainedQty).toBe(-15);
    expect(result.deviationPct).toBe(-7.5);
    expect(result.flag).toBe("below_sop");
  });
});

describe("computePurchasePriceVariance", () => {
  it("is (rate paid - standard rate) * qty", () => {
    expect(computePurchasePriceVariance(50, 145, 140)).toBe(250);
    expect(computePurchasePriceVariance(50, 135, 140)).toBe(-250);
  });
});

describe("resolveEffectiveSopLines + computeSopUsageFromSales", () => {
  const generic: SopLine = {
    menuItemCode: "M01",
    ingredientKey: "chicken",
    qtyPerPortion: 0.35,
    yieldPct: 100,
    appliesTo: "ALL",
    effectiveFrom: "2025-12-01",
    effectiveTo: null,
    version: 1,
  };
  const override: SopLine = { ...generic, qtyPerPortion: 0.4, appliesTo: "B01" };

  it("a branch-specific line replaces the generic line for that branch only", () => {
    const forB01 = resolveEffectiveSopLines([generic, override], "B01", "2026-08-15");
    const forB02 = resolveEffectiveSopLines([generic, override], "B02", "2026-08-15");
    expect(forB01).toHaveLength(1);
    expect(forB01[0].qtyPerPortion).toBe(0.4);
    expect(forB02).toHaveLength(1);
    expect(forB02[0].qtyPerPortion).toBe(0.35);
  });

  it("sums portions sold x qty per portion / yield across menu items", () => {
    const lines = resolveEffectiveSopLines([generic], "B02", "2026-08-15");
    const usage = computeSopUsageFromSales(lines, "chicken", { M01: 1000 });
    expect(usage).toBe(350); // 1000 portions * 0.35kg
  });

  it("respects effectiveFrom/effectiveTo windows", () => {
    const superseded: SopLine = { ...generic, effectiveTo: "2026-01-31" };
    const replacement: SopLine = {
      ...generic,
      qtyPerPortion: 0.3,
      effectiveFrom: "2026-02-01",
      version: 2,
    };
    const before = resolveEffectiveSopLines(
      [superseded, replacement],
      "B01",
      "2026-01-15",
    );
    const after = resolveEffectiveSopLines(
      [superseded, replacement],
      "B01",
      "2026-03-01",
    );
    expect(before[0].qtyPerPortion).toBe(0.35);
    expect(after[0].qtyPerPortion).toBe(0.3);
  });
});
