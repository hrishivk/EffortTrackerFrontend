import { parseServerTime } from "./serverTime";

/**
 * Whether a task's clock is currently running.
 *
 * A task is running only if it is in progress, has a start, and has no stop that
 * postdates that start. Keying off `status === "in_progress"` alone is what
 * produced totals like "19h 27m": a task whose session had been closed kept
 * counting from its old start forever.
 *
 * The `end_time < start_time` case is a resumed task — the old stop is still on
 * the record but is now older than the new start, so it closes nothing.
 *
 * `start_time` can also be null on a task carried over from a previous day,
 * which would otherwise make the elapsed arithmetic NaN.
 */
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

/** Does this task have anything worth showing in a timer slot? */
export const hasTrackedTime = (task: {
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  total_seconds?: number;
}): boolean => (task.total_seconds ?? 0) > 0 || isTaskRunning(task);

/**
 * Seconds on the clock: the API's accumulated total plus the running segment.
 * `now` is passed in so a ticking component controls its own re-render cadence.
 */
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

/** The shape this reports on. `subtasks` is accepted but no longer read. */
interface TimedTask {
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  total_seconds?: number;
  subtasks?: TimedTask[];
}

/**
 * A task's clock — **its own**, whether or not it has subtasks.
 *
 * This used to derive a parent's times from its children: it started when the
 * first subtask started, ran continuously until the last one finished, and
 * reported that span as the parent's total. So a parent had no clock of its own
 * and starting any child silently started the parent's.
 *
 * That is now wrong on two counts. A shared task's children belong to different
 * people, so "the span since somebody started something" is not a number the
 * task owner ever asked for; and the parent has a Start and a Complete of its
 * own, which have to record the parent's own timestamps. Each row on the detail
 * panel now reports only what it actually did.
 *
 * Kept as a function rather than inlined at the call sites so there is still
 * one place that answers "what clock does this row show".
 */
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
