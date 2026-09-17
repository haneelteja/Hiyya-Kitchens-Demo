"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";

/** Pauses the 3D throne stage's render loop; the choice persists (the one exception
 * to "no browser storage for business data" — this is a motion preference, not
 * business data). */
export function MotionToggle() {
  const motionEnabled = useAppStore((s) => s.motionEnabled);
  const toggleMotion = useAppStore((s) => s.toggleMotion);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleMotion}
      aria-pressed={motionEnabled}
      className="gap-1.5 border-hiyya-panel-2 bg-hiyya-panel-2 text-hiyya-text hover:bg-hiyya-panel-2/70"
    >
      {motionEnabled ? (
        <Pause className="h-3.5 w-3.5" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
      {motionEnabled ? "Pause motion" : "Play motion"}
    </Button>
  );
}
