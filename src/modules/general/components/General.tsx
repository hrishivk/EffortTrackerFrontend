import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";

import SpinLoader from "../../../presentation/SpinLoader";
import Dialoge from "../../../presentation/Dialog";
import TableList from "../../../shared/components/Table/Table";
import type { Column } from "../../../shared/components/Table/types";
import { useAppSelector } from "../../../store/configureStore";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { apiMessage } from "../../../shared/utils/apiMessage";
import { toDateInput } from "../../../shared/utils/taskStatus";
import { assigneeIdOf } from "../../../shared/utils/subtasks";
import { GENERAL_PROJECT } from "../../../shared/utils/projectName";
import { addTask } from "../../../core/actions/action";
import CreateTaskModal, {
  type CreateTaskFormData,
} from "../../dashboard/components/CreateTaskModal";
import TaskDetailPanel from "../../dashboard/components/TaskDetailPanel";
import { entryGroup, groupNameToStatus } from "../../dashboard/components/boardConstants";
import {
  buildProjectColorMap,
  findTaskById,
  formatDateLabel,
  projectNameOf,
  rowDeletePrompt,
  shiftDay,
  toSubtaskPayload,
} from "../../dashboard/components/MyTasksView/helpers";
import { ITEMS_PER_PAGE } from "../../dashboard/components/MyTasksView/constants";
import { groupTasks } from "../../dashboard/components/MyTasksView/groupTasks";
import { taskPermissions } from "../../dashboard/components/MyTasksView/permissions";
import { buildTaskColumns } from "../../dashboard/components/MyTasksView/taskColumns";
import { useTaskActions } from "../../dashboard/components/MyTasksView/useTaskActions";
import ViewToolbar from "../../dashboard/components/MyTasksView/ViewToolbar";
import type { GroupedTask, PanelTab } from "../../dashboard/components/MyTasksView/types";
import type { TaskGroup } from "../../dashboard/types";
import { OptionSelect } from "../../settings/components/TaskReports/ReportConfig";
import type { formUserData } from "../../../shared/types/User";
import { useGeneralTasks, type GeneralRoom, type GeneralTask } from "../useGeneralTasks";

const placeOf = (row: GroupedTask) => row.tasks[0] as GeneralTask | undefined;

type QuickStatus = { row: GroupedTask; next: "in_progress" | "completed" };

// Names already on the rows (the assignee comes with each task), so the page
// needs no user list of its own.
const noUsers: formUserData[] = [];
const unknownName = () => "Unknown";

