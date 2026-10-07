import { useState } from "react";
import {
  addSubtask,
  addTaskComment,
  deleteTask,
  editTaskComment,
  extendTask,
  removeTaskComment,
  updateTask,
  updateTaskLane,
} from "../../../../core/actions/action";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import type {
  AddSubtaskInput,
  TaskEditFields,
  taskList,
} from "../../../user/types";
import type { TaskGroup } from "../../types";
import { findGroupForStatus } from "../boardConstants";
import {
  deletedMessage,
  isConflict,
  normalizeStatus,
  partialFailureMessage,
} from "./helpers";
import type { GroupedTask } from "./types";

type NextStatus = "in_progress" | "completed";

export function useTaskActions({
  tasks,
  boardGroups,
  reloadTasks,
  loadBoardTasks,
  applyWrite,
  ownsAllTasks,
}: {
  tasks: taskList[];
  boardGroups: TaskGroup[];
  reloadTasks: () => Promise<void>;
  loadBoardTasks: () => Promise<void>;
  applyWrite: (res: unknown) => void;
  ownsAllTasks: (row: GroupedTask) => boolean;
}) {
  const { showSnackbar } = useSnackbar();
  const [quickBusy, setQuickBusy] = useState<Record<string, boolean>>({});
  const [pendingRowDelete, setPendingRowDelete] = useState<GroupedTask | null>(null);
  const [deletingRow, setDeletingRow] = useState(false);

  const setBusy = (key: string, on: boolean) =>
    setQuickBusy((b) => {
      if (on) return { ...b, [key]: true };
      const rest = { ...b };
      delete rest[key];
      return rest;
    });

  const laneFor = (next: NextStatus) => {
    const lane = findGroupForStatus(boardGroups, next);
    return lane ? { groupId: lane.id } : { status: next, groupId: null };
  };

  const reportStatusError = async (error: unknown, fallback: string) => {
    showSnackbar({
      message: apiMessage(error, fallback),
      severity: isConflict(error) ? "warning" : "error",
    });
    if (isConflict(error)) await reloadTasks();
  };

  const handleQuickStatus = async (row: GroupedTask, next: NextStatus) => {
    const ids = row.tasks.map((t) => String(t.id));
    setBusy(row.key, true);
    try {
      await Promise.all(ids.map((id) => updateTaskLane(id, laneFor(next))));
      showSnackbar({
        message: next === "in_progress" ? "Task started" : "Task completed",
        severity: "success",
      });
      await reloadTasks();
    } catch (error: unknown) {
      await reportStatusError(error, "Failed to update task");
    } finally {
      setBusy(row.key, false);
    }
  };

  const handleSubtaskStatus = async (subtaskId: string | undefined, next: NextStatus) => {
    if (!subtaskId) return;
    const key = String(subtaskId);
    const parentStatusBefore = tasks.find((t) =>
      (t.subtasks ?? []).some((sub) => String(sub.id) === key)
    )?.status;
    setBusy(key, true);
    try {
      const res = await updateTaskLane(key, laneFor(next));
      applyWrite(res);

      const rolled: taskList | null = res?.data?.parent ?? null;
      const parentMoved =
        !!rolled && normalizeStatus(rolled.status) !== normalizeStatus(parentStatusBefore);

      showSnackbar({
        message: parentMoved
          ? `Subtask ${next === "in_progress" ? "started" : "completed"} — but the server also moved the main task`
          : next === "in_progress"
            ? "Subtask started"
            : "Subtask completed",
        severity: parentMoved ? "warning" : "success",
      });
      await reloadTasks();
    } catch (error: unknown) {
      await reportStatusError(error, "Failed to update subtask");
    } finally {
      setBusy(key, false);
    }
  };

  const handleTaskMove = async (
    row: GroupedTask,
    target: { groupId?: string; statusKey?: string; label: string }
  ) => {
    if (!ownsAllTasks(row)) {
      showSnackbar({ message: "Only the assignee can move this task", severity: "error" });
      throw new Error("not-assignee");
    }

    const payload = target.groupId
      ? { groupId: target.groupId }
      : { status: target.statusKey, groupId: null };

    const alreadyThere = (t: taskList) =>
      target.groupId
        ? String(t.group_id || "") === target.groupId
        : !t.group_id && normalizeStatus(t.status) === target.statusKey;
    const toUpdate = row.tasks.filter((t) => !alreadyThere(t));

    try {
      await Promise.all(toUpdate.map((t) => updateTaskLane(String(t.id), payload)));
      showSnackbar({ message: `Moved to ${target.label}`, severity: "success" });
      await loadBoardTasks();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to move task"), severity: "error" });
      throw error;
    }
  };

  const commentAction = async (run: () => Promise<unknown>, failure: string, success?: string) => {
    try {
      await run();
      await reloadTasks();
      if (success) showSnackbar({ message: success, severity: "success" });
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, failure), severity: "error" });
    }
  };

  const handleCommentAdd = (taskId: string, body: string) =>
    commentAction(() => addTaskComment(taskId, body), "Failed to post comment");

  const handleCommentEdit = (taskId: string, commentId: string, body: string) =>
    commentAction(() => editTaskComment(taskId, commentId, body), "Failed to edit comment");

  const handleCommentDelete = (taskId: string, commentId: string) =>
    commentAction(
      () => removeTaskComment(taskId, commentId),
      "Failed to delete comment",
      "Comment deleted"
    );

  const writeAndReload = async (
    run: () => Promise<unknown>,
    success: string,
    failure: string
  ) => {
    try {
      applyWrite(await run());
      showSnackbar({ message: success, severity: "success" });
      await reloadTasks();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, failure), severity: "error" });
      throw error;
    }
  };

  const handleTaskEdit = (taskId: string, fields: TaskEditFields) =>
    writeAndReload(() => updateTask(taskId, fields), "Task updated", "Failed to update task");

  const handleTaskExtend = (taskId: string, input: { due_date: string; reason: string }) =>
    writeAndReload(() => extendTask(taskId, input), "Deadline extended", "Failed to extend the task");

  const handleTaskDelete = async (taskId: string) => {
    try {
      const res = await deleteTask(taskId);
      showSnackbar({ message: deletedMessage(res?.deleted_subtasks ?? 0), severity: "success" });
      await reloadTasks();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to delete task"), severity: "error" });
      throw error;
    }
  };

  const handleRowDelete = async (row: GroupedTask) => {
    setDeletingRow(true);
    let gone = 0;
    let kids = 0;
    try {
      for (const t of row.tasks) {
        const res = await deleteTask(String(t.id));
        gone += 1;
        kids += res?.deleted_subtasks ?? 0;
      }
      showSnackbar({ message: deletedMessage(kids), severity: "success" });
    } catch (error: unknown) {
      showSnackbar({
        message: partialFailureMessage("Deleted", gone, row.tasks.length, error, "Failed to delete task"),
        severity: "error",
      });
    } finally {
      setDeletingRow(false);
      setPendingRowDelete(null);
      await reloadTasks();
    }
  };

  const handleSubtasksAdd = async (
    parentId: string,
    rows: AddSubtaskInput[],
    sequential?: boolean
  ): Promise<number> => {
    let added = 0;
    try {
      for (const row of rows) {
        applyWrite(await addSubtask(parentId, row));
        added += 1;
      }
    } catch (error: unknown) {
      showSnackbar({
        message: partialFailureMessage("Added", added, rows.length, error, "Failed to add subtask"),
        severity: "error",
      });
      if (added) await reloadTasks();
      return added;
    }

    let orderFailed = "";
    if (sequential !== undefined) {
      try {
        await updateTask(parentId, { sequential });
      } catch (error: unknown) {
        orderFailed = apiMessage(error, "the order setting did not save");
      }
    }

    showSnackbar(
      orderFailed
        ? { message: `Subtasks added, but ${orderFailed}`, severity: "warning" }
        : {
            message: added === 1 ? "Subtask added" : `${added} subtasks added`,
            severity: "success",
          }
    );
    await reloadTasks();
    return added;
  };

  return {
    quickBusy,
    pendingRowDelete,
    setPendingRowDelete,
    deletingRow,
    handleQuickStatus,
    handleSubtaskStatus,
    handleTaskMove,
    handleCommentAdd,
    handleCommentEdit,
    handleCommentDelete,
    handleTaskEdit,
    handleTaskExtend,
    handleTaskDelete,
    handleRowDelete,
    handleSubtasksAdd,
  };
}
