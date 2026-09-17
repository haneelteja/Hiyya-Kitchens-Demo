/**
 * Builds lib/data/demo.json.
 *
 * The spec (repo layout, Section 6) names two input scripts:
 *   - extract-demo-json.ts, pulling data from reference/hiyya-brand-owner-dashboard.html's
 *     <script id="data" type="application/json">
 *   - seed-from-xlsx.ts, parsing the client's SOP/Stock/Wastage workbook
 *
 * Neither input exists in this repo (see docs/QUERY_TRACKER.md Q00/Q00a) — the reference
 * HTML doesn't embed a JSON data island in that format, and the workbook was never
 * provided. This script is the documented stand-in: it takes the Section 10 acceptance
 * table (the one piece of real, exact data we do have) as hard constants, and derives
 * everything else the UI needs — reconciled exactly back to those constants, never the
 * other way around. Replace this script wholesale with the real seed-from-xlsx.ts the
 * moment the workbook arrives; nothing downstream (types, calc engine, components)
 * should need to change, because they all consume the same DemoDataset shape.
 *
 * Run: pnpm exec tsx scripts/build-demo-data.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import type {
  Branch,
  ChannelShare,
  DemoDataset,
  FixedCost,
  Ingredient,
  IngredientKey,
  IngredientUsageRow,
  MenuItem,
  MonthlyPnlInput,
  Persona,
  Purchase,
  RevenueShareTerm,
  SopLine,
  StockOnHand,
  Theme,
  WastageEntry,
} from "../lib/data/types";
import { DemoDataset as DemoDatasetSchema } from "../lib/data/types";

// ---------------------------------------------------------------------------
// Section 10 acceptance table — exact, authoritative constants.
// ---------------------------------------------------------------------------
const SECTION_10 = {
  B01: {
    sales: 4020400,
    foodCostAtSop: 1422705,
    actualFoodCost: 1515670,
    netProfit: 873918,
  },
  B02: {
    sales: 3668433,
    foodCostAtSop: 1296424,
    actualFoodCost: 1341969,
    netProfit: 593296,
  },
  B03: {
    sales: 3229436,
    foodCostAtSop: 1166705,
    actualFoodCost: 1231632,
    netProfit: 333097,
  },
  B04: {
    sales: 2459206,
    foodCostAtSop: 863391,
    actualFoodCost: 932133,
    netProfit: 17568,
  },
} as const;
const BRAND_DEVIATION_TARGET = 179962;
const AUG = "2026-08";

// Documented demo assumptions (pending Q06/Q09/Q11 — flagged in docs/QUERY_TRACKER.md).
const ONLINE_SHARE = 0.4;
const COMMISSION_RATE = 0.22;
const ROYALTY_RATE = 0.06;
const FUND_RATE = 0.02;
const IS_FRANCHISE: Record<string, boolean> = {
  B01: false,
  B02: true,
  B03: true,
  B04: true,
};

// deviation/wastage split of (actualFoodCost - foodCostAtSop) per branch, chosen so the
// brand totals hit the acceptance table's named figures exactly (see docs/DATA_CONTRACT.md
// for the derivation and the one unavoidable ±₹1 rounding note).
const WASTAGE_VALUE: Record<string, number> = {
  B01: 29000,
  B02: 18000,
  B03: 23000,
  B04: 22217,
};

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Masters
// ---------------------------------------------------------------------------
const branches: Branch[] = [
  {
    code: "B01",
    name: "Chrono Jail Mandi",
    location: "Madhapur, Hyderabad, TS",
    theme: "Chrono Jail",
    ownership: "brand",
    ownerName: "Brand (Gautamy Chowdary, Gautham, Vikranth)",
    openedOn: "2025-12-01",
  },
  {
    code: "B02",
    name: "Dino Mandi",
    location: "Kukatpally (GPR Multiplex), Hyderabad, TS",
    theme: "Dino",
    ownership: "franchise",
    ownerName: "Suresh Reddy",
    openedOn: "2026-05-08",
  },
  {
    code: "B03",
    name: "Jail Mandi Vizag",
    location: "Dwaraka Nagar, Visakhapatnam, AP",
    theme: "Jail",
    ownership: "franchise",
    ownerName: "Suresh Reddy",
    openedOn: "2026-03-18", // assumed — Q07
  },
  {
    code: "B04",
    name: "Space Mandi",
    location: "Ameerpet, Hyderabad, TS",
    theme: "Space",
    ownership: "franchise",
    ownerName: "Anil Kumar",
    openedOn: "2026-07-04", // demo assumption — Q07
  },
];

const themes: Theme[] = [
  { name: "Chrono Jail", branchCode: "B01", colorToken: "gold" },
  { name: "Dino", branchCode: "B02", colorToken: "champagne" },
  { name: "Jail", branchCode: "B03", colorToken: "bronze" },
  { name: "Space", branchCode: "B04", colorToken: "platinum" },
];

const personas: Persona[] = [
  {
    id: "owner",
    label: "Brand Owner: Gautamy Chowdary",
    role: "brand_owner",
    branchCodes: "all",
  },
  {
    id: "bm",
    label: "Brand Manager: Ravi Teja (demo)",
    role: "brand_manager",
    branchCodes: "all",
  },
  {
    id: "bo1",
    label: "Branch Owner: Suresh Reddy (demo)",
    role: "branch_owner",
    branchCodes: ["B02", "B03"],
  },
  {
    id: "bo2",
    label: "Branch Owner: Anil Kumar (demo)",
    role: "branch_owner",
    branchCodes: ["B04"],
  },
  {
    id: "mg1",
    label: "Branch Manager: Kiran (demo)",
    role: "branch_manager",
    branchCodes: ["B02"],
  },
  {
    id: "mg2",
    label: "Branch Manager: Farhan (demo)",
    role: "branch_manager",
    branchCodes: ["B01"],
  },
];

const RATE: Record<IngredientKey, number> = {
  chicken: 210,
  mutton: 680,
  fish: 320,
  rice: 65,
  ghee: 550,
  oil: 140,
  mayo: 220,
  milk: 58,
  cheese: 450,
};
const UNIT: Record<IngredientKey, "kg" | "L"> = {
  chicken: "kg",
  mutton: "kg",
  fish: "kg",
  rice: "kg",
  ghee: "kg",
  oil: "L",
  mayo: "kg",
  milk: "L",
  cheese: "kg",
};
const INGREDIENT_NAME: Record<IngredientKey, string> = {
  chicken: "Chicken (dressed)",
  mutton: "Mutton",
  fish: "Fish",
  rice: "Basmati rice",
  ghee: "Ghee",
  oil: "Refined oil",
  mayo: "Mayonnaise",
  milk: "Milk",
  cheese: "Cheese",
};
const ingredients: Ingredient[] = (Object.keys(RATE) as IngredientKey[]).map((key) => ({
  key,
  name: INGREDIENT_NAME[key],
  unit: UNIT[key],
  standardRate: RATE[key],
}));

const menuItems: MenuItem[] = [
  {
    code: "M01",
    name: "Chicken Juicy Mandi (Large)",
    category: "Mandi",
    price: 320,
    linkedIngredients: ["chicken", "rice", "ghee", "oil"],
  },
  {
    code: "M02",
    name: "Mutton Mandi",
    category: "Mandi",
    price: 380,
    linkedIngredients: ["mutton", "rice", "ghee"],
  },
  {
    code: "M03",
    name: "Fish Mandi",
    category: "Mandi",
    price: 340,
    linkedIngredients: ["fish", "rice", "oil"],
  },
  {
    code: "M04",
    name: "Chicken Chekkalu",
    category: "Starters",
    price: 180,
    linkedIngredients: ["chicken", "rice", "oil"],
  },
  {
    code: "M05",
    name: "Street Style Chicken Pakoda",
    category: "Starters",
    price: 190,
    linkedIngredients: ["chicken", "oil", "mayo"],
  },
  {
    code: "M06",
    name: "Cheesy Kurkure Mushroom",
    category: "Starters",
    price: 210,
    linkedIngredients: ["cheese", "oil"],
  },
  {
    code: "M07",
    name: "Kaddu Ka Kheer",
    category: "Desserts",
    price: 120,
    linkedIngredients: ["milk", "ghee"],
  },
  {
    code: "M08",
    name: "Apricot Delight",
    category: "Desserts",
    price: 140,
    linkedIngredients: ["milk", "ghee"],
  },
];

// Generic SOP recipe (qty per single portion, in the ingredient's unit), plus one
// branch override to exercise the "branch-specific row replaces generic" rule.
const GENERIC_QTY: Record<string, Partial<Record<IngredientKey, number>>> = {
  M01: { chicken: 0.35, rice: 0.28, ghee: 0.03, oil: 0.02 },
  M02: { mutton: 0.32, rice: 0.28, ghee: 0.03 },
  M03: { fish: 0.3, rice: 0.28, oil: 0.02 },
  M04: { chicken: 0.12, rice: 0.05, oil: 0.03 },
  M05: { chicken: 0.15, oil: 0.04, mayo: 0.02 },
  M06: { cheese: 0.08, oil: 0.03 },
  M07: { milk: 0.15, ghee: 0.01 },
  M08: { milk: 0.12, ghee: 0.01 },
};
const sopLines: SopLine[] = [];
for (const [menuItemCode, qtyMap] of Object.entries(GENERIC_QTY)) {
  for (const [ingredientKey, qtyPerPortion] of Object.entries(qtyMap)) {
    sopLines.push({
      menuItemCode,
      ingredientKey: ingredientKey as IngredientKey,
      qtyPerPortion,
      yieldPct: 100,
      appliesTo: "ALL",
      effectiveFrom: "2025-12-01",
      effectiveTo: null,
      version: 1,
    });
  }
}
// Branch override: the flagship uses a larger chicken portion on its signature dish.
sopLines.push({
  menuItemCode: "M01",
  ingredientKey: "chicken",
  qtyPerPortion: 0.38,
  yieldPct: 100,
  appliesTo: "B01",
  effectiveFrom: "2025-12-01",
  effectiveTo: null,
  version: 1,
});

// ---------------------------------------------------------------------------
// Branch-level P&L reconciliation (see docs/DATA_CONTRACT.md for the derivation)
// ---------------------------------------------------------------------------
const monthlyPnl: MonthlyPnlInput[] = [];
const fixedCosts: FixedCost[] = [];
const revenueShareTerms: RevenueShareTerm[] = [];
const channelShares: ChannelShare[] = [];

const FIXED_COST_WEIGHTS: Record<string, number> = {
  Salaries: 0.4,
  Rent: 0.3,
  Electricity: 0.1,
  Gas: 0.05,
  Maintenance: 0.05,
  Marketing: 0.03,
  Water: 0.03,
  Software: 0.02,
  Security: 0.02,
};

const augFixedCostsByBranch: Record<string, number> = {};

for (const code of Object.keys(SECTION_10) as (keyof typeof SECTION_10)[]) {
  const { sales, foodCostAtSop, actualFoodCost, netProfit } = SECTION_10[code];
  const commission = Math.round(sales * ONLINE_SHARE * COMMISSION_RATE);
  const royalty = IS_FRANCHISE[code] ? Math.round(sales * ROYALTY_RATE) : 0;
  const fund = IS_FRANCHISE[code] ? Math.round(sales * FUND_RATE) : 0;
  const fixedTotal = sales - actualFoodCost - commission - royalty - fund - netProfit;
  augFixedCostsByBranch[code] = fixedTotal;

  monthlyPnl.push({
    branchCode: code,
    month: AUG,
    netSales: sales,
    actualFoodCost,
    foodCostAtSop,
    onlineSalesShare: ONLINE_SHARE,
  });

  revenueShareTerms.push({
    branchCode: code,
    royaltyPct: IS_FRANCHISE[code] ? ROYALTY_RATE : 0,
    marketingFundPct: IS_FRANCHISE[code] ? FUND_RATE : 0,
    effectiveFrom: "2025-12-01",
  });

  channelShares.push(
    { branchCode: code, month: AUG, channel: "Dine-in", pct: 1 - ONLINE_SHARE },
    { branchCode: code, month: AUG, channel: "Swiggy", pct: ONLINE_SHARE * 0.55 },
    { branchCode: code, month: AUG, channel: "Zomato", pct: ONLINE_SHARE * 0.45 },
  );

  const heads = Object.keys(FIXED_COST_WEIGHTS);
  let running = 0;
  heads.forEach((head, i) => {
    const amount =
      i === heads.length - 1
        ? fixedTotal - running
        : Math.round(fixedTotal * FIXED_COST_WEIGHTS[head]);
    running += amount;
    fixedCosts.push({
      branchCode: code,
      month: AUG,
      head: head as FixedCost["head"],
      amount,
      enteredBy: "demo",
    });
  });
}

// Monthly history: open month -> Aug 2026, ramping up to the exact Aug figures above.
// Demo trend data only — not asserted by the acceptance tests, which check Aug alone.
function monthsBetween(openedOn: string, upTo: string): string[] {
  const [oy, om] = openedOn.split("-").map(Number);
  const [uy, um] = upTo.split("-").map(Number);
  const out: string[] = [];
  let y = oy;
  let m = om;
  while (y < uy || (y === uy && m <= um)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}
for (const branch of branches) {
  const months = monthsBetween(branch.openedOn.slice(0, 7), AUG);
  if (months.length <= 1) continue; // opened this same month — Aug is the only data point
  const rnd = mulberry32(branch.code.charCodeAt(2) * 97 + 13);
  const aug = SECTION_10[branch.code];
  const n = months.length - 1; // index of Aug
  const rampStart = 0.55;
  months.slice(0, -1).forEach((month, i) => {
    const f = rampStart + (1 - rampStart) * Math.pow((i + 1) / (n + 1), 0.7);
    const noise = 0.97 + rnd() * 0.06;
    const netSales = Math.round(aug.sales * f * noise);
    const ratio = netSales / aug.sales;
    monthlyPnl.push({
      branchCode: branch.code,
      month,
      netSales,
      actualFoodCost: Math.round(aug.actualFoodCost * ratio),
      foodCostAtSop: Math.round(aug.foodCostAtSop * ratio),
      onlineSalesShare: ONLINE_SHARE,
    });
  });
}

// ---------------------------------------------------------------------------
// Daily Aug sales — seeded weekday-weighted allocation summing exactly to the
// branch's Aug net sales.
// ---------------------------------------------------------------------------
const DAYS_IN_AUG = 31; // Section 3: the manager demo date is Monday 31 Aug 2026
const dailySalesAug: DemoDataset["dailySalesAug"] = [];
for (const branch of branches) {
  const total = SECTION_10[branch.code].sales;
  const rnd = mulberry32(branch.code.charCodeAt(2) * 53 + 7);
  const weights: number[] = [];
  for (let d = 1; d <= DAYS_IN_AUG; d += 1) {
    const dow = new Date(Date.UTC(2026, 7, d)).getUTCDay();
    let w = 1 + (dow === 5 || dow === 6 ? 0.45 : 0) + (dow === 0 ? 0.25 : 0);
    w *= 0.85 + rnd() * 0.3;
    weights.push(w);
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  let running = 0;
  weights.forEach((w, i) => {
    const day = i + 1;
    const netSales =
      day === DAYS_IN_AUG ? total - running : Math.round((total * w) / weightSum);
    running += netSales;
    dailySalesAug.push({
      branchCode: branch.code,
      date: `2026-08-${String(day).padStart(2, "0")}`,
      netSales,
    });
  });
}

// ---------------------------------------------------------------------------
// Ingredient usage (Aug) — SOP/actual/wastage per branch x ingredient, reconciled
// exactly to the branch deviation/wastage totals derived above.
// ---------------------------------------------------------------------------
type BranchIngredientConfig = {
  sopBase: Record<IngredientKey, number>;
  investigatePct: Partial<Record<IngredientKey, number>>;
  wastageWeights: Record<IngredientKey, number>;
};
const BRANCH_CONFIG: Record<string, BranchIngredientConfig> = {
  B01: {
    sopBase: {
      chicken: 3000,
      mutton: 200,
      fish: 150,
      rice: 6200,
      ghee: 490,
      oil: 1400,
      mayo: 620,
      milk: 800,
      cheese: 300,
    },
    investigatePct: { rice: 5.3, ghee: 6.4, oil: 11.4 },
    wastageWeights: {
      rice: 8,
      oil: 6,
      chicken: 5,
      ghee: 3,
      mayo: 2.5,
      fish: 1.8,
      milk: 1.5,
      cheese: 0.9,
      mutton: 0.3,
    },
  },
  B02: {
    sopBase: {
      chicken: 2600,
      mutton: 150,
      fish: 120,
      rice: 4400,
      ghee: 340,
      oil: 2450,
      mayo: 600,
      milk: 500,
      cheese: 250,
    },
    investigatePct: { milk: 7.5 },
    wastageWeights: {
      chicken: 5,
      oil: 4,
      rice: 3,
      mayo: 2,
      ghee: 1.5,
      fish: 1,
      cheese: 0.8,
      mutton: 0.5,
      milk: 0.2,
    },
  },
  B03: {
    sopBase: {
      chicken: 2800,
      mutton: 450,
      fish: 750,
      rice: 3600,
      ghee: 400,
      oil: 1900,
      mayo: 1050,
      milk: 600,
      cheese: 280,
    },
    investigatePct: { chicken: 5.4, fish: 8 },
    wastageWeights: {
      fish: 4,
      mutton: 3,
      rice: 3,
      oil: 2.5,
      mayo: 2,
      ghee: 1.5,
      milk: 1,
      cheese: 0.6,
      chicken: 4.4,
    },
  },
  B04: {
    sopBase: {
      chicken: 1200,
      mutton: 90,
      fish: 100,
      rice: 2150,
      ghee: 180,
      oil: 1600,
      mayo: 720,
      milk: 350,
      cheese: 450,
    },
    investigatePct: { chicken: 5.2, oil: 5.5, mayo: 8, cheese: 7 },
    wastageWeights: {
      oil: 5,
      chicken: 4,
      mayo: 3,
      cheese: 2.5,
      rice: 2,
      ghee: 1.5,
      milk: 1,
      fish: 0.7,
      mutton: 0.3,
    },
  },
};

const ingredientUsageAug: IngredientUsageRow[] = [];
for (const branch of branches) {
  const cfg = BRANCH_CONFIG[branch.code];
  const keys = Object.keys(cfg.sopBase) as IngredientKey[];
  const deviationTotal =
    SECTION_10[branch.code].actualFoodCost -
    SECTION_10[branch.code].foodCostAtSop -
    WASTAGE_VALUE[branch.code];
  const wastageTotal = WASTAGE_VALUE[branch.code];

  const investigateKeys = Object.keys(cfg.investigatePct) as IngredientKey[];
  const devValue: Partial<Record<IngredientKey, number>> = {};
  let investSum = 0;
  for (const k of investigateKeys) {
    const pct = cfg.investigatePct[k]!;
    const qty = (pct / 100) * cfg.sopBase[k];
    const value = Math.round(qty * RATE[k]);
    devValue[k] = value;
    investSum += value;
  }
  const others = keys.filter((k) => !investigateKeys.includes(k));
  const remainder = deviationTotal - investSum;
  const weightSum = others.reduce((a, k) => a + cfg.sopBase[k] * RATE[k], 0);
  let running = 0;
  others.forEach((k, i) => {
    const value =
      i === others.length - 1
        ? remainder - running
        : Math.round((remainder * (cfg.sopBase[k] * RATE[k])) / weightSum);
    devValue[k] = value;
    running += value;
  });

  const wKeys = Object.keys(cfg.wastageWeights) as IngredientKey[];
  const wWeightSum = wKeys.reduce((a, k) => a + cfg.wastageWeights[k], 0);
  const wastageValue: Partial<Record<IngredientKey, number>> = {};
  let wRunning = 0;
  wKeys.forEach((k, i) => {
    const value =
      i === wKeys.length - 1
        ? wastageTotal - wRunning
        : Math.round((cfg.wastageWeights[k] / wWeightSum) * wastageTotal);
    wastageValue[k] = value;
    wRunning += value;
  });

  for (const k of keys) {
    const sop = cfg.sopBase[k];
    const unexplainedQty = devValue[k]! / RATE[k];
    const wastageQty = wastageValue[k]! / RATE[k];
    ingredientUsageAug.push({
      branchCode: branch.code,
      period: AUG,
      ingredientKey: k,
      sopUsageQty: Math.round(sop * 100) / 100,
      actualUsageQty: Math.round((sop + wastageQty + unexplainedQty) * 100) / 100,
      wastageQty: Math.round(wastageQty * 100) / 100,
    });
  }
}

// ---------------------------------------------------------------------------
// Light operational data (Branch Manager screens) — representative, not
// reconciled to a real ledger. See docs/DATA_CONTRACT.md and Q02/Q03/Q09/Q10.
// ---------------------------------------------------------------------------
const stockOnHand: StockOnHand[] = [];
const purchases: Purchase[] = [];
const wastageEntries: WastageEntry[] = [];
const SUPPLIERS = [
  "Sri Lakshmi Traders",
  "Godavari Fresh Foods",
  "Krishna Wholesale Mart",
];

for (const branch of branches) {
  const rnd = mulberry32(branch.code.charCodeAt(2) * 71 + 3);
  const rows = ingredientUsageAug.filter((r) => r.branchCode === branch.code);
  for (const row of rows) {
    const avgDailyUsage = Math.round((row.actualUsageQty / DAYS_IN_AUG) * 100) / 100;
    const coverDays = 1 + rnd() * 8;
    stockOnHand.push({
      branchCode: branch.code,
      ingredientKey: row.ingredientKey,
      qtyOnHand: Math.round(avgDailyUsage * coverDays * 100) / 100,
      avgDailyUsage,
    });
  }
  // A handful of representative purchases and wastage log entries per branch.
  rows.slice(0, 3).forEach((row, i) => {
    const rate = RATE[row.ingredientKey];
    purchases.push({
      id: `${branch.code}-P${i + 1}`,
      branchCode: branch.code,
      date: `2026-08-${String(5 + i * 8).padStart(2, "0")}`,
      ingredientKey: row.ingredientKey,
      qty: Math.round(row.actualUsageQty * 0.35 * 100) / 100,
      ratePaid: Math.round(rate * (1 + (rnd() * 0.03 - 0.01)) * 10) / 10,
      supplier: SUPPLIERS[i % SUPPLIERS.length],
      invoiceRef: `INV-${branch.code}-${1000 + i}`,
    });
  });
  const reasons: WastageEntry["reason"][] = [
    "Over-portioning",
    "Spillage / handling",
    "Expiry",
    "Prep waste",
    "Kitchen error",
    "Customer return",
  ];
  rows.slice(0, 3).forEach((row, i) => {
    wastageEntries.push({
      id: `${branch.code}-W${i + 1}`,
      branchCode: branch.code,
      date: `2026-08-${String(3 + i * 9).padStart(2, "0")}`,
      ingredientKey: row.ingredientKey,
      qty: Math.round(row.wastageQty * 0.3 * 100) / 100,
      reason: reasons[i % reasons.length],
    });
  });
}

const aggregatorTerms = [
  { channel: "Swiggy" as const, commissionPct: COMMISSION_RATE },
  { channel: "Zomato" as const, commissionPct: COMMISSION_RATE },
];

// ---------------------------------------------------------------------------
// Assemble, validate, write.
// ---------------------------------------------------------------------------
const dataset: DemoDataset = {
  branches,
  themes,
  personas,
  ingredients,
  menuItems,
  sopLines,
  monthlyPnl,
  dailySalesAug,
  ingredientUsageAug,
  fixedCosts,
  revenueShareTerms,
  aggregatorTerms,
  channelShares,
  wastageEntries,
  purchases,
  stockCounts: [],
  stockOnHand,
  transfers: [],
};

const parsed = DemoDatasetSchema.parse(dataset); // throws on shape mismatch

// Sanity check against the brand-level acceptance totals before writing anything.
const brandDeviation = ingredientUsageAug.reduce((sum, r) => {
  const rate = RATE[r.ingredientKey];
  return sum + (r.actualUsageQty - r.sopUsageQty - r.wastageQty) * rate;
}, 0);
if (Math.abs(Math.round(brandDeviation) - BRAND_DEVIATION_TARGET) > 5) {
  throw new Error(
    `Brand unexplained deviation reconciled to ${Math.round(brandDeviation)}, expected ${BRAND_DEVIATION_TARGET} (±5)`,
  );
}

const outPath = path.resolve(__dirname, "../lib/data/demo.json");
writeFileSync(outPath, JSON.stringify(parsed, null, 2) + "\n", "utf-8");
// eslint-disable-next-line no-console
console.log(
  `Wrote ${outPath} — brand unexplained deviation ₹${Math.round(brandDeviation).toLocaleString("en-IN")}`,
);
