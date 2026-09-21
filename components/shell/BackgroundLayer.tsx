"use client";

import { useThemeColors } from "@/hooks/useThemeColors";

const BACKGROUND_BY_THEME: Record<string, string> = {
  dark: "radial-gradient(1200px 700px at 75% 10%, rgba(212,175,55,0.14), transparent 60%), #000000",
  pastel:
    "radial-gradient(1100px 650px at 80% 0%, rgba(217,168,87,0.20), transparent 60%), radial-gradient(900px 600px at 8% 100%, rgba(212,138,106,0.16), transparent 55%), #FBF7F1",
};

/**
 * A fixed, full-viewport, static background — replaces the earlier 3D throne
 * stage entirely. Each theme gets its own subtle multi-tone gradient
 * ("lighting") rather than a flat fill, so removing the throne doesn't leave
 * the screen feeling bare; translucent panels (e.g. `bg-hiyya-panel-2/30`)
 * still pick up a faint tint from whichever gradient shows through them.
 */
export function BackgroundLayer() {
  const { theme } = useThemeColors();
  return (
    <div
      className="fixed inset-0 z-0"
      style={{ background: BACKGROUND_BY_THEME[theme] }}
      aria-hidden="true"
    />
  );
}
