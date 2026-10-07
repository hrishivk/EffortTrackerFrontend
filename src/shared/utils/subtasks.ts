import type { TaskUser } from "../../modules/user/types";

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

interface AssignedTask {
  assigned_to?: string | number | null;
  assignedUser?: TaskUser | null;
  dailyLog?: { assignedUser?: TaskUser } | null;
}

export const assigneeOf = (task?: AssignedTask | null): TaskUser | null =>
  task?.assignedUser ?? task?.dailyLog?.assignedUser ?? null;

export const assigneeIdOf = (task?: AssignedTask | null): string =>
  String(assigneeOf(task)?.id ?? task?.assigned_to ?? "");
