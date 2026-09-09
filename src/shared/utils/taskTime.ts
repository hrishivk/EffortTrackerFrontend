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

/** The shape the roll-up needs from a child task. */
interface TimedTask {
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  total_seconds?: number;
  subtasks?: TimedTask[];
}

/**
 * When a task is broken into subtasks, its clock is theirs.
 *
 * A parent has no timer of its own — you start and finish the children — so its
 * times are derived: it starts when the first subtask starts and ends when the
 * last one finishes.
 *
 * The total is the **span**, not the sum of the children's active time. Once the
 * first subtask starts the parent's watch runs continuously and does not pause
 * between children; it stops only when every subtask is done. That is the
 * elapsed time the task has been open, which is what a parent's clock means.
 *
 * A task with no subtasks reports its own values unchanged.
 */
export const taskTiming = (
  task: TimedTask
): {
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  runningSince?: string | null;
  totalSeconds: number;
} => {
  const kids = task.subtasks ?? [];
  if (!kids.length) {
    return {
      status: task.status,
      startTime: task.start_time,
      endTime: task.end_time,
      runningSince: task.start_time,
      totalSeconds: task.total_seconds ?? 0,
    };
  }

  const done = (t: TimedTask) => {
    const s = (t.status || "").toLowerCase().replace(/[\s-]+/g, "_");
    return s === "completed" || s === "done";
  };

  const starts = kids.map((k) => k.start_time).filter(Boolean) as string[];
  const ends = kids.map((k) => k.end_time).filter(Boolean) as string[];
  const firstStart = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : null;
  const allDone = kids.every(done);
  const lastEnd = allDone && ends.length ? ends.reduce((a, b) => (a > b ? a : b)) : null;

  // Nothing has begun: the parent has no clock yet.
  if (!firstStart) {
    return {
      status: task.status,
      startTime: task.start_time,
      endTime: null,
      runningSince: null,
      totalSeconds: 0,
    };
  }

  // Finished: a fixed span from the first start to the last finish.
  if (lastEnd) {
    const span = Math.max(
      0,
      Math.floor((parseServerTime(lastEnd) - parseServerTime(firstStart)) / 1000)
    );
    return {
      status: task.status,
      startTime: firstStart,
      endTime: lastEnd,
      runningSince: null,
      totalSeconds: span,
    };
  }

  // Still open: tick from the first start, with no accumulated base — the live
  // segment *is* the total, so it never pauses between subtasks.
  return {
    status: "in_progress",
    startTime: firstStart,
    endTime: null,
    runningSince: firstStart,
    totalSeconds: 0,
  };
};
