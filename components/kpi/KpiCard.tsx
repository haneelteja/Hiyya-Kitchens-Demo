import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  foot,
  delta,
  className,
}: {
  label: string;
  value: string;
  foot?: ReactNode;
  delta?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hiyya-panel-2 bg-gradient-to-br from-hiyya-panel-2/60 to-hiyya-canvas/40 p-3",
        className,
      )}
    >
      {/* Not a document heading — a card caption, so it stays out of the h1→h2→h3
          outline entirely rather than participating at the wrong level. */}
      <p className="text-[11px] font-bold uppercase tracking-wider text-hiyya-muted">
        {label}
      </p>
      {/* A solid, bright fill reads far more reliably than a gradient clip at
          this size — the gradient's darker stop could wash out against the
          panel background, exactly the "numbers aren't clearly visible"
          complaint this replaces. */}
      <p className="mt-0.5 font-heading text-xl font-bold text-hiyya-champagne">
        {value}
      </p>
      {delta ? <div className="mt-0.5">{delta}</div> : null}
      {foot ? <p className="mt-1 text-[11px] text-hiyya-muted">{foot}</p> : null}
    </div>
  );
}
