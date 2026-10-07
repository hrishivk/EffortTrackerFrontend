import type { taskList } from "../../../user/types";
import { toLocalDate } from "../../../../shared/utils/taskStatus";
import { assigneeOf } from "../../../../shared/utils/subtasks";
import { STATUS_ACCENT } from "../boardConstants";

export type TabKey = "details" | "subtasks" | "activity";

export const TAB_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

export const stagger = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: "easeOut" as const, delay: Math.min(i, 6) * 0.035 },
});

export const normalize = (v?: string | null) =>
  (v || "").toLowerCase().replace(/[\s-]+/g, "_");

export const STATUS_LABEL: Record<string, string> = {
  yet_to_start: "Not Started",
  pending: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  done: "Completed",
  blocked: "Blocked",
};

export const statusFace = (status?: string | null) => {
  const s = normalize(status);
  const accent = STATUS_ACCENT[s] ?? "#6b7280";
  return {
    label: STATUS_LABEL[s] ?? (s ? s.replace(/_/g, " ") : "—"),
    color: accent,
    bg: `${accent}1f`,
  };
};

export const projectName = (project: taskList["project"] | undefined) =>
  typeof project === "object" && project !== null ? project.name : String(project || "");

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit", year: "numeric" };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

export const showDate = (v?: string | null) => {
  const d = toLocalDate(v);
  return d ? d.toLocaleDateString("en-US", DATE_OPTS) : "--";
};

export const showShort = (v?: string | null) => {
  const d = toLocalDate(v);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : null;
};

export const showTime = (v?: string | null) => {
  const d = toLocalDate(v);
  return d ? d.toLocaleTimeString("en-US", TIME_OPTS) : "--";
};

export const showStamp = (v?: string | null) => {
  const d = toLocalDate(v);
  return d
    ? `${d.toLocaleDateString("en-US", DATE_OPTS)} at ${d.toLocaleTimeString("en-US", TIME_OPTS)}`
    : "--";
};

export type ActivityEvent = {
  at: string;
  title: string;
  by: string;
  tone: string;
  note?: string;
};

export const buildActivity = (task: taskList) => {
  const events: ActivityEvent[] = [];
  const creator = task.dailyLog?.creator?.fullName || "—";

  if (task.created_at)
    events.push({ at: task.created_at, title: "Task created", by: creator, tone: "#7c3aed" });

  const add = (row: taskList, label: string) => {
    const who = assigneeOf(row)?.fullName || creator;
    if (row.start_time)
      events.push({
        at: row.start_time,
        title: `${label} started`,
        by: who,
        tone: STATUS_ACCENT.in_progress,
      });
    if (row.end_time && normalize(row.status) === "completed")
      events.push({
        at: row.end_time,
        title: `${label} completed`,
        by: who,
        tone: STATUS_ACCENT.completed,
      });
  };

  const pushes = (row: taskList, label: string) =>
    (row.extensions ?? []).forEach((ext) =>
      events.push({
        at: ext.created_at,
        title: ext.previous_due_date
          ? `${label} extended · ${showShort(ext.previous_due_date)} → ${showShort(ext.new_due_date)}`
          : `${label} due date set · ${showShort(ext.new_due_date)}`,
        by: ext.extendedBy?.fullName || "Somebody since removed",
        tone: "#d97706",
        note: ext.reason,
      })
    );

  add(task, "Main task");
  pushes(task, "Main task");
  (task.subtasks ?? []).forEach((sub) => {
    add(sub, `“${sub.description}”`);
    pushes(sub, `“${sub.description}”`);
  });

  return events.sort((a, b) => (a.at < b.at ? -1 : 1));
};

export const deletePrompt = (row: taskList | null): string => {
  if (!row) return "";
  const name = `“${row.description}”`;
  if (row.parent_id) {
    return `${name} will be deleted, along with the time tracked against it. The task it belongs to and its other subtasks are not affected. This cannot be undone.`;
  }
  const kids = row.subtask_count ?? row.subtasks?.length ?? 0;
  if (!kids) {
    return `${name} will be deleted, along with the time tracked against it — the reports read the same figures. This cannot be undone.`;
  }
  return `${name} and its ${kids} subtask${kids === 1 ? "" : "s"} will be deleted, including any assigned to other people, along with the time tracked against them — the reports read the same figures. This cannot be undone.`;
};
