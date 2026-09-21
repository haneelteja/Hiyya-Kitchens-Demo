/**
 * Shared loading placeholder for tabs that block on their first fetch
 * (`if (!data) return null`). Mirrors the common KPI-row + panel shape so the
 * page doesn't go blank-then-pop-in between navigating to a tab and its data
 * arriving — flagged in the Phase 8 UI/UX audit as the single highest-leverage
 * fix in the app (every tab, every persona hits this on first load).
 */
export function TabSkeleton({
  kpis = 4,
  panels = 2,
}: {
  kpis?: number;
  panels?: number;
}) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: kpis }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-hiyya-panel-2 bg-gradient-to-br from-hiyya-panel-2/60 to-hiyya-canvas/40 p-4"
          >
            <div className="h-2.5 w-16 animate-pulse rounded bg-hiyya-highlight/5" />
            <div className="mt-3 h-6 w-24 animate-pulse rounded bg-hiyya-highlight/5" />
          </div>
        ))}
      </div>
      {Array.from({ length: panels }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/20"
        />
      ))}
    </div>
  );
}
