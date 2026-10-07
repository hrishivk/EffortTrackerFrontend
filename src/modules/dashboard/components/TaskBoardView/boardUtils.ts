import { parseServerTime } from "../../../../shared/utils/serverTime";
import type { BoardTask, BoardColumnKey, BoardLane, TaskGroup } from "../../types";
import {
  BOARD_COLUMNS,
  DEFAULT_LANE_KEYS,
  groupLaneKey,
  groupNameToStatus,
  STATUS_LANE_ORDER,
  STATUS_ACCENT,
  toBoardColumnKey,
} from "../boardConstants";
import { dueState } from "../../../../shared/utils/taskStatus";

export const projectName = (project: BoardTask["project"]) =>
  typeof project === "object" && project !== null ? project.name : String(project || "");

export const formatCardDate = (value?: string | null, dense = false) => {
  if (!value) return null;
  const ms = parseServerTime(value);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    ...(dense ? {} : { year: "numeric" }),
  });
};

export const cardWhen = (task: BoardTask, statusKey: string | undefined, dense: boolean) => {
  if (statusKey === "completed" && task.end_time) {
    return { label: "Done", value: formatCardDate(task.end_time, dense) };
  }
  if (statusKey === "yet_to_start") {
    if (task.start_date) return { label: "Starts", value: formatCardDate(task.start_date, dense) };
    if (task.due_date) return { label: "Due", value: formatCardDate(task.due_date, dense) };
  }
  if (task.start_time) {
    return { label: "Started", value: formatCardDate(task.start_time, dense) };
  }
  if (task.due_date) {
    return { label: "Due", value: formatCardDate(task.due_date, dense) };
  }
  if (task.created_at) {
    return { label: "Added", value: formatCardDate(task.created_at, dense) };
  }
  return null;
};

export const resolveColumn = (task: BoardTask): BoardColumnKey => {
  const statuses = (task.assignees || []).map((a) => toBoardColumnKey(a.status));
  if (!statuses.length) return toBoardColumnKey(task.status);
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.every((s) => s === "completed")) return "completed";
  return "yet_to_start";
};

export const buildLanes = (groups: TaskGroup[]): BoardLane[] => {
  const lanes: BoardLane[] = groups.map((g) => {
    const statusKey = g.status || groupNameToStatus(g.name);
    return {
      key: groupLaneKey(g.id),
      label: g.name.trim(),
      groupId: g.id,
      accent: (statusKey && STATUS_ACCENT[statusKey]) || g.color,
      statusKey,
      position: g.position ?? 0,
    };
  });

  const rank = (l: BoardLane) => {
    const i = l.statusKey ? STATUS_LANE_ORDER.indexOf(l.statusKey) : -1;
    return i === -1 ? STATUS_LANE_ORDER.length : i;
  };
  return lanes.sort(
    (a, b) => rank(a) - rank(b) || (a.position ?? 0) - (b.position ?? 0)
  );
};

export const fallbackLanes = (): BoardLane[] =>
  DEFAULT_LANE_KEYS.map((key) => {
    const c = BOARD_COLUMNS.find((col) => col.key === key)!;
    return { key, label: c.label, accent: c.accent, statusKey: key };
  });

const urgency = (task: BoardTask) => {
  const state = dueState(task.due_date, task.status);
  return state === "overdue" ? 0 : state === "today" ? 1 : 2;
};

/**
 * Sorts tasks into lane buckets. `placed` holds optimistic lane keys for
 * tasks mid-move; those float to the top of their new lane.
 */
export const bucketTasks = <T extends BoardTask>(
  tasks: T[],
  lanes: BoardLane[],
  placed: Record<string, string>
) => {
  const laneKeys = new Set(lanes.map((l) => l.key));

  const laneByStatus = new Map<string, string>();
  for (const l of lanes) if (l.statusKey && !laneByStatus.has(l.statusKey)) {
    laneByStatus.set(l.statusKey, l.key);
  }

  const laneOf = (task: T): string => {
    const optimistic = placed[task.key];
    if (optimistic) return optimistic;
    if (task.group_id) {
      const key = groupLaneKey(task.group_id);
      if (laneKeys.has(key)) return key;
    }
    const column = resolveColumn(task);
    return laneByStatus.get(column) ?? column;
  };

  const buckets = new Map<string, T[]>();
  for (const l of lanes) buckets.set(l.key, []);
  for (const c of BOARD_COLUMNS) if (!buckets.has(c.key)) buckets.set(c.key, []);
  for (const task of tasks) {
    const key = laneOf(task);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(task);
  }

  for (const bucket of buckets.values()) {
    bucket.sort(
      (a, b) =>
        (placed[a.key] ? 0 : 1) - (placed[b.key] ? 0 : 1) || urgency(a) - urgency(b)
    );
  }

  let hiddenCount = 0;
  for (const [key, bucket] of buckets) if (!laneKeys.has(key)) hiddenCount += bucket.length;

  return { buckets, hiddenCount };
};

export const omitKey = <V,>(record: Record<string, V>, key: string) => {
  const next = { ...record };
  delete next[key];
  return next;
};
