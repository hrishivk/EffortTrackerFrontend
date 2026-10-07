
export const toKey = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

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
