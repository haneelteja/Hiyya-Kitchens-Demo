import { describe, expect, it } from "vitest";
import { formatInr, formatMonthLabel, formatPct } from "@/lib/calc/format";

describe("formatInr", () => {
  it("groups digits the Indian way: ₹1,23,456", () => {
    expect(formatInr(123456)).toBe("₹1,23,456");
    expect(formatInr(1_33_77_475)).toBe("₹1,33,77,475");
  });
  it("compact form: ₹39.6 L above ₹1L", () => {
    expect(formatInr(39_60_000, { compact: true })).toBe("₹39.6 L");
  });
  it("compact form: ₹1.34 Cr above ₹1Cr", () => {
    expect(formatInr(1_34_00_000, { compact: true })).toBe("₹1.34 Cr");
  });
  it("handles negative values", () => {
    expect(formatInr(-5000)).toBe("-₹5,000");
  });
});

describe("formatMonthLabel", () => {
  it("is unambiguous across a year boundary (Dec -> Jan, not 12 -> 01)", () => {
    expect(formatMonthLabel("2025-12")).toBe("Dec");
    expect(formatMonthLabel("2026-01")).toBe("Jan");
    expect(formatMonthLabel("2026-08")).toBe("Aug");
  });
});

describe("formatPct", () => {
  it("prefixes a + sign for non-negative values", () => {
    expect(formatPct(6.4)).toBe("+6.4%");
    expect(formatPct(-3.1)).toBe("-3.1%");
    expect(formatPct(0)).toBe("+0.0%");
  });
});
