import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTask } from "../../../../core/actions/action";
import {
  fetchAllExistProjects,
  fetchAllUsers,
} from "../../../../core/actions/spAction";
import type { TaskListFilters } from "../../../../core/services/userService";
import type { formUserData } from "../../../../shared/types/User";
import type { taskList } from "../../../user/types";
import { BOARD_TASK_LIMIT, ITEMS_PER_PAGE } from "./constants";
import { isOnTask, mergeTask, taskFromWrite } from "./helpers";
import type { UserId, ViewMode } from "./types";

export function useIsCompact() {
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isCompact;
}

export function useProjectsAndUsers(role: string | undefined) {
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<formUserData[]>([]);

  const loadInitialData = useCallback(async () => {
    try {
      const projRes = await fetchAllExistProjects();
      setProjects(projRes?.data || []);
      if (role === "SP" || role === "AM") {
        const userRes = await fetchAllUsers();
        setUsers(userRes?.data || []);
      }
    } catch {
    }
  }, [role]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return { projects, users };
}

export function useTaskData({
  selectedDate,
  userId,
  role,
  activeFilters,
  page,
  viewUserId,
  viewMode,
}: {
  selectedDate: Date;
  userId: UserId;
  role: string;
  activeFilters: () => TaskListFilters;
  page: number;
  viewUserId?: string;
  viewMode: ViewMode;
}) {
  const [tasks, setTasks] = useState<taskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [boardTasks, setBoardTasks] = useState<taskList[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardHasMore, setBoardHasMore] = useState(false);

  const scopedPersonId =
    viewUserId || (role === "USER" || role === "DEVLOPER" ? String(userId) : "");

  const scopeToViewedUser = useCallback(
    (rows: taskList[]) =>
      scopedPersonId ? rows.filter((t) => isOnTask(t, scopedPersonId)) : rows,
    [scopedPersonId]
  );

  const listRequest = useRef(0);
  const boardRequest = useRef(0);

  const loadTasks = useCallback(async () => {
    const mine = ++listRequest.current;
    setLoading(true);
    try {
      const taskRes = await fetchTask(selectedDate, String(userId), role, activeFilters(), { page, limit: ITEMS_PER_PAGE });
      if (mine !== listRequest.current) return;
      setTasks(scopeToViewedUser(taskRes?.data || []));
      setTotalPages(taskRes?.totalPages || 1);
    } catch {
      if (mine === listRequest.current) setTasks([]);
    } finally {
      if (mine === listRequest.current) setLoading(false);
    }
  }, [selectedDate, userId, role, activeFilters, page, scopeToViewedUser]);

  const loadBoardTasks = useCallback(async () => {
    const mine = ++boardRequest.current;
    setBoardLoading(true);
    try {
      const res = await fetchTask(selectedDate, String(userId), role, activeFilters(), { page: 1, limit: BOARD_TASK_LIMIT });
      if (mine !== boardRequest.current) return;
      setBoardTasks(scopeToViewedUser(res?.data || []));
      setBoardHasMore((res?.totalPages || 1) > 1);
    } catch {
      if (mine !== boardRequest.current) return;
      setBoardTasks([]);
      setBoardHasMore(false);
    } finally {
      if (mine === boardRequest.current) setBoardLoading(false);
    }
  }, [selectedDate, userId, role, activeFilters, scopeToViewedUser]);

  useEffect(() => {
    if (viewMode !== "board") loadTasks();
  }, [viewMode, loadTasks]);

  useEffect(() => {
    if (viewMode === "board") loadBoardTasks();
  }, [viewMode, loadBoardTasks]);

  const reloadTasks = () =>
    viewMode === "board" ? loadBoardTasks() : loadTasks();

  const applyWrite = (res: unknown) => {
    const fresh = taskFromWrite(res);
    if (!fresh) return;
    setTasks((list) => mergeTask(list, fresh));
    setBoardTasks((list) => mergeTask(list, fresh));
  };

  return {
    tasks,
    loading,
    totalPages,
    boardTasks,
    boardLoading,
    boardHasMore,
    pool: viewMode === "board" ? boardTasks : tasks,
    loadTasks,
    loadBoardTasks,
    reloadTasks,
    applyWrite,
  };
}
