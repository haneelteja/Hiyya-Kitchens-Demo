import { describe, expect, it } from "vitest";
import { wastageByReasonSplit } from "@/lib/calc/wastage";

describe("wastageByReasonSplit", () => {
  it("sums back to the input total exactly", () => {
    const split = wastageByReasonSplit(92_217);
    expect(split.reduce((s, r) => s + r.value, 0)).toBe(92_217);
    expect(split).toHaveLength(6);
  });
  it("orders Over-portioning as the largest share", () => {
    const split = wastageByReasonSplit(100_000);
    const max = [...split].sort((a, b) => b.value - a.value)[0];
    expect(max.reason).toBe("Over-portioning");
  });
});
