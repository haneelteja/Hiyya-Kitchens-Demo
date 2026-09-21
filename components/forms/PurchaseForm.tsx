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
import type { BranchCode, IngredientKey } from "@/lib/data/types";

const TODAY = "2026-08-31";

/** Branch Manager logs a purchase (Section 5: "record purchases"). In-memory only
 * (demoEdits.purchases) — Reset demo clears it. */
export function PurchaseForm({ branchCode }: { branchCode: BranchCode }) {
  const addPurchase = useAppStore((s) => s.addPurchase);
  const { toast } = useToast();

  const [ingredientKey, setIngredientKey] = useState<IngredientKey>(
    dataset.ingredients[0].key,
  );
  const [qty, setQty] = useState("");
  const [ratePaid, setRatePaid] = useState("");
  const [supplier, setSupplier] = useState("");

  const qtyNum = Number(qty);
  const rateNum = Number(ratePaid);
  const canSubmit =
    Number.isFinite(qtyNum) &&
    qtyNum > 0 &&
    Number.isFinite(rateNum) &&
    rateNum > 0 &&
    supplier.trim() !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    addPurchase({
      branchCode,
      ingredientKey,
      qty: qtyNum,
      ratePaid: rateNum,
      supplier: supplier.trim(),
      date: TODAY,
    });
    toast({
      variant: "success",
      description: `Purchase logged: ${qtyNum} ${ingredientKey} from ${supplier}.`,
    });
    setQty("");
    setRatePaid("");
    setSupplier("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3"
    >
      <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
        Log a purchase
      </h2>

      <div>
        <label
          htmlFor="purchase-ingredient"
          className="mb-1 block text-xs text-hiyya-muted"
        >
          Ingredient
        </label>
        <Select
          value={ingredientKey}
          onValueChange={(v) => setIngredientKey(v as IngredientKey)}
        >
          <SelectTrigger
            id="purchase-ingredient"
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
          <label htmlFor="purchase-qty" className="mb-1 block text-xs text-hiyya-muted">
            Quantity
          </label>
          <Input
            id="purchase-qty"
            type="number"
            min={0}
            step={0.01}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="purchase-rate" className="mb-1 block text-xs text-hiyya-muted">
            Rate paid (₹/unit)
          </label>
          <Input
            id="purchase-rate"
            type="number"
            min={0}
            step={0.01}
            value={ratePaid}
            onChange={(e) => setRatePaid(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="purchase-supplier"
          className="mb-1 block text-xs text-hiyya-muted"
        >
          Supplier
        </label>
        <Input
          id="purchase-supplier"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Supplier name"
        />
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="mt-1 bg-hiyya-gold text-black hover:opacity-90 disabled:opacity-40"
      >
        Log purchase
      </Button>
    </form>
  );
}
