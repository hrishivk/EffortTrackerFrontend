import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../store/configureStore";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import TableList from "../../../shared/components/Table/Table";
import FilterPanel, {
  countActiveFilters,
} from "../../../shared/components/FilterPanel/FilterPanel";
import type { taskList } from "../../user/types";
import TaskGanttChart from "./TaskGanttChart";
import TaskBoardView from "./TaskBoardView";
import { assigneeIdOf } from "../../../shared/utils/subtasks";
import TaskDetailPanel from "./TaskDetailPanel";
import Dialoge from "../../../presentation/Dialog";
import CreateTaskModal from "./CreateTaskModal";
import { findGroupForStatus } from "./boardConstants";
import TaskDetailModal from "./TaskDetailModal";
import SpinLoader from "../../../presentation/SpinLoader";
import { toDateInput } from "../../../shared/utils/taskStatus";
import { BOARD_TASK_LIMIT } from "./MyTasksView/constants";
import {
  buildProjectColorMap,
  findTaskById,
  formatDateLabel,
  rowDeletePrompt,
  shiftDay,
  userNameLookup,
  viewedPersonNameOf,
} from "./MyTasksView/helpers";
import { groupTasks } from "./MyTasksView/groupTasks";
import { taskPermissions } from "./MyTasksView/permissions";
import { projectsForMember, scopeAssignees } from "./MyTasksView/assignees";
import { buildTaskColumns } from "./MyTasksView/taskColumns";
import { useIsCompact, useProjectsAndUsers, useTaskData } from "./MyTasksView/useTaskData";
import { useBoardGroups } from "./MyTasksView/useBoardGroups";
import { buildTaskFilterCategories, useTaskFilters } from "./MyTasksView/useTaskFilters";
import { useTaskActions } from "./MyTasksView/useTaskActions";
import { useCreateTaskForm } from "./MyTasksView/useCreateTaskForm";
import TasksHeader from "./MyTasksView/TasksHeader";
import ViewToolbar from "./MyTasksView/ViewToolbar";
import CreateTaskPanel from "./MyTasksView/CreateTaskPanel";
import { Dialog } from "@mui/material";
import BulkTaskImport from "../../sp/components/Create/CreateTask/BulkTaskImport";
import type {
  GroupedTask,
  MyTasksViewProps,
  PanelTab,
  ViewMode,
} from "./MyTasksView/types";

