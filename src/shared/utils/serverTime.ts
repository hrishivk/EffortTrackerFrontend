export const parseServerTime = (
  value: string | Date | null | undefined,
): number => {
  if (!value) return NaN;
  if (value instanceof Date) return value.getTime();

  const raw = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const iso = raw.replace(" ", "T");

  const parsed = new Date(hasTimezone ? iso : `${iso}Z`).getTime();
  return Number.isNaN(parsed) ? new Date(raw).getTime() : parsed;
};
