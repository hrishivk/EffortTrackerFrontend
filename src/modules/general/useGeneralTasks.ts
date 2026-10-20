import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchTask, fetchTaskGroups } from "../../core/actions/action";
import { fetchWorkspace, fetchWorkspaces } from "../../core/actions/workspaceAction";
import { visibleWorkspaces, WORKSPACES_CHANGED } from "../workspace/data/workspaceHelpers";
import { mergeTask, taskFromWrite } from "../dashboard/components/MyTasksView/helpers";
import type { TaskGroup } from "../dashboard/types";
import type { taskList, Workspace, WorkspaceRoom } from "../user/types";

/** A room the viewer can put tasks in, with the workspace it belongs to. */
export type GeneralRoom = {
  room: WorkspaceRoom;
  workspace: Workspace;
};

export type GeneralTask = taskList & {
  workspaceId: string;
  workspaceName: string;
  roomName: string;
};

// The day's tasks in one go; the page paginates the list itself.
const TASK_LIMIT = 200;

type Viewer = { id?: string | number | null; role?: string } | null | undefined;

const isUserOrDev = (role?: string) => role === "USER" || role === "DEVLOPER";

// The same shape useBoardGroups gives a board's groups.
const toGroups = (res: unknown): TaskGroup[] => {
  const rows = (res as { data?: unknown } | null)?.data;
  return (Array.isArray(rows) ? rows : [])
    .map((g: Record<string, unknown>): TaskGroup => ({
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
    .filter((g) => g.id && g.name);
};

/**
 * The General list. Opening the page asks for the day's tasks only — each task
 * carries its room and workspace. Everything else is fetched when it is used:
 * the workspace list when the picker opens, a workspace's rooms when it is
 * picked, the board lanes on the first Start / Complete.
 */
export function useGeneralTasks(user: Viewer, date: Date, workspaceId: string, roomId: string) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false);
  const [details, setDetails] = useState<Record<string, Workspace>>({});
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [rawTasks, setRawTasks] = useState<taskList[]>([]);
  const [loading, setLoading] = useState(true);
  const workspaceList = useRef<Promise<Workspace[]> | null>(null);
  const workspaceDetail = useRef(new Map<string, Promise<Workspace | null>>());
  const groupList = useRef<Promise<TaskGroup[]> | null>(null);
  const taskRequest = useRef(0);

  const userId = user?.id != null ? String(user.id) : "";
  const role = user?.role ?? "";

  /** The workspaces the viewer can pick, fetched once on first use. */
  const ensureWorkspaces = useCallback(() => {
    if (!workspaceList.current) {
      workspaceList.current = fetchWorkspaces()
        .then((list) => visibleWorkspaces(list, { id: userId, role }))
        .catch(() => [] as Workspace[])
        .then((list) => {
          setWorkspaces(list);
          setWorkspacesLoaded(true);
          return list;
        });
    }
    return workspaceList.current;
  }, [userId, role]);

  /** One workspace with its rooms, fetched once on first use. */
  const ensureWorkspace = useCallback((id: string) => {
    if (!id) return Promise.resolve(null);
    const known = workspaceDetail.current.get(id);
    if (known) return known;
    const request = fetchWorkspace(id)
      .then((ws) => {
        setDetails((d) => ({ ...d, [id]: ws }));
        return ws;
      })
      .catch(() => null);
    workspaceDetail.current.set(id, request);
    return request;
  }, []);

  /** The viewer's board lanes, fetched once on first use. */
  const ensureGroups = useCallback(() => {
    if (!groupList.current) {
      groupList.current = fetchTaskGroups()
        .then(toGroups)
        .catch(() => [] as TaskGroup[])
        .then((list) => {
          setGroups(list);
          setGroupsLoaded(true);
          return list;
        });
    }
    return groupList.current;
  }, []);

  useEffect(() => {
    if (workspaceId) void ensureWorkspace(workspaceId);
  }, [workspaceId, ensureWorkspace]);

  // A workspace added, renamed or closed elsewhere: drop what was cached, and
  // fetch it again only when it is next used.
  useEffect(() => {
    const reset = () => {
      workspaceList.current = null;
      workspaceDetail.current.clear();
      setWorkspacesLoaded(false);
      setDetails({});
    };
    window.addEventListener(WORKSPACES_CHANGED, reset);
    return () => window.removeEventListener(WORKSPACES_CHANGED, reset);
  }, []);

  // The day's tasks: one call, narrowed to a room only when one is picked.
  const loadTasks = useCallback(async () => {
    const mine = ++taskRequest.current;
    setLoading(true);
    try {
      const res = await fetchTask(
        date,
        userId,
        role,
        {
          ...(roomId ? { room_id: roomId } : {}),
          ...(isUserOrDev(role) ? { assigned_to: userId } : {}),
        },
        { page: 1, limit: TASK_LIMIT }
      );
      if (mine !== taskRequest.current) return;
      setRawTasks((res?.data ?? []) as taskList[]);
    } catch {
      if (mine === taskRequest.current) setRawTasks([]);
    } finally {
      if (mine === taskRequest.current) setLoading(false);
    }
  }, [date, roomId, userId, role]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  // Tasks with where they live (empty for a General task, which has no room),
  // narrowed to the picked workspace — a General task drops out once one is.
  const tasks = useMemo<GeneralTask[]>(
    () =>
      rawTasks
        .map((t) => ({
          ...t,
          workspaceId: String(t.room?.workspace?.id ?? ""),
          workspaceName: t.room?.workspace?.name ?? "",
          roomName: t.room?.name ?? "",
        }))
        .filter((t) => !workspaceId || t.workspaceId === workspaceId)
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        ),
    [rawTasks, workspaceId]
  );

  /** The rooms of a workspace the viewer works in. */
  const roomsOf = useCallback(
    (ws: Workspace | null | undefined): GeneralRoom[] =>
      (ws?.rooms ?? [])
        .filter(
          (room) =>
            !isUserOrDev(role) || room.members.some((m) => String(m.id) === userId)
        )
        .map((room) => ({ room, workspace: ws as Workspace })),
    [role, userId]
  );

  // A write's fresh copy of a task, merged into the list in place.
  const applyWrite = (res: unknown) => {
    const fresh = taskFromWrite(res);
    if (fresh) setRawTasks((list) => mergeTask(list, fresh));
  };

  return {
    workspaces,
    workspacesLoaded,
    details,
    groups,
    groupsLoaded,
    tasks,
    roomsOf,
    ensureWorkspaces,
    ensureWorkspace,
    ensureGroups,
    loading,
    reload: loadTasks,
    applyWrite,
  };
}
