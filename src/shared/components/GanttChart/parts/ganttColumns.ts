import type { GanttChartProps, ViewMode } from "../../../types/GanttChart";

export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MAX_VISIBLE_MONTHS = 12;

export interface ColDef {
  label: string;
  sublabel?: string;
  start: Date;
  end: Date;
}

export type MonthRef = { year: number; month: number };

export type BaseRange = {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
};

export function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function getDayOfWeek(y: number, m: number, d: number) {
  return new Date(y, m, d).getDay();
}

export function weekColumns(year: number, month: number): ColDef[] {
  const total = getDaysInMonth(year, month);
  return Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    return {
      label: String(d),
      sublabel: dayNames[getDayOfWeek(year, month, d)],
      start: new Date(year, month, d),
      end: new Date(year, month, d, 23, 59, 59, 999),
    };
  });
}

export function monthWeekColumns(year: number, month: number): ColDef[] {
  const totalDays = getDaysInMonth(year, month);
  const cols: ColDef[] = [];
  let ws = 1;
  let wn = 1;
  while (ws <= totalDays) {
    const we = Math.min(ws + 6, totalDays);
    cols.push({
      label: `Week ${wn}`,
      sublabel: `${ws}–${we} ${monthShort[month]}`,
      start: new Date(year, month, ws),
      end: new Date(year, month, we, 23, 59, 59, 999),
    });
    ws = we + 1;
    wn++;
  }
  return cols;
}

export function yearColumns(year: number): ColDef[] {
  return Array.from({ length: 12 }, (_, i) => ({
    label: monthShort[i],
    start: new Date(year, i, 1),
    end: new Date(year, i, getDaysInMonth(year, i), 23, 59, 59, 999),
  }));
}

/** Columns one month occupies in Week (one per day) or Month (one per week) view. */
export function monthColumns(viewMode: ViewMode, year: number, month: number): ColDef[] {
  return viewMode === "Week" ? weekColumns(year, month) : monthWeekColumns(year, month);
}

export const colsInMonth = (viewMode: ViewMode, year: number, month: number) =>
  monthColumns(viewMode, year, month).length;

/** Number of columns before the given month starts; the whole range if it isn't in it. */
export function colsBeforeMonth(
  range: MonthRef[],
  viewMode: ViewMode,
  targetYear: number,
  targetMonth: number,
): number {
  let colsBefore = 0;
  for (const { year, month } of range) {
    if (year === targetYear && month === targetMonth) break;
    colsBefore += colsInMonth(viewMode, year, month);
  }
  return colsBefore;
}

export const colWidthFor = (viewMode: ViewMode) =>
  viewMode === "Week" ? 50 : viewMode === "Month" ? 150 : 100;

/** Earliest start to latest end across projects, capped at MAX_VISIBLE_MONTHS. */
export function computeBaseRange(projects: GanttChartProps["projects"], now: Date): BaseRange {
  let earliest: Date | null = null;
  let latest: Date | null = null;
  for (const p of projects) {
    if (p.start_date) {
      const d = new Date(p.start_date);
      d.setHours(0, 0, 0, 0);
      if (!earliest || d < earliest) earliest = new Date(d);
    }
    if (p.end_date) {
      const d = new Date(p.end_date);
      d.setHours(0, 0, 0, 0);
      if (!latest || d > latest) latest = new Date(d);
    }
  }
  if (!earliest && !latest) {
    earliest = new Date(now.getFullYear(), now.getMonth(), 1);
    latest = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (!earliest) {
    earliest = new Date(latest!.getFullYear(), latest!.getMonth() - 1, 1);
  } else if (!latest) {
    latest = new Date(earliest.getFullYear(), earliest.getMonth() + 2, 0);
  }

  const maxEnd = new Date(earliest!.getFullYear(), earliest!.getMonth() + MAX_VISIBLE_MONTHS, 0);
  if (latest! > maxEnd) {
    latest = maxEnd;
  }

  return {
    startYear: earliest!.getFullYear(),
    startMonth: earliest!.getMonth(),
    endYear: latest!.getFullYear(),
    endMonth: latest!.getMonth(),
  };
}

export function buildMonthRange(base: BaseRange, extraBefore: number, extraAfter: number): MonthRef[] {
  const range: MonthRef[] = [];
  const start = new Date(base.startYear, base.startMonth - extraBefore, 1);
  const end = new Date(base.endYear, base.endMonth + extraAfter, 1);
  const cur = new Date(start);
  while (cur <= end) {
    range.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur.setMonth(cur.getMonth() + 1);
  }
  return range;
}
