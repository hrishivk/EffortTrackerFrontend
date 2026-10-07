import { parseServerTime } from "./serverTime";

export const isTaskRunning = (task: {
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}): boolean => {
  const s = (task.status || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (s !== "in_progress") return false;
  if (!task.start_time) return false;
  const start = parseServerTime(task.start_time);
  if (Number.isNaN(start)) return false;
  if (!task.end_time) return true;
  const end = parseServerTime(task.end_time);
  return Number.isNaN(end) ? true : end < start;
};

export const hasTrackedTime = (task: {
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  total_seconds?: number;
}): boolean => (task.total_seconds ?? 0) > 0 || isTaskRunning(task);

export const trackedSeconds = (
  task: {
    status?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    total_seconds?: number;
  },
  now: number
): number => {
  const total = task.total_seconds ?? 0;
  if (!isTaskRunning(task)) return total;
  const elapsed = Math.floor((now - parseServerTime(task.start_time)) / 1000);
  return total + Math.max(0, elapsed);
};

interface TimedTask {
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  total_seconds?: number;
  subtasks?: TimedTask[];
}

export const taskTiming = (
  task: TimedTask
): {
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  runningSince?: string | null;
  totalSeconds: number;
} => ({
  status: task.status,
  startTime: task.start_time,
  endTime: task.end_time,
  runningSince: task.start_time,
  totalSeconds: task.total_seconds ?? 0,
});
