/**
 * Formatting for the report figures.
 *
 * This file used to derive the figures too — counting statuses, bucketing days,
 * building the previous window — because there was no reports endpoint and the
 * page sliced `/task-list` in the browser. `/reports/user` and `/reports/team`
 * return all of it now, so the arithmetic is gone and only presentation is left.
 * The one derived value that stays is the period delta, which is a comparison
 * between two numbers the API already sent.
 */

/** `yyyy-mm-dd` from local date parts — never `toISOString()`, which shifts to UTC. */
export const toKey = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/** Percentage change, rounded. Null when there is no baseline to compare to. */
export const deltaPct = (now: number, before: number): number | null => {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
};

export const fmtDuration = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (!h) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

const parse = (key: string): Date | null => {
  const [y, m, d] = key.split("-").map(Number);
  return y ? new Date(y, m - 1, d) : null;
};

export const fmtDay = (key: string): string =>
  parse(key)?.toLocaleDateString(undefined, { day: "2-digit", month: "short" }) ?? key;

export const fmtDayLong = (key: string): string =>
  parse(key)?.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) ?? key;
