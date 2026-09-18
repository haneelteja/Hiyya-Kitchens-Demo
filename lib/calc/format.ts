import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";

export interface FormatInrOptions {
  /** Use "₹39.6 L" / "₹1.34 Cr" short form above ₹1L instead of full digit grouping. */
  compact?: boolean;
  decimals?: number;
}

/** Indian digit grouping: ₹1,23,456; compact form ₹39.6 L / ₹1.34 Cr above ₹1L / ₹1Cr. */
export function formatInr(value: number, options: FormatInrOptions = {}): string {
  const n = Math.round(value);
  const negative = n < 0;
  const abs = Math.abs(n);

  if (options.compact) {
    if (abs >= 1_00_00_000) {
      return `${negative ? "-" : ""}₹${(abs / 1_00_00_000).toFixed(options.decimals ?? 2)} Cr`;
    }
    if (abs >= 1_00_000) {
      return `${negative ? "-" : ""}₹${(abs / 1_00_000).toFixed(options.decimals ?? 1)} L`;
    }
  }

  const s = String(abs);
  let last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) last3 = "," + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}₹${rest}${last3}`;
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2025-12" -> "Dec". Unambiguous across a year boundary, unlike the raw "12". */
export function formatMonthLabel(period: string): string {
  const month = Number(period.slice(5, 7));
  return MONTH_ABBR[month - 1] ?? period;
}

export function formatPct(value: number, decimals = 1): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Formats an ISO date/datetime as an IST date string, e.g. "31 Aug 2026". */
export function formatIstDate(isoDate: string, pattern = "d MMM yyyy"): string {
  return formatInTimeZone(new Date(isoDate), IST, pattern);
}

export function todayIst(): Date {
  const now = new Date();
  const istString = formatInTimeZone(now, IST, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return new Date(istString);
}
