import { cn } from "@/lib/utils";
import type { DeviationFlag } from "@/lib/calc/sop";
import type { HealthStatus } from "@/lib/calc/health";
import type { ReorderStatus } from "@/lib/calc/stock";

const FLAG_LABEL: Record<DeviationFlag, string> = {
  investigate: "Investigate",
  watch: "Watch",
  below_sop: "Below SOP",
  ok: "OK",
};
const FLAG_STYLE: Record<DeviationFlag, string> = {
  investigate: "text-hiyya-loss-ink border-hiyya-loss/40 bg-hiyya-loss/10",
  watch: "text-hiyya-warning-ink border-hiyya-warning/40 bg-hiyya-warning/10",
  below_sop: "text-sky-300 border-sky-300/40 bg-sky-300/10",
  ok: "text-hiyya-gain-ink border-hiyya-gain/40 bg-hiyya-gain/10",
};

/** Flag pill — colour + icon + text label together, never colour alone (Section 9). */
export function FlagPill({ flag }: { flag: DeviationFlag }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
        FLAG_STYLE[flag],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {FLAG_LABEL[flag]}
    </span>
  );
}

const HEALTH_LABEL: Record<HealthStatus, string> = {
  needs_action: "Needs action",
  watch: "Watch",
  healthy: "Healthy",
};
const HEALTH_STYLE: Record<HealthStatus, string> = {
  needs_action: "text-hiyya-loss-ink border-hiyya-loss/40 bg-hiyya-loss/10",
  watch: "text-hiyya-warning-ink border-hiyya-warning/40 bg-hiyya-warning/10",
  healthy: "text-hiyya-gain-ink border-hiyya-gain/40 bg-hiyya-gain/10",
};

export function HealthPill({ status }: { status: HealthStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
        HEALTH_STYLE[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {HEALTH_LABEL[status]}
    </span>
  );
}

const REORDER_LABEL: Record<ReorderStatus["status"], string> = {
  order_today: "Order today",
  reorder_soon: "Reorder soon",
  ok: "OK",
};
const REORDER_STYLE: Record<ReorderStatus["status"], string> = {
  order_today: "text-hiyya-loss-ink border-hiyya-loss/40 bg-hiyya-loss/10",
  reorder_soon: "text-hiyya-warning-ink border-hiyya-warning/40 bg-hiyya-warning/10",
  ok: "text-hiyya-gain-ink border-hiyya-gain/40 bg-hiyya-gain/10",
};

/** Stock reorder pill (Section 7: order-today under 1.5 days cover, reorder-soon under 2.5). */
export function ReorderPill({ status }: { status: ReorderStatus["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
        REORDER_STYLE[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {REORDER_LABEL[status]}
    </span>
  );
}
