import { useCallback, useEffect, useState } from "react";
import {
  createTaskGroup,
  deleteTaskGroup,
  fetchTaskGroups,
  updateTaskGroup,
} from "../../../../core/actions/action";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import type { TaskGroup } from "../../types";
import type { ViewMode } from "./types";

export function useBoardGroups(
  boardOwnerId: string | undefined,
  viewMode: ViewMode,
  loadBoardTasks: () => Promise<void>
) {
  const { showSnackbar } = useSnackbar();
  const [boardGroups, setBoardGroups] = useState<TaskGroup[]>([]);

  const loadBoardGroups = useCallback(async () => {
    try {
      const res = await fetchTaskGroups(boardOwnerId);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setBoardGroups(
        rows
          .map((g: Record<string, unknown>) => ({
            id: String(g.id),
            name: String(g.name ?? ""),
            color: String(g.color ?? "#7c3aed"),
            position: typeof g.position === "number" ? g.position : undefined,
            status: typeof g.status === "string" ? g.status : undefined,
          }))
          .filter((g: TaskGroup) => g.id && g.name)
          .sort(
            (a: TaskGroup, b: TaskGroup) => (a.position ?? 0) - (b.position ?? 0)
          )
      );
    } catch {
      setBoardGroups([]);
    }
  }, [boardOwnerId]);

  useEffect(() => {
    if (viewMode === "board") loadBoardGroups();
  }, [viewMode, loadBoardGroups]);

  const handleGroupCreate = async (data: { name: string; color: string }) => {
    try {
      await createTaskGroup(data, boardOwnerId);
      showSnackbar({ message: `Group "${data.name}" created`, severity: "success" });
      await loadBoardGroups();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to create group"), severity: "error" });
      throw error;
    }
  };

  const handleGroupRename = async (groupId: string, name: string) => {
    const previous = boardGroups.find((g) => g.id === groupId)?.name;
    try {
      await updateTaskGroup(groupId, { name });
      showSnackbar({
        message: previous
          ? `Group "${previous}" renamed to "${name}"`
          : `Group renamed to "${name}"`,
        severity: "success",
      });
      await loadBoardGroups();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to rename group"), severity: "error" });
    }
  };

  const handleGroupDelete = async (groupId: string) => {
    try {
      await deleteTaskGroup(groupId);
      showSnackbar({ message: "Group removed", severity: "success" });
      await Promise.all([loadBoardGroups(), loadBoardTasks()]);
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to remove group"), severity: "error" });
    }
  };

  return { boardGroups, handleGroupCreate, handleGroupRename, handleGroupDelete };
}