export default function MyTasksView({
  viewUserId,
  viewUserName,
  viewProject,
  viewTab,
  lockedProject,
  roomId,
  roomMembers = [],
  focusTaskId,
}: MyTasksViewProps) {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const userId = user?.id;
  const isUserOrDev = role === "USER" || role === "DEVLOPER";
  const isManagerView = role === "SP" || role === "AM";

  const isCompact = useIsCompact();
  const [viewMode, setViewMode] = useState<ViewMode>(
    viewTab === "gantt" ? "gantt" : viewTab === "board" ? "board" : "list"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [panelTaskId, setPanelTaskId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("subtasks");
  const [selectedTask, setSelectedTask] = useState<taskList | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { projects, users } = useProjectsAndUsers(role);

  const filters = useTaskFilters({
    role,
    userId,
    viewUserId,
    viewProject,
    viewTab,
    lockedProject,
    setViewMode,
    setPage,
  });

  const {
    tasks,
    loading,
    totalPages,
    boardTasks,
    boardLoading,
    boardHasMore,
    pool,
    loadTasks,
    loadBoardTasks,
    reloadTasks,
    applyWrite,
  } = useTaskData({
    selectedDate,
    userId,
    role,
    activeFilters: filters.activeFilters,
    page,
    viewUserId,
    viewMode,
  });

  const boardOwnerId = isManagerView && filters.assigneeFilter ? filters.assigneeFilter : undefined;
  const { boardGroups, handleGroupCreate, handleGroupRename, handleGroupDelete } =
    useBoardGroups(boardOwnerId, viewMode, loadBoardTasks);

  const { ownsAllTasks, mayDeleteTask, mayDeleteRow, mayEditRow, dragBlockedReason } =
    taskPermissions(userId, role, pool);

  const actions = useTaskActions({
    tasks,
    boardGroups,
    reloadTasks,
    loadBoardTasks,
    applyWrite,
    ownsAllTasks,
  });

  const formProjects = isUserOrDev ? projectsForMember(projects, userId) : projects;

  const create = useCreateTaskForm({
    lockedProject,
    viewUserId,
    selectedDate,
    viewMode,
    isUserOrDev,
    userId,
    roomId,
    formProjects,
    boardGroups,
    reloadTasks,
    loadBoardTasks,
  });

  const { assignableUsers, noMembersAssigned } = scopeAssignees({
    role,
    isUserOrDev,
    users,
    projects,
    formProject: create.form.project,
    viewUserId,
  });

  const projectColorMap = buildProjectColorMap(projects);
  const getUserName = userNameLookup(users);
  const viewedPersonName = viewedPersonNameOf(viewUserId, viewUserName, tasks, users);

  const filterCategories = buildTaskFilterCategories({
    role,
    userId,
    viewUserId,
    lockedProject,
    isUserOrDev,
    users,
    projects,
    projectFilter: filters.projectFilter,
    assigneeFilter: filters.assigneeFilter,
    boardGroups,
  });

  const openedFocus = useRef<string | null>(null);
  useEffect(() => {
    if (!focusTaskId || openedFocus.current === focusTaskId) return;
    const focusPool = viewMode === "board" ? boardTasks : tasks;
    if (!findTaskById(focusPool, focusTaskId)) return;
    openedFocus.current = focusTaskId;
    setPanelTaskId(focusTaskId);
  }, [focusTaskId, tasks, boardTasks, viewMode]);

  const panelTask = findTaskById(pool, panelTaskId);

  const liveSelected = selectedTask
    ? { ...selectedTask, ...(findTaskById(pool, String(selectedTask.id)) ?? {}) }
    : null;

  const openPanel = (row: GroupedTask, tab?: PanelTab) => {
    if (tab) setPanelTab(tab);
    setPanelTaskId(String(row.tasks[0]?.id ?? ""));
  };

  const openSubtask = (row: GroupedTask, subtaskId: string) => {
    const sub = (row.subtasks ?? []).find((x) => String(x.id) === String(subtaskId));
    if (!sub) return;
    const parent = row.tasks[0];
    setSelectedTask({
      ...sub,
      project: sub.project ?? parent?.project,
      dailyLog: sub.dailyLog ?? parent?.dailyLog,
    });
  };

  const taskColumns = buildTaskColumns({
    isManagerView,
    users,
    projectColorMap,
    quickBusy: actions.quickBusy,
    mayEditRow,
    mayDeleteRow,
    ownsAllTasks,
    openPanel,
    onDeleteRow: actions.setPendingRowDelete,
    onQuickStatus: (row, next) => void actions.handleQuickStatus(row, next),
  });

  const changeDate = (next: Date | ((d: Date) => Date)) => {
    setSelectedDate(next);
    setPage(1);
  };

  const emptyMessage = `No tasks found for ${formatDateLabel(selectedDate)}`;

  return (
    <div>
      <TasksHeader
        viewUserId={viewUserId}
        viewedPersonName={viewedPersonName}
        isCompact={isCompact}
        showCreateButton={viewMode !== "gantt" && !create.showCreateForm}
        onCreate={() =>
          viewMode === "board" ? create.setCreateTaskOpen(true) : create.openCreateForm()
        }
        onImport={() => setImportOpen(true)}
        filterCount={countActiveFilters(filters.filterValues)}
        onOpenFilters={() => setFilterOpen(true)}
      />

      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, backgroundColor: "var(--bg-card)" } }}
      >
        <BulkTaskImport
          projects={formProjects}
          createdBy={userId ? String(userId) : undefined}
          assigneeId={viewUserId ? String(viewUserId) : userId ? String(userId) : undefined}
          assigneeName={
            viewUserId ? viewedPersonName || getUserName(viewUserId) : user?.fullName
          }
          onCreated={reloadTasks}
          onClose={() => setImportOpen(false)}
        />
      </Dialog>

      <ViewToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isCompact={isCompact}
        selectedDate={selectedDate}
        onShiftDay={(delta) => changeDate((d) => shiftDay(d, delta))}
        onToday={() => changeDate(new Date())}
        onPickDate={changeDate}
      />

      {viewMode === "gantt" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <TaskGanttChart
            tasks={tasks}
            users={users}
            projects={filters.projectFilter ? projects.filter(p => p.name === filters.projectFilter) : projects}
            projectColorMap={projectColorMap}
            getUserName={getUserName}
            loading={loading}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        </motion.div>
      ) : (
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
        <AnimatePresence>
          {create.showCreateForm && (
            <CreateTaskPanel
              create={create}
              lockedProject={lockedProject}
              formProjects={formProjects}
              isUserOrDev={isUserOrDev}
              role={role}
              viewUserId={viewUserId}
              noMembersAssigned={noMembersAssigned}
              assignableUsers={assignableUsers}
              users={users}
              getUserName={getUserName}
              currentUserName={user?.fullName}
              onGoToProjects={() => navigate(`/${(role || "").toLowerCase()}/domain-project`)}
              roomMembers={roomMembers}
            />
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
          {viewMode === "board" ? (
            <>
              <TaskBoardView<GroupedTask>
                tasks={groupTasks(boardTasks, isManagerView, getUserName)}
                projectColorMap={projectColorMap}
                loading={boardLoading}
                isCompact={isCompact}
                emptyMessage={emptyMessage}
                onTaskClick={(row) => setSelectedTask(row.tasks[0])}
                onSubtaskClick={openSubtask}
                onTaskMove={actions.handleTaskMove}
                dragBlockedReason={dragBlockedReason}
                groups={boardGroups}
                onGroupCreate={handleGroupCreate}
                onGroupRename={handleGroupRename}
                onGroupDelete={handleGroupDelete}
              />
              {boardHasMore && !boardLoading && (
                <p className="text-center mt-3 mb-0" style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  Showing the first {BOARD_TASK_LIMIT} tasks for {formatDateLabel(selectedDate)}. Narrow the filters to see the rest.
                </p>
              )}
            </>
          ) : loading ? (
            <SpinLoader isLoading />
          ) : (
            <TableList<GroupedTask>
              columns={taskColumns}
              data={groupTasks(tasks, isManagerView, getUserName)}
              pagination={{ currentPage: page, totalPages, onPageChange: (p) => setPage(p) }}
              emptyMessage={emptyMessage}
            />
          )}
          </motion.div>
          </AnimatePresence>
        </div>
      </div>
      )}

      <TaskDetailModal
        task={liveSelected}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onStatusUpdate={viewMode === "board" ? loadBoardTasks : loadTasks}
        canStartTask={
          liveSelected ? assigneeIdOf(liveSelected) === String(userId) : false
        }
        projectColorMap={projectColorMap}
        groups={boardGroups}
        showSnackbar={showSnackbar}
      />

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
        roomMembers={roomMembers}
        projectColorMap={projectColorMap}
      />

      <CreateTaskModal
        open={create.createTaskOpen}
        onClose={() => create.setCreateTaskOpen(false)}
        projects={formProjects}
        assignableUsers={assignableUsers}
        defaultStartDate={toDateInput(selectedDate)}
        startLane={findGroupForStatus(boardGroups, "yet_to_start")}
        fixedProject={lockedProject}
        defaultAssignee={
          viewUserId
            ? { id: viewUserId, name: viewedPersonName || getUserName(viewUserId) }
            : undefined
        }
        isUserOrDev={isUserOrDev}
        currentUserName={user?.fullName}
        roomMembers={roomMembers}
        submitting={create.submitting}
        onSubmit={create.handleModalCreate}
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

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Tasks"
        categories={filterCategories}
        values={filters.filterValues}
        onApply={filters.applyFilters}
      />
    </div>
  );
}
