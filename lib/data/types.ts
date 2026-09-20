import { z } from "zod";

/**
 * Zod schemas for every data shape the platform works with.
 * These are the single source of truth for both the demo dataset
 * (lib/data/demo.json, validated at import time) and, later, whatever
 * SupabaseDataSource reads back from Postgres — same shapes, same rules.
 */

export const BranchCode = z.enum(["B01", "B02", "B03", "B04"]);
export type BranchCode = z.infer<typeof BranchCode>;

export const ThemeName = z.enum(["Chrono Jail", "Dino", "Jail", "Space"]);
export type ThemeName = z.infer<typeof ThemeName>;

export const PersonaId = z.enum(["owner", "bm", "bo1", "mg1"]);
export type PersonaId = z.infer<typeof PersonaId>;

export const PersonaRole = z.enum([
  "brand_owner",
  "brand_manager",
  "branch_owner",
  "branch_manager",
]);
export type PersonaRole = z.infer<typeof PersonaRole>;

export const Branch = z.object({
  code: BranchCode,
  name: z.string(),
  location: z.string(),
  theme: ThemeName,
  ownership: z.enum(["brand", "franchise"]),
  ownerName: z.string(),
  openedOn: z.string(), // ISO date
});
export type Branch = z.infer<typeof Branch>;

export const Theme = z.object({
  name: ThemeName,
  branchCode: BranchCode,
  colorToken: z.enum(["gold", "champagne", "bronze", "platinum"]),
});
export type Theme = z.infer<typeof Theme>;

export const Persona = z.object({
  id: PersonaId,
  label: z.string(),
  role: PersonaRole,
  branchCodes: z.union([z.literal("all"), z.array(BranchCode)]),
});
export type Persona = z.infer<typeof Persona>;

export const IngredientKey = z.enum([
  "chicken",
  "mutton",
  "fish",
  "rice",
  "ghee",
  "oil",
  "mayo",
  "milk",
  "cheese",
]);
export type IngredientKey = z.infer<typeof IngredientKey>;

export const Ingredient = z.object({
  key: IngredientKey,
  name: z.string(),
  unit: z.enum(["kg", "L"]),
  standardRate: z.number().positive(), // ₹ per unit
});
export type Ingredient = z.infer<typeof Ingredient>;

export const MenuItem = z.object({
  code: z.string(),
  name: z.string(),
  category: z.enum(["Mandi", "Starters", "Desserts", "Platters"]),
  price: z.number().positive(),
  linkedIngredients: z.array(IngredientKey),
});
export type MenuItem = z.infer<typeof MenuItem>;

/** A branch-specific line replaces the generic ("ALL") line for that branch only. */
export const SopLine = z.object({
  menuItemCode: z.string(),
  ingredientKey: IngredientKey,
  qtyPerPortion: z.number().nonnegative(), // in the ingredient's unit
  yieldPct: z.number().min(0).max(100).default(100),
  appliesTo: z.union([z.literal("ALL"), BranchCode]),
  effectiveFrom: z.string(), // ISO date
  effectiveTo: z.string().nullable().default(null),
  version: z.number().int().positive().default(1),
});
export type SopLine = z.infer<typeof SopLine>;

/** Monthly P&L series input — the raw facts computePnl() operates on. */
export const MonthlyPnlInput = z.object({
  branchCode: BranchCode,
  month: z.string(), // "YYYY-MM"
  netSales: z.number().nonnegative(),
  actualFoodCost: z.number().nonnegative(),
  foodCostAtSop: z.number().nonnegative(),
  onlineSalesShare: z.number().min(0).max(1), // fraction of netSales sold via aggregators
});
export type MonthlyPnlInput = z.infer<typeof MonthlyPnlInput>;

export const DailySales = z.object({
  branchCode: BranchCode,
  date: z.string(), // ISO date
  netSales: z.number().nonnegative(),
});
export type DailySales = z.infer<typeof DailySales>;

export const IngredientUsageRow = z.object({
  branchCode: BranchCode,
  period: z.string(), // "YYYY-MM"
  ingredientKey: IngredientKey,
  sopUsageQty: z.number(),
  actualUsageQty: z.number(),
  wastageQty: z.number().nonnegative(),
});
export type IngredientUsageRow = z.infer<typeof IngredientUsageRow>;

