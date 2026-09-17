"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

/** Clears every in-memory demo edit (fixed costs, purchases, wastage, SOP overrides). */
export function ResetDemoButton() {
  const resetDemoEdits = useAppStore((s) => s.resetDemoEdits);
  const { toast } = useToast();

  function handleReset() {
    resetDemoEdits();
    toast({ description: "Demo data reset to its original state." });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleReset}
      className="gap-1.5 border-hiyya-panel-2 bg-hiyya-panel-2 text-hiyya-text hover:bg-hiyya-panel-2/70"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Reset demo
    </Button>
  );
}
