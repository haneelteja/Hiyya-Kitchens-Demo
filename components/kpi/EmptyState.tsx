import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Inbox } from "lucide-react";

/**
 * A designed "nothing here" moment — an icon plus the message, instead of a
 * single line of muted text. "All clear" (nothing needs attention) and "empty
 * so far" (nothing logged yet) are different news and read differently here
 * (UI/UX audit, Quick Win: empty states).
 */
export function EmptyState({
  message,
  variant = "clear",
  icon: IconOverride,
}: {
  message: string;
  variant?: "clear" | "neutral";
  icon?: LucideIcon;
}) {
  const Icon = IconOverride ?? (variant === "clear" ? CheckCircle2 : Inbox);
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <Icon
        className={
          variant === "clear" ? "h-6 w-6 text-hiyya-gain-ink" : "h-6 w-6 text-hiyya-muted"
        }
        aria-hidden="true"
      />
      <p className="text-sm text-hiyya-muted">{message}</p>
    </div>
  );
}
