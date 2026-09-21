import { formatPct } from "@/lib/calc/format";
import { cn } from "@/lib/utils";

/** A ▲/▼ delta chip. Red/green are reserved for exactly this (Section 9). */
export function DeltaText({ value, suffix }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        up ? "bg-hiyya-gain/10 text-hiyya-gain-ink" : "bg-hiyya-loss/10 text-hiyya-loss-ink",
      )}
    >
      {up ? "▲" : "▼"} {formatPct(Math.abs(value)).replace("+", "")}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}
