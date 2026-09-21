import type { ReactNode } from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

/**
 * The "Lost to SOP deviation" hero card — the one signature decorative element
 * (Section 9): a subtle vertical gold bar texture, a nod to the jail concept.
 * Kept deliberately alone; every other card in the app stays plain. The
 * background gradient and texture color both come from the active theme —
 * dark keeps the original near-black gradient, pastel gets a warm
 * white-to-sand one instead of a literal black that would look like a hole
 * punched in a light page.
 */
export function LeakCard({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot?: ReactNode;
}) {
  const { hiyyaColors } = useThemeColors();
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-hiyya-gold/40 p-3"
      style={{
        backgroundImage: `linear-gradient(135deg, ${hiyyaColors.panel2}, ${hiyyaColors.bg})`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${hiyyaColors.gold} 0 3px, transparent 3px 14px)`,
          maskImage: "linear-gradient(180deg, black, transparent 85%)",
          WebkitMaskImage: "linear-gradient(180deg, black, transparent 85%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-hiyya-gold/25 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-wider text-hiyya-muted">
          {label}
        </p>
        <p className="mt-0.5 font-heading text-xl font-bold text-hiyya-warning-ink">
          {value}
        </p>
        {foot ? <p className="mt-1 text-[11px] text-hiyya-muted">{foot}</p> : null}
      </div>
    </div>
  );
}
