import { dataset } from "@/lib/data/mock/dataset";
import type { BranchCode } from "@/lib/data/types";

/**
 * A stylized procedural design for the 3D throne stage per branch theme,
 * each reading against that theme's actual physical photo-booth throne
 * without attempting to literally recreate a sculpted prop in code:
 * - "dino": Dino Mandi's gold/bronze phoenix throne — a perched phoenix
 *   topper, ember-glow orb feet.
 * - "chrono_jail": Chrono Jail Mandi's bone/antler throne — bone-white,
 *   rough-stone dais, branching antler spikes, no cushion.
 * - "jail": a cold-iron prison throne — vertical cell bars behind the seat.
 * - "space": a chrome/platinum throne with a halo ring and star-point glow.
 * - "signature": the original brand-wide gold design, used for the grand
 *   hero throne (Brand Owner/Manager) and anywhere no single theme applies.
 */
export type ThroneSkin = "signature" | "dino" | "chrono_jail" | "jail" | "space";

const THEME_TO_SKIN: Record<string, ThroneSkin> = {
  Dino: "dino",
  "Chrono Jail": "chrono_jail",
  Jail: "jail",
  Space: "space",
};

export function throneSkinForBranch(branchCode: string): ThroneSkin {
  const branch = dataset.branches.find((b) => b.code === branchCode);
  return (branch && THEME_TO_SKIN[branch.theme]) ?? "signature";
}

export function throneSkinForBranches(codes: BranchCode[]): ThroneSkin {
  return codes.length === 1 ? throneSkinForBranch(codes[0]) : "signature";
}
