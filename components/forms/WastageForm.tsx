"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { dataset } from "@/lib/data/mock/dataset";
import { WastageReason, type BranchCode, type IngredientKey } from "@/lib/data/types";

const TODAY = "2026-08-31";

/** Branch Manager logs a wastage entry (Section 5: "record wastage"). In-memory
 * only (demoEdits.wastageEntries) — Reset demo clears it. */
export function WastageForm({ branchCode }: { branchCode: BranchCode }) {
  const addWastageEntry = useAppStore((s) => s.addWastageEntry);
  const { toast } = useToast();

  const [ingredientKey, setIngredientKey] = useState<IngredientKey>(
    dataset.ingredients[0].key,
  );
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<WastageReason>(WastageReason.options[0]);

  const qtyNum = Number(qty);
  const canSubmit = Number.isFinite(qtyNum) && qtyNum > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    addWastageEntry({
      branchCode,
      ingredientKey,
      qty: qtyNum,
      reason,
      date: TODAY,
    });
    toast({
      variant: "success",
      description: `Wastage logged: ${qtyNum} ${ingredientKey} — ${reason}.`,
    });
    setQty("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3"
    >
      <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
        Log wastage
      </h2>

      <div>
        <label
          htmlFor="wastage-ingredient"
          className="mb-1 block text-xs text-hiyya-muted"
        >
          Ingredient
        </label>
        <Select
          value={ingredientKey}
          onValueChange={(v) => setIngredientKey(v as IngredientKey)}
        >
          <SelectTrigger
            id="wastage-ingredient"
            className="border-hiyya-panel-2 bg-[var(--hiyya-well-strong)]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dataset.ingredients.map((i) => (
              <SelectItem key={i.key} value={i.key}>
                {i.name} ({i.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="wastage-qty" className="mb-1 block text-xs text-hiyya-muted">
            Quantity
          </label>
          <Input
            id="wastage-qty"
            type="number"
            min={0}
            step={0.01}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="wastage-reason" className="mb-1 block text-xs text-hiyya-muted">
            Reason
          </label>
          <Select value={reason} onValueChange={(v) => setReason(v as WastageReason)}>
            <SelectTrigger
              id="wastage-reason"
              className="border-hiyya-panel-2 bg-[var(--hiyya-well-strong)]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WastageReason.options.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="mt-1 bg-hiyya-gold text-black hover:opacity-90 disabled:opacity-40"
      >
        Log wastage
      </Button>
    </form>
  );
}
