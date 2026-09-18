import type { ReactNode } from "react";

/**
 * Every chart gets a title, a one-line subtitle, and an accessible alternative
 * (Section 8/9) — here, a real `<table>` a keyboard/screen-reader user can reach
 * via <details>, not a decorative aria-label nobody can actually navigate.
 */
export function ChartFrame({
  title,
  subtitle,
  toolbar,
  accessibleTable,
  children,
}: {
  title: string;
  subtitle: string;
  toolbar?: ReactNode;
  accessibleTable: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-base font-semibold text-hiyya-champagne">
            {title}
          </h3>
          <p className="text-xs text-hiyya-muted">{subtitle}</p>
        </div>
        {toolbar}
      </div>
      {children}
      <details className="mt-3 text-xs text-hiyya-muted">
        <summary className="cursor-pointer select-none text-hiyya-gold">
          View as table
        </summary>
        <div className="mt-2 max-h-72 overflow-auto">{accessibleTable}</div>
      </details>
    </div>
  );
}
