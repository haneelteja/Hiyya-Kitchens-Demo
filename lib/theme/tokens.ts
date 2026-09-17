/**
 * HIYYA design tokens as plain values, for anywhere a Tailwind class won't reach
 * (ECharts option objects, three.js materials/lights). CSS-variable versions of
 * the same values live in app/globals.css for everything else.
 */
export const hiyyaColors = {
  bg: "#000000",
  panel: "#110F0C",
  panel2: "#1B1813",
  gold: "#D4AF37",
  champagne: "#F2DFA7",
  deepGold: "#8A6C2A",
  bronze: "#B07A3A",
  platinum: "#B9B6AE",
  text: "#F3ECDC",
  muted: "#9A907E",
  gain: "#9CCB9F",
  loss: "#D8674F",
  warning: "#E6BE5A",
} as const;

export const branchColors: Record<string, string> = {
  B01: hiyyaColors.gold,
  B02: hiyyaColors.champagne,
  B03: hiyyaColors.bronze,
  B04: hiyyaColors.platinum,
};

/** Tonal gold ramp for category/expense charts (Section 9). */
export const goldRamp = [
  hiyyaColors.gold,
  hiyyaColors.champagne,
  hiyyaColors.bronze,
  hiyyaColors.platinum,
  hiyyaColors.deepGold,
];
