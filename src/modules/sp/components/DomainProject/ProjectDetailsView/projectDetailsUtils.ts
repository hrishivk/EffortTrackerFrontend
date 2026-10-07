import type { GroupedPdTask } from "../../../types";
import type { taskList } from "../../../../user/types";

export const TASKS_PER_PAGE = 5;

export type TaskFormState = {
  taskName: string;
  assignees: string[];
  priority: string;
  dueDate: string;
};

export const EMPTY_TASK_FORM: TaskFormState = {
  taskName: "",
  assignees: [],
  priority: "HIGH",
  dueDate: "",
};

export const PRIORITY_OPTIONS = [
  { key: "HIGH", label: "HIGH", icon: "!", color: "#dc2626", bg: "#fef2f2" },
  { key: "MEDIUM", label: "MEDIUM", icon: "=", color: "#d97706", bg: "#fffbeb" },
  { key: "LOW", label: "LOW", icon: "⚡", color: "#7c3aed", bg: "#f5f3ff" },
];

export const normalizeStatus = (status?: string) =>
  (status || "").toLowerCase().replace(/[\s_]+/g, "_");

export const isDoneStatus = (status?: string) => {
  const s = normalizeStatus(status);
  return s === "completed" || s === "done";
};

export const pageWindow = (current: number, total: number): (number | "…")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const from = Math.min(Math.max(current - 1, 2), total - 3);
  const middle = [from, from + 1, from + 2];

  return [
    1,
    ...(middle[0] > 2 ? (["…"] as const) : []),
    ...middle,
    ...(middle[2] < total - 1 ? (["…"] as const) : []),
    total,
  ];
};

// Tasks with the same description and project are shown as one card with several assignees.
export const groupProjectTasks = (
  tasks: taskList[],
  getUserName: (id: string | number | null | undefined) => string
): GroupedPdTask[] => {
  const map = new Map<string, taskList[]>();
  for (const t of tasks) {
    const projObj = typeof t.project === "object" && t.project !== null ? t.project : null;
    const projName = projObj ? projObj.name : (t.project || "");
    const projId = t.project_id || (projObj ? projObj.id : "");
    const desc = (t.description || "").trim();
    const proj = projId ? String(projId) : String(projName).trim();
    const groupKey = `${desc}|||${proj}`;
    if (!map.has(groupKey)) map.set(groupKey, []);
    map.get(groupKey)!.push(t);
  }
  const rows: GroupedPdTask[] = [];
  for (const [key, groupTasks] of map) {
    const first = groupTasks[0];
    const assignees = groupTasks.map((t) => ({
      name: t.dailyLog?.assignedUser?.fullName || getUserName(t.dailyLog?.assigned_to || t.assigned_to) || "Unassigned",
      status: t.status || "",
      userId: t.dailyLog?.assigned_to || t.assigned_to,
    }));
    let start: string | null = null;
    let end: string | null = null;
    for (const t of groupTasks) {
      if (t.start_time && (!start || t.start_time < start)) start = t.start_time;
      if (t.end_time && (!end || t.end_time > end)) end = t.end_time;
    }
    const statuses = groupTasks.map((t) => normalizeStatus(t.status));
    let groupStatus = first.status || "";
    if (statuses.some((s) => s === "in_progress")) groupStatus = "In Progress";
    else if (statuses.every((s) => s === "completed" || s === "done")) groupStatus = "Completed";
    rows.push({
      key,
      description: first.description,
      project: first.project,
      priority: first.priority,
      status: groupStatus,
      start_time: start,
      end_time: end,
      tasks: groupTasks,
      assignees,
    });
  }
  return rows;
};
