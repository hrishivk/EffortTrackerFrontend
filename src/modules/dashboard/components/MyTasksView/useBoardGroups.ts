import { useCallback, useEffect, useState } from "react";
import {
  createTaskGroup,
  deleteTaskGroup,
  fetchTaskGroups,
  updateTaskGroup,
} from "../../../../core/actions/action";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import type { NewGroupData, TaskGroup } from "../../types";
import { BOARD_COLUMNS, DEFAULT_LANE_KEYS, groupNameToStatus } from "../boardConstants";
import type { ViewMode } from "./types";

export function useBoardGroups(
  boardOwnerId: string | undefined,
  viewMode: ViewMode,
  loadBoardTasks: () => Promise<void>,
  roomId?: string
) {
  const { showSnackbar } = useSnackbar();
  // Every group of this board, hidden ones included.
  const [allGroups, setAllGroups] = useState<TaskGroup[]>([]);
  const boardGroups = allGroups.filter((g) => !g.hidden);
  const hiddenGroups = allGroups.filter((g) => g.hidden);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  const loadBoardGroups = useCallback(async () => {
    try {
      const res = await fetchTaskGroups(boardOwnerId, roomId);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setAllGroups(
        rows
          .map((g: Record<string, unknown>) => ({
            id: String(g.id),
            name: String(g.name ?? ""),
            color: String(g.color ?? "#7c3aed"),
            position: typeof g.position === "number" ? g.position : undefined,
            status: typeof g.status === "string" ? g.status : undefined,
            hidden: g.hidden === true,
            shared: g.is_shared === true,
            marksStatus:
              g.marks_status === "in_progress" || g.marks_status === "completed"
                ? g.marks_status
                : undefined,
          }))
          .filter((g: TaskGroup) => g.id && g.name)
          .sort(
            (a: TaskGroup, b: TaskGroup) => (a.position ?? 0) - (b.position ?? 0)
          )
      );
    } catch {
      setAllGroups([]);
    } finally {
      setGroupsLoaded(true);
    }
  }, [boardOwnerId, roomId]);

  useEffect(() => {
    // List view needs the groups too: its rows and status filter name them.
    if (viewMode !== "gantt") loadBoardGroups();
  }, [viewMode, loadBoardGroups]);

  const createDefaultLanes = async () => {
    for (const key of DEFAULT_LANE_KEYS) {
      const column = BOARD_COLUMNS.find((c) => c.key === key)!;
      await createTaskGroup({ name: column.label, color: column.accent }, boardOwnerId, roomId);
    }
  };

  // The default flow: the shared built-in lanes (Yet to Start, In Progress,
  // Completed, Production), or a user's own copies of the status lanes.
  const isStatusLane = (g: TaskGroup) =>
    !!g.shared || DEFAULT_LANE_KEYS.includes(g.status || groupNameToStatus(g.name) || "");

  // The board shows ONE set at a time: the default lanes, or the user's own
  // groups. Each side is hidden/shown per user and per room (task_group_hides).
  const isOwn = (g: TaskGroup) => !isStatusLane(g);
  const ownGroups = allGroups.filter(isOwn);
  const defaultLanes = allGroups.filter(isStatusLane);
  const shownDefaultLanes = boardGroups.filter(isStatusLane);
  const hiddenDefaultLanes = hiddenGroups.filter(isStatusLane);
  const shownOwnGroups = boardGroups.filter(isOwn);
  const hiddenOwnGroups = hiddenGroups.filter(isOwn);
  const boardMode: "default" | "groups" =
    shownDefaultLanes.length > 0 || ownGroups.length === 0 ? "default" : "groups";

  const setHidden = async (groups: TaskGroup[], hidden: boolean) => {
    for (const g of groups) {
      await updateTaskGroup(g.id, {
        hidden,
        ...(boardOwnerId ? { assigned_to: boardOwnerId } : {}),
        ...(roomId ? { room_id: roomId } : {}),
      });
    }
  };

  const showMyGroups = async () => {
    await setHidden(shownDefaultLanes, true);
    await setHidden(hiddenOwnGroups, false);
  };

  const showDefaultLanes = async () => {
    if (defaultLanes.length === 0) await createDefaultLanes();
    else await setHidden(hiddenDefaultLanes, false);
    await setHidden(shownOwnGroups, true);
  };

  /**
   * A new group joins the user's other groups. While the board shows the
   * default lanes it is hidden with them (only one set is on the board at a
   * time) until "Show my groups"; on a groups board it shows right away.
   */
  const handleGroupCreate = async (data: NewGroupData) => {
    const onDefaultLanes = shownDefaultLanes.length > 0;
    let created: TaskGroup | undefined;
    try {
      const res = await createTaskGroup(data, boardOwnerId, roomId);
      const id = res?.data?.id;
      if (id) created = { id: String(id), name: data.name, color: data.color };
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to create group"), severity: "error" });
      throw error;
    }
    // The group exists from here on, so a failure below must not read as a
    // failed create (the modal would stay open on a now-duplicate name).
    try {
      if (onDefaultLanes) {
        if (created) await setHidden([created], true);
        showSnackbar({
          message: `Group "${data.name}" created. Use "Show my groups" to see it.`,
          severity: "success",
        });
      } else {
        showSnackbar({ message: `Group "${data.name}" created`, severity: "success" });
      }
    } catch (error: unknown) {
      showSnackbar({
        message: `Group "${data.name}" created, but the board lanes could not be updated: ${apiMessage(error, "request failed")}`,
        severity: "warning",
      });
    } finally {
      await loadBoardGroups();
    }
  };

  const switchLanes = (action: () => Promise<void>, done: string) => async () => {
    try {
      await action();
      showSnackbar({ message: done, severity: "success" });
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to switch the lanes"), severity: "error" });
    } finally {
      await loadBoardGroups();
    }
  };

  const handleShowMyGroups = switchLanes(showMyGroups, "Showing your groups. No task was changed.");
  const handleShowDefaultLanes = switchLanes(
    showDefaultLanes,
    "Showing the default lanes. No task was changed."
  );

  const handleUseDefaultFlow = async () => {
    try {
      await createDefaultLanes();
      showSnackbar({ message: "Default flow added to the board", severity: "success" });
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to set up the board"), severity: "error" });
    } finally {
      await loadBoardGroups();
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

  return {
    boardGroups,
    allGroups,
    ownGroups,
    boardMode,
    defaultLaneCount: defaultLanes.length,
    needsBoardSetup: groupsLoaded && allGroups.length === 0,
    handleGroupCreate,
    handleGroupRename,
    handleGroupDelete,
    handleUseDefaultFlow,
    handleShowMyGroups,
    handleShowDefaultLanes,
  };
}
