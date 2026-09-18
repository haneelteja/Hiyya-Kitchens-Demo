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
        "rounded-xl border border-hiyya-panel-2 bg-gradient-to-br from-hiyya-panel-2/60 to-black/40 p-4",
        className,
      )}
    >
      {/* Not a document heading — a card caption, so it stays out of the h1→h2→h3
          outline entirely rather than participating at the wrong level. */}
      <p className="text-[11px] font-bold uppercase tracking-wider text-hiyya-muted">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold bg-gradient-to-b from-hiyya-champagne via-hiyya-gold to-hiyya-deep-gold bg-clip-text text-transparent">
        {value}
      </p>
      {delta ? <div className="mt-1">{delta}</div> : null}
      {foot ? <p className="mt-2 text-[11px] text-hiyya-muted">{foot}</p> : null}
    </div>
  );
}
