"use client";

import { Pause, Play, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import type { ThroneMode } from "@/lib/store/useAppStore";

/** What the button shows for the CURRENT mode: an icon/label describing the
 * action a click will perform next (play -> pause -> hidden -> play). The
 * preference persists (the one exception to "no browser storage for business
 * data" — this is a motion preference, not business data). */
const NEXT_ACTION: Record<ThroneMode, { label: string; Icon: typeof Pause }> = {
  play: { label: "Pause motion", Icon: Pause },
  pause: { label: "Remove throne", Icon: EyeOff },
  hidden: { label: "Play motion", Icon: Play },
};

export function MotionToggle() {
  const throneMode = useAppStore((s) => s.throneMode);
  const cycleThroneMode = useAppStore((s) => s.cycleThroneMode);
  const { label, Icon } = NEXT_ACTION[throneMode];

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={cycleThroneMode}
      aria-label={`${label} (throne is currently ${throneMode === "play" ? "playing" : throneMode === "pause" ? "paused" : "hidden"})`}
      className="gap-1.5 border-hiyya-panel-2 bg-hiyya-panel-2 text-hiyya-text hover:bg-hiyya-panel-2/70"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