export default function General() {
  const { showSnackbar } = useSnackbar();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role ?? "";
  const userId = user?.id;
  const isUserOrDev = role === "USER" || role === "DEVLOPER";
  const isManagerView = role === "SP" || role === "AM";

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workspaceFilter, setWorkspaceFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const {
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
    reload,
    applyWrite,
  } = useGeneralTasks(user, selectedDate, workspaceFilter, roomFilter);

  const [createOpen, setCreateOpen] = useState(false);
  const [createProject, setCreateProject] = useState("");
  const [placeRooms, setPlaceRooms] = useState<GeneralRoom[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [panelTaskId, setPanelTaskId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("subtasks");
  const [pendingQuick, setPendingQuick] = useState<QuickStatus | null>(null);

  // The picked workspace stays named in its picker before the list is fetched.
  const workspaceOptions = workspacesLoaded
    ? workspaces.map((ws) => ({ id: ws.id, name: ws.name }))
    : tasks
        .filter((t) => t.workspaceId === workspaceFilter)
        .slice(0, 1)
        .map((t) => ({ id: t.workspaceId, name: t.workspaceName }));

  // Rooms open up once a workspace is picked (its rooms are fetched then), and
  // only that workspace's rooms.
  const roomOptions = roomsOf(details[workspaceFilter]).map(({ room }) => ({
    id: room.id,
    name: room.name,
  }));

  // Rows as My Tasks builds them, but never merged across rooms: the same task
  // name in two rooms is two tasks.
  const rows = useMemo(() => {
    const byRoom = new Map<string, GeneralTask[]>();
    tasks.forEach((t) => {
      const key = String(t.room_id ?? "");
      if (!byRoom.has(key)) byRoom.set(key, []);
      byRoom.get(key)!.push(t);
    });
    return [...byRoom.entries()]
      .flatMap(([roomKey, list]) =>
        groupTasks(list, isManagerView, unknownName).map((row) => ({
          ...row,
          key: `${roomKey}|${row.key}`,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );
  }, [tasks, isManagerView]);

  const { ownsAllTasks, mayDeleteTask, mayDeleteRow, mayEditRow } = taskPermissions(
    userId,
    role,
    tasks
  );

  const actions = useTaskActions({
    tasks,
    boardGroups: groups,
    reloadTasks: reload,
    loadBoardTasks: reload,
    applyWrite,
    ownsAllTasks,
  });

  // Start / Complete need the board lanes; the first click fetches them and
  // the action runs once they are in.
  const quickStatus = (row: GroupedTask, next: QuickStatus["next"]) => {
    if (groupsLoaded) {
      void actions.handleQuickStatus(row, next);
      return;
    }
    setPendingQuick({ row, next });
    void ensureGroups();
  };

  useEffect(() => {
    if (!pendingQuick || !groupsLoaded) return;
    void actions.handleQuickStatus(pendingQuick.row, pendingQuick.next);
    setPendingQuick(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuick, groupsLoaded]);

  const projectColorMap = buildProjectColorMap(
    [...new Set(tasks.map((t) => projectNameOf(t.project)))].map((name) => ({ name }))
  );

  // A row names the own group it sits in; each task carries its group.
  const customGroups = new Map<string, TaskGroup>(
    tasks
      .map((t) => t.group)
      .filter((g): g is NonNullable<typeof g> => Boolean(g && !groupNameToStatus(g.name)))
      .map((g) => [String(g.id), g])
  );

  const openPanel = (row: GroupedTask, tab?: PanelTab) => {
    if (tab) setPanelTab(tab);
    setPanelTaskId(String(row.tasks[0]?.id ?? ""));
    // Subtask Start / Complete in the panel move through the lanes too.
    void ensureGroups();
  };

  const taskColumns = buildTaskColumns({
    isManagerView,
    users: noUsers,
    projectColorMap,
    quickBusy: {
      ...actions.quickBusy,
      ...(pendingQuick ? { [pendingQuick.row.key]: true } : {}),
    },
    mayEditRow,
    mayDeleteRow,
    ownsAllTasks,
    openPanel,
    onDeleteRow: actions.setPendingRowDelete,
    onQuickStatus: quickStatus,
    customGroups,
  });

  // My Tasks' columns, with where the task lives right after its name.
  const placeColumns: Column<GroupedTask>[] = [
    {
      key: "workspace",
      header: "Workspace",
      render: (row) => (
        <span className="gen-chip gen-chip--ws">{placeOf(row)?.workspaceName || GENERAL_PROJECT}</span>
      ),
    },
    {
      key: "room",
      header: "Room",
      render: (row) => <span className="gen-chip">{placeOf(row)?.roomName || GENERAL_PROJECT}</span>,
    },
  ];
  const columns = [taskColumns[0], ...placeColumns, ...taskColumns.slice(1)];

  const panelTask = findTaskById(tasks, panelTaskId) as GeneralTask | null;
  const panelRoom = panelTask
    ? details[panelTask.workspaceId]?.rooms?.find((r) => r.id === String(panelTask.room_id))
    : undefined;

  // Mentions and subtask assignees in the panel come from the task's room.
  useEffect(() => {
    if (panelTask?.workspaceId) void ensureWorkspace(panelTask.workspaceId);
  }, [panelTask?.workspaceId, ensureWorkspace]);

  // Create Task asks for the project first; the Room select then lists the
  // rooms of that project's workspaces, picked for you when there is one.
  // No project = a General task: no project and no room.
  const createProjects = [
    ...new Map(
      workspaces
        .filter((ws) => ws.project)
        .map((ws) => [ws.project!.name, { id: ws.project!.id, name: ws.project!.name }])
    ).values(),
  ];

  useEffect(() => {
    setRoomId("");
    setPlaceRooms([]);
    if (!createProject) return;
    let alive = true;
    setPlaceLoading(true);
    const owners = workspaces.filter((ws) => ws.project?.name === createProject);
    void Promise.all(owners.map((ws) => ensureWorkspace(ws.id))).then((list) => {
      if (!alive) return;
      const rooms = list.flatMap((ws) => roomsOf(ws));
      setPlaceRooms(rooms);
      setPlaceLoading(false);
      if (rooms.length === 1) setRoomId(rooms[0].room.id);
    });
    return () => {
      alive = false;
    };
  }, [createProject, workspaces, ensureWorkspace, roomsOf]);

  const target = placeRooms.find((r) => r.room.id === roomId) ?? null;
  const manyWorkspaces = new Set(placeRooms.map((r) => r.workspace.id)).size > 1;

  const projectHint = !createProject
    ? "No project: this will be a General task."
    : !placeLoading && placeRooms.length === 0
      ? "You are not in any room of this project's workspace."
      : undefined;

  const toAssignees = (members: GeneralRoom["room"]["members"] = []) =>
    members.map((m) => ({ id: m.id, name: m.fullName, role: m.role }));

  // The modal's assignee picker takes full user records; room members carry
  // only what the picker reads.
  const assignableUsers = (target?.room.members ?? []).map(
    (m) => ({ id: m.id, fullName: m.fullName, role: m.role, projects: [] }) as unknown as formUserData
  );

  const projectId = target?.workspace.project?.id ?? target?.workspace.project_id ?? undefined;

  const openCreate = () => {
    void ensureWorkspaces();
    setCreateProject("");
    setCreateOpen(true);
  };

  const handleCreate = async (data: CreateTaskFormData) => {
    if (!userId) return;
    // A project needs its room; no project at all is a General task.
    if (createProject && !target) {
      showSnackbar({
        message: placeRooms.length
          ? "Pick the room this task goes in"
          : "You are not in any room of this project's workspace",
        severity: "error",
      });
      return;
    }
    setSubmitting(true);
    try {
      const owner =
        isUserOrDev || !data.assignees.length ? String(userId) : data.assignees[0];
      const lanes = await ensureGroups();

      await addTask({
        description: data.taskName.trim(),
        ...(target
          ? { project: data.project, project_id: projectId ?? undefined, room_id: target.room.id }
          : {}),
        assigned_to: owner,
        created_by: userId,
        priority: data.priority,
        status: "yet_to_start",
        group_id: data.groupId || entryGroup(lanes)?.id,
        start_date: data.startDate || undefined,
        due_date: data.dueDate || undefined,
        tags: data.tags.length ? data.tags : undefined,
        sequential: data.subtasks.length > 1 ? data.sequential : undefined,
        subtasks: data.subtasks.length ? toSubtaskPayload(data.subtasks) : undefined,
      });

      showSnackbar({
        message: target
          ? `"${data.taskName.trim()}" created in ${target.workspace.name} · ${target.room.name}`
          : `"${data.taskName.trim()}" created in General`,
        severity: "success",
      });
      setCreateOpen(false);
      await reload();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to create task"), severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wsd gen">
      <div className="wsd__head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="wsd__title">General</h1>
          <p className="wsd__caption">
            Create tasks in your workspace rooms, or General tasks with no project, and track them in one list.
          </p>
        </div>
        <button type="button" className="gen-btn" onClick={openCreate}>
          <AddIcon sx={{ fontSize: 18 }} />
          Create Task
        </button>
      </div>

      <ViewToolbar
        viewMode="list"
        onViewModeChange={() => undefined}
        hideViewTabs
        isCompact={false}
        selectedDate={selectedDate}
        onShiftDay={(delta) => setSelectedDate((d) => shiftDay(d, delta))}
        onToday={() => setSelectedDate(new Date())}
        onPickDate={setSelectedDate}
        actions={
          <div className="gen-toolbar">
            <div className="gen-toolbar__select">
              <OptionSelect
                value={workspaceFilter}
                onChange={(id) => {
                  setWorkspaceFilter(id);
                  setRoomFilter("");
                }}
                onOpen={() => void ensureWorkspaces()}
                options={workspaceOptions}
                emptyLabel="All Workspaces"
              />
            </div>
            <div className="gen-toolbar__select">
              <OptionSelect
                value={roomFilter}
                onChange={setRoomFilter}
                options={roomOptions}
                emptyLabel={workspaceFilter ? "All Rooms" : "Select a workspace first"}
                disabled={!workspaceFilter}
              />
            </div>
          </div>
        }
      />

      {loading ? (
        <SpinLoader isLoading />
      ) : (
        <TableList<GroupedTask>
          columns={columns}
          data={rows}
          itemsPerPage={ITEMS_PER_PAGE}
          emptyMessage={`No tasks found for ${formatDateLabel(selectedDate)}`}
        />
      )}

      <TaskDetailPanel
        task={panelTask}
        open={panelTaskId !== null}
        onClose={() => setPanelTaskId(null)}
        owns={panelTask ? assigneeIdOf(panelTask) === String(userId) : false}
        currentUserId={userId}
        busy={actions.quickBusy}
        onStart={(id) => void actions.handleSubtaskStatus(id, "in_progress")}
        onComplete={(id) => void actions.handleSubtaskStatus(id, "completed")}
        onCommentAdd={actions.handleCommentAdd}
        onCommentEdit={actions.handleCommentEdit}
        onCommentDelete={actions.handleCommentDelete}
        onTaskEdit={actions.handleTaskEdit}
        onSubtaskAdd={actions.handleSubtasksAdd}
        onTaskDelete={actions.handleTaskDelete}
        onTaskExtend={actions.handleTaskExtend}
        initialTab={panelTab}
        canDelete={mayDeleteTask}
        roomMembers={toAssignees(panelRoom?.members)}
        projectColorMap={projectColorMap}
      />

      <Dialoge
        open={actions.pendingRowDelete !== null}
        data="delete"
        busy={actions.deletingRow}
        title="Delete this task?"
        message={rowDeletePrompt(actions.pendingRowDelete)}
        confirmLabel="Yes, delete"
        onClose={() => actions.setPendingRowDelete(null)}
        onConfirm={() => {
          if (actions.pendingRowDelete) void actions.handleRowDelete(actions.pendingRowDelete);
        }}
      />

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projects={createProjects}
        projectOptional
        onProjectChange={setCreateProject}
        projectHint={projectHint}
        roomPicker={{
          options: placeRooms.map(({ room, workspace }) => ({
            id: room.id,
            name: manyWorkspaces ? `${workspace.name} · ${room.name}` : room.name,
          })),
          value: roomId,
          onChange: setRoomId,
          disabled: !createProject || placeLoading || placeRooms.length === 0,
          required: Boolean(createProject),
          emptyLabel: !createProject
            ? "No project: General task"
            : placeLoading
              ? "Loading rooms…"
              : placeRooms.length
                ? "Select a room"
                : "No rooms you are in",
        }}
        assignableUsers={assignableUsers}
        defaultStartDate={toDateInput(selectedDate)}
        startLane={entryGroup(groups)}
        isUserOrDev={isUserOrDev}
        currentUserName={user?.fullName}
        roomMembers={toAssignees(target?.room.members)}
        submitting={submitting}
        onSubmit={handleCreate}
      />
    </div>
  );
}
