import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTaskGroup,
  deleteTaskGroup,
  fetchTaskGroups,
  updateTaskGroup,
} from "../../../../core/actions/action";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import type { GroupLaneChoice, NewGroupData, TaskGroup } from "../../types";
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
  // The last load failed: the board's groups are unknown, not empty — so the
  // "set up your board" popup must not open (it would re-create the shared
  // default lanes, which the backend rejects).
  const [loadFailed, setLoadFailed] = useState(false);

  const loadBoardGroups = useCallback(async () => {
    try {
      const res = await fetchTaskGroups(boardOwnerId, roomId);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setLoadFailed(false);
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
            withDefaultLanes: g.with_default_lanes === true,
          }))
          .filter((g: TaskGroup) => g.id && g.name)
          .sort(
            (a: TaskGroup, b: TaskGroup) => (a.position ?? 0) - (b.position ?? 0)
          )
      );
    } catch {
      setAllGroups([]);
      setLoadFailed(true);
    } finally {
      setGroupsLoaded(true);
    }
  }, [boardOwnerId, roomId]);

  useEffect(() => {
    if (loadFailed) {
      showSnackbar({
        message: "Could not load the board lanes. Refresh the page or try again later.",
        severity: "error",
      });
    }
  }, [loadFailed, showSnackbar]);

  useEffect(() => {
    // List view needs the groups too: its rows and status filter name them.
    if (viewMode !== "gantt") loadBoardGroups();
  }, [viewMode, loadBoardGroups]);

  // Adds only the default lanes this board does not have yet; the shared ones
  // (Yet to Start, In Progress, Completed, Production) already exist for all.
  const createDefaultLanes = async () => {
    const have = new Set(allGroups.map((g) => g.status || groupNameToStatus(g.name)));
    for (const key of DEFAULT_LANE_KEYS) {
      if (have.has(key)) continue;
      const column = BOARD_COLUMNS.find((c) => c.key === key)!;
      await createTaskGroup({ name: column.label, color: column.accent }, boardOwnerId, roomId);
    }
  };

  // The default flow: the shared built-in lanes (Yet to Start, In Progress,
  // Completed, Production), or a user's own copies of the status lanes.
  const isStatusLane = (g: TaskGroup) =>
    !!g.shared || DEFAULT_LANE_KEYS.includes(g.status || groupNameToStatus(g.name) || "");

  // The board shows ONE set at a time, hidden/shown per user and per room
  // (task_group_hides):
  // - the default set: the 4 lanes plus the groups added after them
  //   ("Add after the 4 lanes", with_default_lanes);
  // - "my groups": the user's other groups ("Use only my groups").
  const inDefaultSet = (g: TaskGroup) => isStatusLane(g) || !!g.withDefaultLanes;
  const isOwn = (g: TaskGroup) => !inDefaultSet(g);
  const ownGroups = allGroups.filter(isOwn);
  const statusLanes = allGroups.filter(isStatusLane);
  const defaultLanes = allGroups.filter(inDefaultSet);
  const shownDefaultLanes = boardGroups.filter(inDefaultSet);
  const hiddenDefaultLanes = hiddenGroups.filter(inDefaultSet);
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
    if (statusLanes.length === 0) await createDefaultLanes();
    await setHidden(hiddenDefaultLanes, false);
    await setHidden(shownOwnGroups, true);
  };

  // Which set the board opens on, when the saved hides do not settle it:
  // - the user has groups of their own -> those groups; the 4 lanes only
  //   after "Show default lanes" (which saves that choice);
  // - no groups of their own -> the 4 default lanes.
  // Two cases need fixing up:
  // - both sets visible (nothing hidden yet on this board): hide the 4 lanes;
  // - nothing visible (e.g. the last own group was removed): show the user's
  //   groups, or the 4 lanes when there are none — otherwise the board falls
  //   back to placeholder lanes without Production.
  const settle: { ids: TaskGroup[]; hidden: boolean } | null =
    !groupsLoaded || loadFailed
      ? null
      : shownDefaultLanes.length > 0 && shownOwnGroups.length > 0
        ? { ids: shownDefaultLanes, hidden: true }
        : boardGroups.length === 0 && hiddenGroups.length > 0
          ? { ids: hiddenOwnGroups.length > 0 ? hiddenOwnGroups : hiddenDefaultLanes, hidden: false }
          : null;
  const settleKey = settle ? `${settle.hidden}:${settle.ids.map((g) => g.id).join(",")}` : "";
  const settleTried = useRef("");
  useEffect(() => {
    if (!settle || settleTried.current === settleKey) return;
    settleTried.current = settleKey;
    void (async () => {
      try {
        await setHidden(settle.ids, settle.hidden);
      } catch {
        // Left as is; the toolbar's lane buttons still work.
      } finally {
        await loadBoardGroups();
      }
    })();
    // settleKey stands for `settle`; setHidden only reads boardOwnerId/roomId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settleKey, boardOwnerId, roomId, loadBoardGroups]);

  /**
   * A new group is created visible. While the board shows the default set,
   * `lanes` says which set it joins: "after_default" puts it after the 4 lanes
   * (it never shows with "Use only my groups"); "only_mine" makes it one of
   * the user's own groups and switches the board to them. Left out (the board
   * already shows the user's groups) it joins them. Nothing is deleted.
   */
  const handleGroupCreate = async (data: NewGroupData, lanes?: GroupLaneChoice) => {
    try {
      await createTaskGroup(
        { ...data, with_default_lanes: lanes === "after_default" },
        boardOwnerId,
        roomId
      );
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to create group"), severity: "error" });
      throw error;
    }
    // The group exists from here on, so a failure below must not read as a
    // failed create (the modal would stay open on a now-duplicate name).
    try {
      if (lanes === "only_mine") await showMyGroups();
      showSnackbar({ message: `Group "${data.name}" created`, severity: "success" });
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
    needsBoardSetup: groupsLoaded && !loadFailed && allGroups.length === 0,
    handleGroupCreate,
    handleGroupRename,
    handleGroupDelete,
    handleUseDefaultFlow,
    handleShowMyGroups,
    handleShowDefaultLanes,
  };
}
