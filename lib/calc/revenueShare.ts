import type { RevenueShareTerm } from "@/lib/data/types";

export interface RevenueShareResult {
  netSales: number;
  royaltyPct: number;
  royalty: number;
  marketingFundPct: number;
  marketingFund: number;
  totalToBrand: number;
  branchKeeps: number;
}

/** What the brand receives vs. what each branch keeps, per its revenue-share terms. */
export function computeRevenueShare(
  netSales: number,
  term: RevenueShareTerm,
): RevenueShareResult {
  const royalty = netSales * term.royaltyPct;
  const marketingFund = netSales * term.marketingFundPct;
  const totalToBrand = royalty + marketingFund;
  return {
    netSales,
    royaltyPct: term.royaltyPct,
    royalty,
    marketingFundPct: term.marketingFundPct,
    marketingFund,
    totalToBrand,
    branchKeeps: netSales - totalToBrand,
  };
}
