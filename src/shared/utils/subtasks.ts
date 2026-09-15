import type { TaskUser } from "../../modules/user/types";

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
