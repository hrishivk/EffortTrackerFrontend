import { parseServerTime } from "./serverTime";

/**
 * Status filter for `/role-user/task-list`.
 *
 * The API accepts exactly these snake_case values, one or many. Many is sent as
 * a comma-separated string (`status=in_progress,yet_to_start`); omitting the
 * param entirely returns every status.
 */
export const TASK_STATUSES = [
  "yet_to_start",
  "in_progress",
  "completed",
  "blocked",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Normalise one or more statuses into the comma-separated string the API wants.
 * An array would also work (axios serialises it as `status[]=a&status[]=b`, which
 * the backend handles), but the comma form avoids depending on the serializer.
 *
 * Values are no longer checked against `TASK_STATUSES`: a status can now be any
 * board group's name, and the filter's options come from the API's group list, so
 * whitelisting here would silently drop every custom group.
 */
export const toStatusParam = (
  status?: string | string[] | null
): string | undefined => {
  const raw = Array.isArray(status) ? status : String(status ?? "").split(",");
  const values = raw.map((s) => s.trim()).filter(Boolean);
  return values.length ? Array.from(new Set(values)).join(",") : undefined;
};

/**
 * Fallback options for the Status field, used only when the API's group list is
 * unavailable — normally the options are built from the board groups so the
 * filter offers exactly the lanes that exist. "" means all statuses.
 */
export const TASK_STATUS_FILTER_OPTIONS = [
  { value: "in_progress,yet_to_start", label: "Active (In Progress + Yet to Start)" },
  { value: "in_progress", label: "In Progress" },
  { value: "yet_to_start", label: "Yet to Start" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

/**
 * How urgent a task's deadline is, or null when there is nothing to flag.
 *
 * `overdue` outranks `today`: a deadline already missed is the more mandatory of
 * the two, and the UI escalates it accordingly.
 *
 * Only open work is ever flagged. A finished task's deadline is history, and a
 * task parked in a board group has had its status overwritten with the group's
 * name, so we cannot tell there and stay quiet rather than cry wolf.
 */
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

/** Whole days a deadline has been missed by. 0 when it is not overdue. */
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

/**
 * `due_date` / `start_date` arrive as plain `YYYY-MM-DD` — a calendar day, with
 * no time and no zone. Running those through `parseServerTime` treats them as
 * UTC midnight, which renders as the *previous* day anywhere behind UTC. So a
 * bare date is built in local time and only a real timestamp is parsed.
 */
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

/** True when the value is a bare calendar day rather than a timestamp. */
export const isPlainDate = (value?: string | null): boolean =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
