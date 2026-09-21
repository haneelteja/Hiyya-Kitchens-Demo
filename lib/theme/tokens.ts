/**
 * HIYYA design tokens as plain values, for anywhere a Tailwind class won't
 * reach (ECharts option objects). CSS-variable versions of the same values
 * live in app/globals.css for everything else — both must be kept in sync by
 * hand when a palette changes, since ECharts can't consume a CSS custom
 * property directly.
 *
 * Two palettes: "dark" (the original black-and-gold look) and "pastel" (a
 * warm, cream-and-terracotta light theme — deliberately kept in the same
 * warm family as the dark theme's gold, rather than a generic cool pastel,
 * so switching themes still reads as HIYYA). Every chart and themed
 * component reads through `useThemeColors()` (hooks/useThemeColors.ts)
 * rather than importing a fixed palette, so a theme switch repaints charts
 * too — there is no static default export here on purpose, to make it
 * impossible for a new component to accidentally hardcode one theme.
 */
export type ThemeMode = "dark" | "pastel";

export interface HiyyaPalette {
  bg: string;
  panel: string;
  panel2: string;
  gold: string;
  champagne: string;
  deepGold: string;
  bronze: string;
  platinum: string;
  text: string;
  muted: string;
  gain: string;
  loss: string;
  warning: string;
  border: string;
  gridLine: string;
}

const darkPalette: HiyyaPalette = {
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
  border: "#332B1C",
  gridLine: "#1B1813",
};

/** Warm cream background, white cards, four dusty-warm accent hues (amber,
 * peach, terracotta, taupe) standing in for the dark theme's gold/champagne/
 * bronze/platinum branch colors. Gain/loss stay soft sage/coral rather than
 * saturated green/red, so they still read as "good/bad" without clashing
 * with the pastel palette's low-saturation feel. */
const pastelPalette: HiyyaPalette = {
  bg: "#FBF7F1",
  panel: "#FFFFFF",
  panel2: "#F4EDE3",
  gold: "#D9A857",
  champagne: "#F0C99A",
  deepGold: "#B98A46",
  bronze: "#D48A6A",
  platinum: "#B9AFA0",
  text: "#3A3229",
  muted: "#8B7F6E",
  gain: "#6FAE84",
  loss: "#D96C5C",
  warning: "#E0A947",
  border: "#E6DCCB",
  gridLine: "#EDE4D6",
};

const palettes: Record<ThemeMode, HiyyaPalette> = {
  dark: darkPalette,
  pastel: pastelPalette,
};

export function getHiyyaColors(theme: ThemeMode): HiyyaPalette {
  return palettes[theme];
}

export function getBranchColors(theme: ThemeMode): Record<string, string> {
  const c = palettes[theme];
  return { B01: c.gold, B02: c.champagne, B03: c.bronze, B04: c.platinum };
}

/** Tonal ramp for category/expense charts (Section 9). */
export function getGoldRamp(theme: ThemeMode): string[] {
  const c = palettes[theme];
  return [c.gold, c.champagne, c.bronze, c.platinum, c.deepGold];
}
