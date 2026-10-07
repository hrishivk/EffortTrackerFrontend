import type { formUserData } from "../../../../shared/types/User";
import type { taskList } from "../../../user/types";
import type { SubtaskDraft } from "../CreateTaskModal";
import { assigneeIdOf, assigneeOf } from "../../../../shared/utils/subtasks";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import { avatarColors, PROJECT_COLORS } from "./constants";
import type { CreateForm, GroupedTask, ProjectColor } from "./types";

export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const getStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done")
    return { label: "DONE", color: "#16a34a", bg: "#dcfce7", pct: 100 };
  if (s === "in_progress")
    return { label: "IN PROGRESS", color: "#2563eb", bg: "#dbeafe", pct: 65 };
  if (s === "review")
    return { label: "REVIEW", color: "#d97706", bg: "#fef3c7", pct: 90 };
  if (s === "yet_to_start" || s === "pending")
    return { label: "YET TO START", color: "#d97706", bg: "#fef3c7", pct: 0 };
  if (s) return { label: s.replace(/_/g, " ").toUpperCase(), color: "#6b7280", bg: "#f3f4f6", pct: 0 };
  return { label: "TODO", color: "#6b7280", bg: "#f3f4f6", pct: 0 };
};

export const avatarColorFor = (users: formUserData[], id: unknown) =>
  avatarColors[
    Math.max(0, users.findIndex((u) => String(u.id) === String(id))) % avatarColors.length
  ];

export const slipsOn = (task: taskList): number =>
  (task.extension_count ?? task.extensions?.length ?? 0) +
  (task.subtasks ?? []).reduce(
    (sum, sub) => sum + (sub.extension_count ?? sub.extensions?.length ?? 0),
    0
  );

export const findTaskById = (list: taskList[], id: string | null): taskList | null => {
  if (!id) return null;
  for (const t of list) {
    if (String(t.id) === id) return t;
    const kid = findTaskById(t.subtasks ?? [], id);
    if (kid) return kid;
  }
  return null;
};

export const taskFromWrite = (res: unknown): taskList | null => {
  const data = (res as { data?: taskList & { parent?: taskList | null } } | null)?.data;
  if (!data || typeof data !== "object") return null;
  if (data.parent) return data.parent;
  return data.id !== undefined && !data.parent_id ? data : null;
};

export const mergeTask = (list: taskList[], fresh: taskList): taskList[] =>
  list.map((t) => (String(t.id) === String(fresh.id) ? { ...t, ...fresh } : t));

export const isOnTask = (task: taskList, personId: string): boolean =>
  assigneeIdOf(task) === personId ||
  (task.subtasks ?? []).some((sub) => assigneeIdOf(sub) === personId);

export const normalizeStatus = (value?: string | null) =>
  (value || "").toLowerCase().replace(/[\s-]+/g, "_");

export const isConflict = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status === 409;

export const assigneeNameOf = (task?: taskList | null): string =>
  assigneeOf(task)?.fullName || "";

export const buildProjectColorMap = (projects: any[]) => {
  const map: Record<string, ProjectColor> = {};
  projects.forEach((p, i) => {
    map[p.name] = PROJECT_COLORS[i % PROJECT_COLORS.length];
  });
  return map;
};

export const userNameLookup =
  (users: formUserData[]) => (id: string | number | null | undefined) => {
    if (!id) return "Unassigned";
    const u = users.find((u) => String(u.id) === String(id));
    return u?.fullName || "Unknown";
  };

export const viewedPersonNameOf = (
  viewUserId: string | undefined,
  viewUserName: string | undefined,
  tasks: taskList[],
  users: formUserData[]
) => {
  if (!viewUserId) return "";
  if (viewUserName) return viewUserName;
  const target = String(viewUserId);
  for (const t of tasks) {
    for (const row of [t, ...(t.subtasks ?? [])]) {
      if (assigneeIdOf(row) === target) {
        const name = assigneeNameOf(row);
        if (name) return name;
      }
    }
  }
  return users.find((u) => String(u.id) === target)?.fullName || "";
};

export const createdByOf =(task: taskList): string =>
  String(task.created_by ?? task.dailyLog?.created_by ?? "");

export const projectNameOf = (project: GroupedTask["project"] | undefined): string =>
  typeof project === "object" && project !== null ? project.name : project || "";

export const formatDateLabel = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  const dayMs = 86400000;
  if (diff === 0) return "Today";
  if (diff === -dayMs) return "Yesterday";
  if (diff === dayMs) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

export const shiftDay = (date: Date, delta: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
};

export const blankForm = (
  lockedProject: string | undefined,
  viewUserId: string | undefined,
  startDate: string
): CreateForm => ({
  taskName: "",
  project: lockedProject ?? "",
  assignees: viewUserId ? [viewUserId] : [],
  priority: "HIGH",
  startDate,
  dueDate: "",
  sequential: false,
  subtasks: [],
});

export const toSubtaskPayload = (subtasks: SubtaskDraft[]) =>
  subtasks.map((sub, i) => ({
    name: sub.name,
    ...(sub.assignee ? { assigned_to: sub.assignee } : {}),
    position: i + 1,
    priority: sub.priority,
    start_date: sub.startDate || undefined,
    due_date: sub.dueDate || undefined,
  }));

export const deletedMessage = (kids: number) =>
  kids
    ? `Task deleted, with its ${kids} subtask${kids === 1 ? "" : "s"}`
    : "Task deleted";

export const partialFailureMessage = (
  verb: string,
  done: number,
  total: number,
  error: unknown,
  fallback: string
) =>
  done
    ? `${verb} ${done} of ${total} — ${apiMessage(error, "the rest were refused")}`
    : apiMessage(error, fallback);

export const rowDeletePrompt = (row: GroupedTask | null): string => {
  if (!row) return "";
  const name = `“${row.description}”`;
  const kids = row.subtask_count ?? row.subtasks?.length ?? 0;
  const copies = row.tasks.length;
  const shared =
    copies > 1 ? ` It is assigned to ${copies} people, and every copy goes.` : "";
  if (!kids) {
    return `${name} will be deleted, along with the time tracked against it — the reports read the same figures.${shared} This cannot be undone.`;
  }
  return `${name} and its ${kids} subtask${kids === 1 ? "" : "s"} will be deleted, including any assigned to other people, along with the time tracked against them — the reports read the same figures.${shared} This cannot be undone.`;
};

export const lastSubtaskDue = (subtasks: SubtaskDraft[]) =>
  subtasks.reduce((latest, sub) => (sub.dueDate > latest ? sub.dueDate : latest), "");
