"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaderboardRow {
  code: string;
  name: string;
  color: string;
  value: number;
}

const MEDAL_BADGE: Record<number, string> = {
  1: "bg-gradient-to-br from-hiyya-champagne to-hiyya-gold text-black",
  2: "bg-gradient-to-br from-[#E4E1DA] to-hiyya-platinum text-black",
  3: "bg-gradient-to-br from-[#C99457] to-hiyya-bronze text-black",
};

const MEDAL_ROW: Record<number, string> = {
  1: "border-hiyya-gold/40 bg-gradient-to-r from-hiyya-gold/10 to-transparent",
  2: "border-hiyya-platinum/40 bg-gradient-to-r from-hiyya-platinum/10 to-transparent",
  3: "border-hiyya-bronze/40 bg-gradient-to-r from-hiyya-bronze/10 to-transparent",
};

/**
 * A ranked list, not a bar chart — rows are already sorted best-first by the
 * caller. Ranks 1–3 get gold/silver/bronze medal badges (rank 1 also wins the
 * star). Keyed by the metric so switching "rank by" remounts the list and
 * replays its enter animation (tailwindcss-animate), giving a "the
 * leaderboard just reshuffled" cue without reaching for Framer Motion here
 * (reserved for panel/drawer transitions elsewhere).
 */
export function Leaderboard({
  metricKey,
  rows,
  formatValue,
  onRowClick,
}: {
  metricKey: string;
  rows: LeaderboardRow[];
  formatValue: (value: number) => string;
  onRowClick?: (code: string) => void;
}) {
  return (
    <ul key={metricKey} className="flex flex-col gap-1.5">
      {rows.map((r, i) => {
        const rank = i + 1;
        const isFirst = rank === 1;
        return (
          <li
            key={r.code}
            className="animate-in fade-in slide-in-from-top-1 duration-300"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <button
              type="button"
              onClick={() => onRowClick?.(r.code)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                MEDAL_ROW[rank] ?? "border-hiyya-panel-2 bg-black/20 hover:border-hiyya-gold/30",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  MEDAL_BADGE[rank] ?? "bg-hiyya-panel-2 text-hiyya-muted",
                )}
              >
                {rank}
              </span>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: r.color }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate text-sm font-semibold">{r.name}</span>
              {isFirst && (
                <Star
                  className="h-4 w-4 shrink-0 fill-hiyya-gold text-hiyya-gold"
                  aria-label="Top ranked"
                />
              )}
              <span className="shrink-0 text-sm font-bold text-hiyya-champagne">
                {formatValue(r.value)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
