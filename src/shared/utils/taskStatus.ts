import { parseServerTime } from "./serverTime";

export const TASK_STATUSES = [
  "yet_to_start",
  "in_progress",
  "completed",
  "blocked",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const toStatusParam = (
  status?: string | string[] | null
): string | undefined => {
  const raw = Array.isArray(status) ? status : String(status ?? "").split(",");
  const values = raw.map((s) => s.trim()).filter(Boolean);
  return values.length ? Array.from(new Set(values)).join(",") : undefined;
};

export const TASK_STATUS_FILTER_OPTIONS = [
  { value: "in_progress,yet_to_start", label: "Active (In Progress + Yet to Start)" },
  { value: "in_progress", label: "In Progress" },
  { value: "yet_to_start", label: "Yet to Start" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

export type DueState = "overdue" | "today" | null;

export const dueState = (
  dueDate?: string | null,
  status?: string | null
): DueState => {
  const s = (status || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (s !== "yet_to_start" && s !== "pending" && s !== "in_progress") return null;
  const d = toLocalDate(dueDate);
  if (!d) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);

  if (day.getTime() === today.getTime()) return "today";
  return day.getTime() < today.getTime() ? "overdue" : null;
};

export const daysOverdue = (dueDate?: string | null): number => {
  const d = toLocalDate(dueDate);
  if (!d) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = today.getTime() - day.getTime();
  return diff > 0 ? Math.round(diff / 86400000) : 0;
};

export const toLocalDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (plain) {
    const d = new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(parseServerTime(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toDateInput = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const toDateValue = (value?: string | null): string => {
  const d = toLocalDate(value);
  return d ? toDateInput(d) : "";
};

export const isPlainDate = (value?: string | null): boolean =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
