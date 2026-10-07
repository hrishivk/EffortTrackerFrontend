import type { taskList } from "../../../user/types";
import { assigneeIdOf } from "../../../../shared/utils/subtasks";
import { createdByOf, findTaskById, isOnTask } from "./helpers";
import type { GroupedTask, UserId } from "./types";

export function taskPermissions(userId: UserId, role: string | undefined, pool: taskList[]) {
  const me = String(userId);

  const ownsAllTasks = (row: GroupedTask) =>
    row.tasks.every((t) => assigneeIdOf(t) === me);

  const mayDeleteTask = (row: taskList): boolean => {
    if (!userId) return false;
    if (role === "SP") return true;
    if (createdByOf(row) === me) return true;

    if (row.parent_id) {
      const parent = findTaskById(pool, String(row.parent_id));
      if (parent && createdByOf(parent) === me) return true;
    }
    return false;
  };

  const mayDeleteRow = (row: GroupedTask) => row.tasks.every(mayDeleteTask);

  const mayEditRow = (row: GroupedTask) => {
    if (!userId) return false;
    return row.tasks.some((t) => isOnTask(t, me) || createdByOf(t) === me);
  };

  const dragBlockedReason = (row: GroupedTask): string | null =>
    ownsAllTasks(row) ? null : "Only the assignee can move this task";

  return { ownsAllTasks, mayDeleteTask, mayDeleteRow, mayEditRow, dragBlockedReason };
}
