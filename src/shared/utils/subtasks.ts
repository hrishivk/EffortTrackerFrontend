import type { SubtaskBlocker, TaskUser } from "../../modules/user/types";

/** How many of a task's children are finished, for the tally shown beside it. */
export const subtaskProgress = (
  subtasks?: { status?: string | null }[]
): { done: number; total: number } => {
  const total = subtasks?.length ?? 0;
  const done =
    subtasks?.filter((s) => {
      const v = (s.status || "").toLowerCase().replace(/[\s-]+/g, "_");
      return v === "completed" || v === "done";
    }).length ?? 0;
  return { done, total };
};

/** The slice of a task these helpers read. Both a parent and a child fit it. */
interface AssignedTask {
  assigned_to?: string | number | null;
  assignedUser?: TaskUser | null;
  dailyLog?: { assignedUser?: TaskUser } | null;
  is_blocked?: boolean;
  blocked_by?: SubtaskBlocker | null;
}

/**
 * The assignee of a task or subtask.
 *
 * The flat `assignedUser` is what every task now carries; `dailyLog` is the
 * older path and still populated, so it stays as the fallback rather than
 * leaving a row blank against an API that has not caught up.
 */
export const assigneeOf = (task?: AssignedTask | null): TaskUser | null =>
  task?.assignedUser ?? task?.dailyLog?.assignedUser ?? null;

export const assigneeIdOf = (task?: AssignedTask | null): string =>
  String(assigneeOf(task)?.id ?? task?.assigned_to ?? "");

/**
 * Why a subtask cannot be started yet, phrased for a tooltip — or null when it
 * can be.
 *
 * Read straight off the API's `is_blocked` / `blocked_by`. Nothing is inferred
 * from sibling statuses: the server computes these against the whole task, and
 * `blocked_by` names the *earliest* thing still outstanding rather than the row
 * immediately above, which is what somebody waiting actually needs told.
 */
export const blockedReason = (task?: AssignedTask | null): string | null => {
  if (!task?.is_blocked) return null;
  const on = task.blocked_by;
  if (!on) return "Waiting on an earlier subtask";
  const who = on.assignedUser?.fullName;
  return who
    ? `Waiting on "${on.description}" (${who})`
    : `Waiting on "${on.description}"`;
};

/** The slice needed to judge whether a parent's children are finished. */
interface ParentTask {
  subtask_count?: number;
  subtask_done_count?: number;
  subtasks?: { status?: string | null }[];
}

/** How many of a task's children are still unfinished. 0 when it has none. */
export const outstandingSubtasks = (task?: ParentTask | null): number => {
  const total = task?.subtask_count ?? task?.subtasks?.length ?? 0;
  if (!total) return 0;
  // The API's tally first; counting `subtasks[]` is the fallback for a response
  // that nested the children without the counts.
  const done = task?.subtask_done_count ?? subtaskProgress(task?.subtasks).done;
  return Math.max(0, total - done);
};

/**
 * Why a task cannot be marked complete yet, or null when it can be.
 *
 * A task is not finished while a piece of it is outstanding — a parent showing
 * DONE next to "1/2" is simply reporting something untrue. This is a different
 * gate from `blockedReason`: that one stops a subtask *starting* out of turn,
 * this one stops a parent *finishing* ahead of its children.
 *
 * It deliberately does not complete the parent for them. Starting and finishing
 * the task stay its owner's to do; this only stops them doing it too early.
 */
export const completeBlockedReason = (task?: ParentTask | null): string | null => {
  const n = outstandingSubtasks(task);
  if (!n) return null;
  return `${n} subtask${n === 1 ? "" : "s"} still to finish`;
};
