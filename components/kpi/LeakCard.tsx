import type { ReactNode } from "react";

/**
 * The "Lost to SOP deviation" hero card — the one signature decorative element
 * (Section 9): a subtle vertical gold bar texture, a nod to the jail concept.
 * Kept deliberately alone; every other card in the app stays plain.
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
  return (
    <div className="relative overflow-hidden rounded-xl border border-hiyya-gold/40 bg-gradient-to-br from-[#241C0F] to-black p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #D4AF37 0 3px, transparent 3px 14px)",
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
        <p className="mt-1 font-heading text-2xl font-bold bg-gradient-to-b from-hiyya-warning to-hiyya-gold bg-clip-text text-transparent">
          {value}
        </p>
        {foot ? <p className="mt-2 text-[11px] text-hiyya-muted">{foot}</p> : null}
      </div>
    </div>
  );
}
