/**
 * Parse a timestamp coming from the API into an epoch value.
 *
 * The database stores UTC correctly ("2026-07-29 09:10:13.244" for a 2:40 PM
 * IST start). The problem is on the wire: the value arrives with no timezone
 * designator, so `new Date(value)` reads it as *local* time and lands one UTC
 * offset in the past — a task started at 2:40 PM IST reads as 9:10 AM, and a
 * one-second-old timer reads as "5h 30m 1s".
 *
 * So: when no designator is present, read the wall-clock as UTC. A value that
 * already carries "Z" or "+HH:MM" is trusted as-is, which keeps this correct if
 * the API is fixed to emit real ISO-8601.
 *
 * Durations measured as `end - start` were never affected — both ends carry the
 * same error and it cancels out. Only comparisons against the browser clock
 * (a running timer) and rendered clock times drift.
 *
 * NOTE: this cannot rescue a value the API has *already* mis-converted (e.g. a
 * DB driver reading the naive UTC column as server-local and emitting
 * "...T03:40:13.244Z"). That has to be fixed server-side.
 */
export const parseServerTime = (
  value: string | Date | null | undefined,
): number => {
  if (!value) return NaN;
  if (value instanceof Date) return value.getTime();

  const raw = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  // Normalise the SQL "YYYY-MM-DD HH:mm:ss" form to ISO before parsing.
  const iso = raw.replace(" ", "T");

  const parsed = new Date(hasTimezone ? iso : `${iso}Z`).getTime();
  // Fall back to the raw value rather than reporting NaN on an unexpected shape.
  return Number.isNaN(parsed) ? new Date(raw).getTime() : parsed;
};
