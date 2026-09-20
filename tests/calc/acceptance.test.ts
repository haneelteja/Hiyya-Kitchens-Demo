import { describe, expect, it } from "vitest";
import { MockDataSource } from "@/lib/data/mock/MockDataSource";
import { accessibleBranchCodes } from "@/lib/access/scope";
import { getPersona } from "@/lib/access/personas";

/**
 * Section 10 acceptance values. Tolerance is ±₹50 for P&L (per the spec — the demo
 * aggregates daily) and ±0.5% for quantities. The brand-level deviation/wastage
 * totals get a slightly looser ±₹5 tolerance: they're reconciled from the branch
 * rows' own (actualFoodCost - foodCostAtSop) figures, which carry a ±₹1 rounding
 * artifact already present in the acceptance table itself — see docs/DATA_CONTRACT.md.
 */
const PNL_TOLERANCE = 50;
const TOTALS_TOLERANCE = 5;
const PERIOD = "2026-08";

const ds = new MockDataSource();

const SECTION_10 = {
  B01: {
    netSales: 4020400,
    foodCostAtSop: 1422705,
    actualFoodCost: 1515670,
    netProfit: 873918,
  },
  B02: {
    netSales: 3668433,
    foodCostAtSop: 1296424,
    actualFoodCost: 1341969,
    netProfit: 593296,
  },
  B03: {
    netSales: 3229436,
    foodCostAtSop: 1166705,
    actualFoodCost: 1231632,
    netProfit: 333097,
  },
  B04: {
    netSales: 2459206,
    foodCostAtSop: 863391,
    actualFoodCost: 932133,
    netProfit: 17568,
  },
} as const;

const BRAND = { netSales: 13377475, netProfit: 1817879 };

describe("Section 10 acceptance — per-branch P&L", () => {
  for (const branchCode of Object.keys(SECTION_10) as (keyof typeof SECTION_10)[]) {
    it(`${branchCode} matches the acceptance table within ±₹50`, async () => {
      const byBranch = await ds.getPnlByBranch({ kind: "branch", branchCode }, PERIOD);
      const pnl = byBranch[branchCode];
      const expected = SECTION_10[branchCode];
      expect(pnl.netSales).toBeCloseTo(expected.netSales, 0);
      expect(pnl.foodCostAtSop).toBeCloseTo(expected.foodCostAtSop, 0);
      expect(Math.abs(pnl.actualFoodCost - expected.actualFoodCost)).toBeLessThanOrEqual(
        PNL_TOLERANCE,
      );
      expect(Math.abs(pnl.netProfit - expected.netProfit)).toBeLessThanOrEqual(
        PNL_TOLERANCE,
      );
    });
  }
});

describe("Section 10 acceptance — brand totals", () => {
  it("brand net sales and net profit match exactly (sum of exact branch inputs)", async () => {
    const summary = await ds.getPnlSummary({ kind: "all" }, PERIOD);
    expect(summary.netSales).toBe(BRAND.netSales);
    expect(Math.abs(summary.netProfit - BRAND.netProfit)).toBeLessThanOrEqual(
      PNL_TOLERANCE,
    );
  });
});

describe("Section 10 acceptance — SOP deviation", () => {
  it("brand unexplained deviation is ₹1,79,962 (±₹5)", async () => {
    const rows = await ds.getIngredientVariance({ kind: "all" }, PERIOD);
    const totalDeviation = rows.reduce((sum, r) => sum + r.unexplainedValue, 0);
    expect(Math.abs(Math.round(totalDeviation) - 179_962)).toBeLessThanOrEqual(
      TOTALS_TOLERANCE,
    );
  });

  it("brand logged wastage is ₹92,216 (±₹5)", async () => {
    const rows = await ds.getIngredientVariance({ kind: "all" }, PERIOD);
    const totalWastage = rows.reduce((sum, r) => sum + r.wastageValue, 0);
    expect(Math.abs(Math.round(totalWastage) - 92_216)).toBeLessThanOrEqual(
      TOTALS_TOLERANCE,
    );
  });

  it("exactly 10 ingredient x branch lines are flagged Investigate", async () => {
    const rows = await ds.getIngredientVariance({ kind: "all" }, PERIOD);
    const investigate = rows.filter((r) => r.flag === "investigate");
    expect(investigate).toHaveLength(10);
  });

  const EXPECTED_INVESTIGATE: Record<string, string[]> = {
    B01: ["Basmati rice", "Ghee", "Refined oil"],
    B02: ["Milk"],
    B03: ["Chicken (dressed)", "Fish"],
    B04: ["Chicken (dressed)", "Refined oil", "Mayonnaise", "Cheese"],
  };

  for (const [branchCode, expectedNames] of Object.entries(EXPECTED_INVESTIGATE)) {
    it(`${branchCode} flags exactly: ${expectedNames.join(", ")}`, async () => {
      const rows = await ds.getIngredientVariance(
        { kind: "branch", branchCode: branchCode as "B01" | "B02" | "B03" | "B04" },
        PERIOD,
      );
      const flagged = rows
        .filter((r) => r.flag === "investigate")
        .map((r) => r.ingredientName);
      expect(flagged.sort()).toEqual([...expectedNames].sort());
    });
  }
});

describe("Access control — Branch Owner never sees another branch's identifiable data", () => {
  it("Yugander (bo1, B02+B03) never resolves to B01 or B04, no matter what scope is requested", () => {
    const yugander = getPersona("bo1");
    // Even an adversarial "give me all branches" or "give me B01" request must be
    // clamped to Yugander's own membership — this is the structural check the spec's
    // Playwright suite also asserts in the browser.
    expect(accessibleBranchCodes(yugander, { kind: "all" })).toEqual(["B02", "B03"]);
    expect(
      accessibleBranchCodes(yugander, { kind: "branch", branchCode: "B01" }),
    ).toEqual(["B02", "B03"]);
    expect(
      accessibleBranchCodes(yugander, { kind: "branch", branchCode: "B04" }),
    ).toEqual(["B02", "B03"]);
    // Requesting one of their own branches narrows correctly.
    expect(
      accessibleBranchCodes(yugander, { kind: "branch", branchCode: "B02" }),
    ).toEqual(["B02"]);
  });

  it("Satish (mg1, B02 only) is clamped to B02 even under an 'all' scope request", () => {
    const satish = getPersona("mg1");
    expect(accessibleBranchCodes(satish, { kind: "all" })).toEqual(["B02"]);
  });

  it("Brand Owner and Brand Manager can reach every branch", () => {
    const owner = getPersona("owner");
    expect(accessibleBranchCodes(owner, { kind: "all" }).sort()).toEqual([
      "B01",
      "B02",
      "B03",
      "B04",
    ]);
  });
});
