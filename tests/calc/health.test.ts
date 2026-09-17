import { describe, expect, it } from "vitest";
import {
  computeHealth,
  computeRecipeImpact,
  computeTodayTarget,
} from "@/lib/calc/health";

describe("computeHealth", () => {
  it("needs_action if margin < 0 or deviation > 6%", () => {
    expect(computeHealth(-1, 0)).toBe("needs_action");
    expect(computeHealth(10, 6.1)).toBe("needs_action");
  });
  it("watch if margin < 8% or deviation > 4% (and not needs_action)", () => {
    expect(computeHealth(5, 0)).toBe("watch");
    expect(computeHealth(10, 4.5)).toBe("watch");
  });
  it("healthy otherwise", () => {
    expect(computeHealth(10, 1)).toBe("healthy");
  });
});

describe("computeTodayTarget", () => {
  it("is the average of the same weekday's sales this month, x1.05", () => {
    expect(computeTodayTarget([100_000, 110_000, 90_000])).toBeCloseTo(100_000 * 1.05, 6);
  });
  it("is 0 with no history", () => {
    expect(computeTodayTarget([])).toBe(0);
  });
});

describe("computeRecipeImpact", () => {
  it("Δ SOP usage = (new qty - current qty) x portions sold, and recomputes deviation %", () => {
    const impact = computeRecipeImpact({
      currentQtyPerPortion: 0.35,
      newQtyPerPortion: 0.3,
      portionsSold: 1000,
      actualUsageQty: 400,
      wastageQty: 10,
      currentSopUsageQty: 350,
    });
    expect(impact.deltaSopUsage).toBeCloseTo(-50, 6); // (0.3-0.35)*1000
    expect(impact.newSopUsageQty).toBeCloseTo(300, 6);
    expect(impact.newUnexplainedQty).toBeCloseTo(90, 6); // 400 - 300 - 10
    expect(impact.newDeviationPct).toBeCloseTo(30, 6);
  });
});