export const FixedCostHead = z.enum([
  "Rent",
  "Salaries",
  "Electricity",
  "Water",
  "Gas",
  "Maintenance",
  "Marketing",
  "Software",
  "Security",
]);
export type FixedCostHead = z.infer<typeof FixedCostHead>;

export const FixedCost = z.object({
  branchCode: BranchCode,
  month: z.string(), // "YYYY-MM"
  head: FixedCostHead,
  amount: z.number().nonnegative(),
  enteredBy: z.string().default("demo"),
});
export type FixedCost = z.infer<typeof FixedCost>;

export const RevenueShareTerm = z.object({
  branchCode: BranchCode,
  royaltyPct: z.number().min(0).max(1),
  marketingFundPct: z.number().min(0).max(1),
  effectiveFrom: z.string(),
});
export type RevenueShareTerm = z.infer<typeof RevenueShareTerm>;

export const AggregatorTerm = z.object({
  channel: z.enum(["Swiggy", "Zomato"]),
  commissionPct: z.number().min(0).max(1),
});
export type AggregatorTerm = z.infer<typeof AggregatorTerm>;

export const ChannelShare = z.object({
  branchCode: BranchCode,
  month: z.string(),
  channel: z.enum(["Dine-in", "Swiggy", "Zomato"]),
  pct: z.number().min(0).max(1),
});
export type ChannelShare = z.infer<typeof ChannelShare>;

export const WastageReason = z.enum([
  "Over-portioning",
  "Spillage / handling",
  "Expiry",
  "Prep waste",
  "Kitchen error",
  "Customer return",
]);
export type WastageReason = z.infer<typeof WastageReason>;

export const WastageEntry = z.object({
  id: z.string(),
  branchCode: BranchCode,
  date: z.string(),
  ingredientKey: IngredientKey,
  qty: z.number().positive(),
  reason: WastageReason,
  note: z.string().optional(),
});
export type WastageEntry = z.infer<typeof WastageEntry>;

export const Purchase = z.object({
  id: z.string(),
  branchCode: BranchCode,
  date: z.string(),
  ingredientKey: IngredientKey,
  qty: z.number().positive(),
  ratePaid: z.number().positive(),
  supplier: z.string(),
  invoiceRef: z.string().optional(),
});
export type Purchase = z.infer<typeof Purchase>;

export const StockCount = z.object({
  branchCode: BranchCode,
  date: z.string(),
  ingredientKey: IngredientKey,
  countType: z.enum(["opening", "closing", "spot"]),
  qty: z.number().nonnegative(),
});
export type StockCount = z.infer<typeof StockCount>;

export const StockOnHand = z.object({
  branchCode: BranchCode,
  ingredientKey: IngredientKey,
  qtyOnHand: z.number().nonnegative(),
  avgDailyUsage: z.number().nonnegative(),
});
export type StockOnHand = z.infer<typeof StockOnHand>;

export const Transfer = z.object({
  id: z.string(),
  fromBranch: BranchCode,
  toBranch: BranchCode,
  ingredientKey: IngredientKey,
  qty: z.number().positive(),
  date: z.string(),
});
export type Transfer = z.infer<typeof Transfer>;

/** Root shape of lib/data/demo.json, validated once at import time. */
export const DemoDataset = z.object({
  branches: z.array(Branch),
  themes: z.array(Theme),
  personas: z.array(Persona),
  ingredients: z.array(Ingredient),
  menuItems: z.array(MenuItem),
  sopLines: z.array(SopLine),
  monthlyPnl: z.array(MonthlyPnlInput),
  dailySalesAug: z.array(DailySales),
  ingredientUsageAug: z.array(IngredientUsageRow),
  fixedCosts: z.array(FixedCost),
  revenueShareTerms: z.array(RevenueShareTerm),
  aggregatorTerms: z.array(AggregatorTerm),
  channelShares: z.array(ChannelShare),
  wastageEntries: z.array(WastageEntry),
  purchases: z.array(Purchase),
  stockCounts: z.array(StockCount),
  stockOnHand: z.array(StockOnHand),
  transfers: z.array(Transfer),
});
export type DemoDataset = z.infer<typeof DemoDataset>;

/** A resolved scope: which branches a persona/session may see. */
export type Scope =
  | { kind: "all" }
  | { kind: "branch"; branchCode: BranchCode }
  | { kind: "theme"; theme: ThemeName }
  | { kind: "owner"; ownerName: string }
  | { kind: "own"; branchCodes: BranchCode[] };
