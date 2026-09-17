import { useCallback, useEffect, useRef, useState } from "react";
import {
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
} from "@mui/material";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { motion, AnimatePresence } from "framer-motion";
import { FiActivity, FiGrid, FiLayers, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../store/configureStore";
import {
  addTask,
  addTaskComment,
  createTaskGroup,
  deleteTaskGroup,
  editTaskComment,
  fetchTask,
  fetchTaskGroups,
  removeTaskComment,
  updateTaskGroup,
  updateTaskLane,
} from "../../../core/actions/action";
import type { TaskListFilters } from "../../../core/services/userService";
import {
  fetchAllExistProjects,
  fetchAllUsers,
} from "../../../core/actions/spAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import TableList from "../../../shared/components/Table/Table";
import type { Column } from "../../../shared/components/Table/types";
import type { formUserData } from "../../../shared/types/User";
import type { taskList, CreateTaskPayload } from "../../user/types";
import TaskGanttChart from "./TaskGanttChart";
import TaskBoardView from "./TaskBoardView";
import TaskTimer from "./TaskTimer";
import DueBadge from "./DueBadge";
import { taskTiming } from "../../../shared/utils/taskTime";
import {
  assigneeIdOf,
  assigneeOf,
} from "../../../shared/utils/subtasks";
import TaskActionCell from "./TaskActionCell";
import TaskDetailPanel from "./TaskDetailPanel";
import SubtaskEditor from "./SubtaskEditor";
import SubtaskProgress from "./SubtaskProgress";
import CreateTaskModal, {
  type CreateTaskFormData,
  type SubtaskAssignee,
  type SubtaskDraft,
} from "./CreateTaskModal";
import type { TaskGroup } from "../types";
import {
  findGroupForStatus,
  groupNameToStatus,
  STATUS_LANE_ORDER,
} from "./boardConstants";
import TaskDetailModal from "./TaskDetailModal";
import SpinLoader from "../../../presentation/SpinLoader";
import { parseServerTime } from "../../../shared/utils/serverTime";
import {
  TASK_STATUS_FILTER_OPTIONS,
  dueState,
  toDateInput,
  toLocalDate,
} from "../../../shared/utils/taskStatus";
import FilterPanel, {
  FilterTrigger,
  countActiveFilters,
  type FilterCategory,
  type FilterValues,
} from "../../../shared/components/FilterPanel/FilterPanel";

const PROJECT_COLORS = [
  { bg: "#dbeafe", text: "#2563eb", dot: "#2563eb" },
  { bg: "#dcfce7", text: "#16a34a", dot: "#16a34a" },
  { bg: "#fae8ff", text: "#a855f7", dot: "#a855f7" },
  { bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" },
  { bg: "#fef3c7", text: "#d97706", dot: "#d97706" },
  { bg: "#e0e7ff", text: "#4f46e5", dot: "#4f46e5" },
  { bg: "#ccfbf1", text: "#0d9488", dot: "#0d9488" },
  { bg: "#fce7f3", text: "#db2777", dot: "#db2777" },
];

/** One spring for the whole toggle so the pill, tap and icon pop move together. */
const TAB_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

/** Tasks view tabs: List and Board render the same task set, Gantt is the timeline. */
const VIEW_TABS = [
  { key: "list" as const,  label: "List View",   shortLabel: "List",  icon: FormatListBulletedIcon },
  { key: "board" as const, label: "Board View",  shortLabel: "Board", icon: ViewKanbanOutlinedIcon },
  { key: "gantt" as const, label: "Gantt Chart", shortLabel: "Gantt", icon: TimelineIcon },
];

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "#dc2626",
  High: "#dc2626",
  MEDIUM: "#f59e0b",
  Medium: "#f59e0b",
  LOW: "#2563eb",
  Low: "#2563eb",
};

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiInputBase-input": { padding: "8px 14px", fontSize: 13, color: "var(--text-primary)" },
};


const fixedSelectSx = {
  ...selectSx,
  "& .MuiOutlinedInput-root": {
    ...selectSx["& .MuiOutlinedInput-root"],
    backgroundColor: "var(--bg-hover)",
    "&.Mui-disabled": {
      "& fieldset": { borderColor: "var(--border-light)" },
      "& .MuiSelect-select": {
        WebkitTextFillColor: "var(--text-secondary)",
        color: "var(--text-secondary)",
      },
    },
  },
  "& .MuiSvgIcon-root.Mui-disabled": { display: "none" },
};

const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

const ITEMS_PER_PAGE = 5;

/** The Board is not paginated, so it asks for one large page of tasks. */
const BOARD_TASK_LIMIT = 200;

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done")
    return { label: "DONE", color: "#16a34a", bg: "#dcfce7", pct: 100 };
  if (s === "in_progress")
    return { label: "IN PROGRESS", color: "#2563eb", bg: "#dbeafe", pct: 65 };
  if (s === "review")
    return { label: "REVIEW", color: "#d97706", bg: "#fef3c7", pct: 90 };
  if (s === "yet_to_start" || s === "pending")
    return { label: "YET TO START", color: "#d97706", bg: "#fef3c7", pct: 0 };
  // A custom board group stores its own slug as the status, so show that rather
  // than flattening every unknown status to "TODO".
  if (s) return { label: s.replace(/_/g, " ").toUpperCase(), color: "#6b7280", bg: "#f3f4f6", pct: 0 };
  return { label: "TODO", color: "#6b7280", bg: "#f3f4f6", pct: 0 };
};

const avatarColors = [
  "#7c3aed",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#db2777",
  "#0d9488",
  "#4f46e5",
];

/**
 * The subtask tally shown next to a task's name, so it is obvious which rows are
 * worth expanding. Renders nothing when a task has no children.
 */

/** Find a task by id, looking inside subtasks too. */
const findTaskById = (list: taskList[], id: string | null): taskList | null => {
  if (!id) return null;
  for (const t of list) {
    if (String(t.id) === id) return t;
    const kid = findTaskById(t.subtasks ?? [], id);
    if (kid) return kid;
  }
  return null;
};

/**
 * Is this person actually on this task?
 *
 * True when they hold the task itself, or any subtask of it. The second half is
 * what keeps a shared task visible to everybody working it: three members, one
 * card, and each of them holds one piece.
 *
 * Merely being in the same room does not count. That is the difference between
 * "the work I have" and "everything happening near me".
 */
const isOnTask = (task: taskList, personId: string): boolean =>
  assigneeIdOf(task) === personId ||
  (task.subtasks ?? []).some((sub) => assigneeIdOf(sub) === personId);

/** Statuses arrive in a few spellings; compare them in one normalised form. */
const normalizeStatus = (value?: string | null) =>
  (value || "").toLowerCase().replace(/[\s-]+/g, "_");

/** Pull the API's error message off an axios failure, falling back to `fallback`. */
const apiMessage = (error: unknown, fallback: string): string => {
  const res = (error as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message || fallback;
};

/**
 * A move the server refused because it was out of turn, or against one of the
 * transition rules. Matched on the code, not the copy — the messages are
 * written to be shown as-is and will change.
 */
const isConflict = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status === 409;

const assigneeNameOf = (task?: taskList | null): string =>
  assigneeOf(task)?.fullName || "";

const formatDateLabel = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  const dayMs = 86400000;
  if (diff === 0) return "Today";
  if (diff === -dayMs) return "Yesterday";
  if (diff === dayMs) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

interface MyTasksViewProps {
  viewUserId?: string;
  /**
   * The viewed person's name, when the caller already knows it.
   *
   * `getUserName` looks names up in `users`, which is only fetched for SP and
   * AM — so a developer opening a teammate's page in their own room saw
   * "Unknown's Tasks". The room page has the name in hand from the room's
   * member list, so it passes it rather than the view widening its own
   * permissions to go and find it.
   */
  viewUserName?: string;
  viewProject?: string;
  viewTab?: string;
  /**
   * A project the caller has already settled, so the create form shows it but
   * cannot change it. Used by the workspace room pages, where the workspace
   * owns exactly one project.
   */
  lockedProject?: string;
  /**
   * The room this view belongs to, when it is one of the workspace pages.
   *
   * Set, a task raised here is the room's: it carries `room_id`, so the API
   * makes it readable by every member and validates each subtask's assignee
   * against the room's roster.
   */
  roomId?: string;
  /** That roster, so a subtask can be handed to one of them. */
  roomMembers?: SubtaskAssignee[];
  /**
   * A task to open as soon as it is on screen — the id a notification carried.
   * Always a **parent** task id; a subtask has no panel of its own, so a
   * notification about one points at the task it belongs to.
   */
  focusTaskId?: string;
}

type GroupedTask = {
  key: string;
  description: string;
  project: string | { id: string; name: string };
  priority: string;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string | null;
  /** Carried through so the Board can bucket the card by its group. */
  group_id?: string | null;
  /** The plan. `end_time` is the actual finish and gets overwritten. */
  start_date?: string | null;
  due_date?: string | null;
  /** Accumulated tracked seconds, summed across the row's assignees. */
  total_seconds?: number;
  /** Child tasks, from the first task in the row. */
  subtasks?: taskList[];
  /**
   * The API's own tally. Preferred over counting `subtasks[]`, which is only
   * what this response happened to nest.
   */
  subtask_count?: number;
  subtask_done_count?: number;
  status?: string;
  tasks: taskList[];
  assignees: { name: string; status: string; userId: string | number | null | undefined }[];
};

/**
 * Collapse tasks that are the same work assigned to several people into one row,
 * so the List table and the Board cards agree on what "a task" is. USER/DEVLOPER
 * only ever see their own tasks, so for them each task is its own row.
 */
function groupTasks(
  list: taskList[],
  isManagerView: boolean,
  getUserName: (id: string | number | null | undefined) => string
): GroupedTask[] {
  if (!isManagerView) {
    return list.map((t) => ({
      key: String(t.id),
      description: t.description,
      project: t.project,
      priority: t.priority,
      start_time: t.start_time,
      end_time: t.end_time,
      created_at: t.created_at,
      group_id: t.group_id,
      start_date: t.start_date,
      due_date: t.due_date,
      total_seconds: t.total_seconds ?? 0,
      subtasks: t.subtasks ?? [],
      subtask_count: t.subtask_count,
      subtask_done_count: t.subtask_done_count,
      status: t.status,
      tasks: [t],
      assignees: [{
        name: assigneeNameOf(t) || getUserName(t.assigned_to),
        status: t.status || "",
        userId: t.assigned_to,
      }],
    }));
  }

  const map = new Map<string, taskList[]>();
  for (const t of list) {
    const projName = typeof t.project === "object" && t.project !== null
      ? (t.project as any).name : (t.project || "");
    const projId = t.project_id || (typeof t.project === "object" && t.project !== null
      ? (t.project as any).id : "");
    const desc = (t.description || "").trim();
    const proj = projId ? String(projId) : String(projName).trim();
    const groupKey = `${desc}|||${proj}`;
    if (!map.has(groupKey)) map.set(groupKey, []);
    map.get(groupKey)!.push(t);
  }

  const rows: GroupedTask[] = [];
  for (const [key, rowTasks] of map) {
    const first = rowTasks[0];
    const assignees = rowTasks.map((t) => ({
      name: assigneeNameOf(t) || getUserName(t.assigned_to),
      status: t.status || "",
      userId: t.assigned_to,
    }));
    // Pick earliest start, latest end, earliest creation
    let start: string | null = null;
    let end: string | null = null;
    let created: string | null = null;
    let tracked = 0;
    for (const t of rowTasks) {
      if (t.start_time && (!start || t.start_time < start)) start = t.start_time;
      if (t.end_time && (!end || t.end_time > end)) end = t.end_time;
      if (t.created_at && (!created || t.created_at < created)) created = t.created_at;
      tracked += t.total_seconds ?? 0;
    }
    rows.push({
      key,
      description: first.description,
      project: first.project,
      priority: first.priority,
      start_time: start,
      end_time: end,
      created_at: created,
      group_id: first.group_id,
      // The plan is one task's, not per-assignee, so the first row carries it.
      start_date: first.start_date,
      due_date: first.due_date,
      total_seconds: tracked,
      // Subtasks belong to the task, not to an assignee, so the first row's set
      // is the row's set.
      subtasks: first.subtasks ?? [],
      subtask_count: first.subtask_count,
      subtask_done_count: first.subtask_done_count,
      status: first.status,
      tasks: rowTasks,
      assignees,
    });
  }
  return rows;
}

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

  // Detect compact screens (mobile/tablet < 768px)
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [tasks, setTasks] = useState<taskList[]>([]);
  const [loading, setLoading] = useState(true);
  // The Board fetches its own slice of /task-list: unpaginated, so every status
  // column is filled instead of showing whichever 5 tasks the List page holds.
  const [boardTasks, setBoardTasks] = useState<taskList[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardHasMore, setBoardHasMore] = useState(false);
  /** Board groups, straight from the API so a refresh shows the same lanes. */
  const [boardGroups, setBoardGroups] = useState<TaskGroup[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<formUserData[]>([]);
  const [search, _setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(viewProject || "");
  // Default: AM sees their own tasks, SP sees all
  const [assigneeFilter, setAssigneeFilter] = useState(
    viewUserId || (role === "AM" ? String(userId) : "")
  );
  // Comma-separated list of API statuses; "" = every status.
  const [statusFilter, setStatusFilter] = useState("");
  // "list" and "board" are two renderings of the same task set; "gantt" is its own view.
  const [viewMode, setViewMode] = useState<"list" | "board" | "gantt">(
    viewTab === "gantt" ? "gantt" : viewTab === "board" ? "board" : "list"
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  /** Rows with a start/complete request in flight, keyed by row or task id. */
  const [quickBusy, setQuickBusy] = useState<Record<string, boolean>>({});
  /**
   * The panel holds an id, not a snapshot: acting on a subtask reloads the list,
   * and deriving the task from that fresh data is what makes the open panel
   * update without being closed and reopened.
   */
  const [panelTaskId, setPanelTaskId] = useState<string | null>(null);
  const [assignToSelf, setAssignToSelf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<taskList | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    taskName: "",
    project: lockedProject ?? "",
    // Whose tasks are being viewed, so a task raised here is for them.
    assignees: (viewUserId ? [viewUserId] : []) as string[],
    priority: "HIGH",
    startDate: toDateInput(new Date()),
    dueDate: "",
    /** Subtasks run strictly in listed order — each waits for the one above. */
    sequential: false,
    subtasks: [] as SubtaskDraft[],
  });
  /**
   * The panel's step. The task's own fields fill the card on their own, so the
   * subtasks — which grow without limit — get a step of their own rather than a
   * third screen of scrolling under them.
   */
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  /**
   * Whether this task is being broken down. Off, the panel is the one card it
   * has always been and the button creates the task; on, there is a second step
   * to fill in first. Subtasks stay optional either way.
   */
  const [wantSubtasks, setWantSubtasks] = useState(false);

  /**
   * Opening the inline form puts the locked project and the viewed user back,
   * so a form reused after a submit or a cancel still files against the
   * workspace's project and for the person whose page this is.
   */
  const openCreateForm = () => {
    // The control is hidden on a member's page, so the flag must not linger.
    if (viewUserId) setAssignToSelf(false);
    setForm((f) => ({
      ...f,
      // The day on screen, so a task raised here lands where you are looking.
      startDate: f.startDate || toDateInput(selectedDate),
      ...(lockedProject ? { project: lockedProject } : {}),
      ...(viewUserId && !f.assignees.length ? { assignees: [viewUserId] } : {}),
    }));
    setCreateStep(1);
    setWantSubtasks(false);
    setShowCreateForm(true);
  };

  // Build project color map
  const projectColorMap: Record<string, (typeof PROJECT_COLORS)[0]> = {};
  projects.forEach((p, i) => {
    projectColorMap[p.name] = PROJECT_COLORS[i % PROJECT_COLORS.length];
  });

  const isUserOrDev = role === "USER" || role === "DEVLOPER";

  // For USER/DEVELOPER: only show projects where they are in teamAssigned
  // For SP/AM: show all projects
  const formProjects = isUserOrDev
    ? projects.filter((p) =>
        (p.teamAssigned || []).some((member: any) => String(member.id) === String(userId))
      )
    : projects;

  // SP can only assign to AM users, AM to USER/DEVELOPER
  // USER/DEVELOPER don't need assignee — they self-assign
  const scopedAssignees = (() => {
    if (isUserOrDev) return { assignableUsers: [], noMembersAssigned: false };

    const baseUsers = role === "SP"
      ? users.filter((u) => (u.role || "").toUpperCase() === "AM")
      : users.filter((u) => ["USER", "DEVLOPER"].includes((u.role || "").toUpperCase()));

    if (!form.project) return { assignableUsers: baseUsers, noMembersAssigned: false };

    const selectedProject = projects.find((p) => p.name === form.project);
    if (!selectedProject) return { assignableUsers: baseUsers, noMembersAssigned: false };

    const projectId = String(selectedProject.id);

    const projectMembers = baseUsers.filter((u) => {
      if (!u.projects || !Array.isArray(u.projects)) return false;
      return u.projects.some((p: any) => String(p.id) === projectId);
    });

    return {
      assignableUsers: projectMembers,
      noMembersAssigned: projectMembers.length === 0,
    };
  })();

  /**
   * The person whose tasks are being viewed is always assignable here.
   *
   * The list above is the project's team intersected with the roles this user
   * may assign to. A room member who is not on that project therefore dropped
   * out of it — so the default could not be changed, and if the project had no
   * assignable members at all the whole field was replaced by the "no members"
   * warning and the submit button disabled. Adding them back makes the default
   * a choice again.
   */
  const viewedUser = viewUserId
    ? users.find((u) => String(u.id) === String(viewUserId))
    : undefined;

  const assignableUsers =
    viewedUser &&
    !scopedAssignees.assignableUsers.some(
      (u) => String(u.id) === String(viewedUser.id)
    )
      ? [viewedUser, ...scopedAssignees.assignableUsers]
      : scopedAssignees.assignableUsers;

  // Only warn when there is genuinely nobody to assign to.
  const noMembersAssigned =
    scopedAssignees.noMembersAssigned && assignableUsers.length === 0;

  const loadInitialData = useCallback(async () => {
    try {
      const projRes = await fetchAllExistProjects();
      setProjects(projRes?.data || []);
      if (role === "SP" || role === "AM") {
        const userRes = await fetchAllUsers();
        setUsers(userRes?.data || []);
      }
    } catch {
      /* silent */
    }
  }, [role]);

  // Sync assigneeFilter when viewUserId prop changes
  useEffect(() => {
    if (viewUserId) setAssigneeFilter(viewUserId);
  }, [viewUserId]);

  // Sync projectFilter and viewMode when navigating from Domain Project Gantt
  useEffect(() => {
    if (viewProject) {
      setProjectFilter(viewProject);
      if (viewTab === "gantt") setViewMode("gantt");
      else if (viewTab === "board") setViewMode("board");
    }
  }, [viewProject, viewTab]);

  const isManagerRole = role === "SP" || role === "AM";

  const activeFilters = useCallback((): TaskListFilters => {
    const filters: TaskListFilters = {};
    if (assigneeFilter) filters.assigned_to = assigneeFilter;
    if (projectFilter) filters.project = projectFilter;
    if (statusFilter) filters.status = statusFilter;
    return filters;
  }, [assigneeFilter, projectFilter, statusFilter]);

  /**
   * Drop anything the viewed person is not actually on.
   *
   * `/task-list` returns a task to any **member of its room**, not just to the
   * people working it, and it ignores `assigned_to` for a USER — so opening
   * your own page inside a room came back with every task in that room. This is
   * a guard against that, not the fix: the fix is the API honouring
   * `assigned_to` and dropping the room-wide rule (docs/room-shared-tasks-api.md
   * §3). Until it does, this stops one member's page showing another's work.
   *
   * **It cannot repair pagination.** `totalPages` counts what the server
   * returned, so while the API over-returns a page may render lighter than its
   * count suggests. That is a reason to fix the API, not to widen this.
   *
   * Only applied where the page is about one person; the ordinary dashboard is
   * left to the API's own scoping.
   */
  const scopeToViewedUser = useCallback(
    (rows: taskList[]) =>
      viewUserId ? rows.filter((t) => isOnTask(t, String(viewUserId))) : rows,
    [viewUserId]
  );

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const taskRes = await fetchTask(selectedDate, String(userId), role, activeFilters(), { page, limit: ITEMS_PER_PAGE });
      setTasks(scopeToViewedUser(taskRes?.data || []));
      setTotalPages(taskRes?.totalPages || 1);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, userId, role, activeFilters, page, scopeToViewedUser]);

  /** Board data: same /task-list endpoint, one big page so no column is empty by accident. */
  const loadBoardTasks = useCallback(async () => {
    setBoardLoading(true);
    try {
      const res = await fetchTask(selectedDate, String(userId), role, activeFilters(), { page: 1, limit: BOARD_TASK_LIMIT });
      setBoardTasks(scopeToViewedUser(res?.data || []));
      setBoardHasMore((res?.totalPages || 1) > 1);
    } catch {
      setBoardTasks([]);
      setBoardHasMore(false);
    } finally {
      setBoardLoading(false);
    }
  }, [selectedDate, userId, role, activeFilters, scopeToViewedUser]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Only the visible view fetches — switching to Board issues its own request
  // rather than reusing the List's paginated page. Kept as two effects so a List
  // page change doesn't also re-trigger the Board's fetch.
  useEffect(() => {
    if (viewMode !== "board") loadTasks();
  }, [viewMode, loadTasks]);

  useEffect(() => {
    if (viewMode === "board") loadBoardTasks();
  }, [viewMode, loadBoardTasks]);

  /*
   * The create panel belongs to the List view — it sits in the row beside the
   * table. Board and Gantt raise a task their own way (Board through the Create
   * Task dialog), so leaving the panel open across a switch stranded a
   * half-filled form next to a view that had no part in it.
   */
  useEffect(() => {
    if (viewMode !== "list") setShowCreateForm(false);
  }, [viewMode]);

  /**
   * Whose board is on screen. For SP/AM that is the selected assignee (seeded
   * from the viewUserId prop), otherwise their own board — which the API
   * assumes when this is undefined.
   *
   * Every board-group call has to agree on this value: the lanes are stored per
   * user, so reading one board and writing to another is what made a manager's
   * new group vanish.
   */
  const boardOwnerId = isManagerRole && assigneeFilter ? assigneeFilter : undefined;

  /**
   * Board groups. Loaded alongside the board; a failure leaves the board on its
   * status lanes rather than breaking it, which also covers the API not having
   * the endpoint yet.
   */
  const loadBoardGroups = useCallback(async () => {
    try {
      // SP/AM can look at someone else's board; the API ignores this otherwise.
      const res = await fetchTaskGroups(boardOwnerId);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setBoardGroups(
        rows
          .map((g: Record<string, unknown>) => ({
            id: String(g.id),
            name: String(g.name ?? ""),
            color: String(g.color ?? "#7c3aed"),
            position: typeof g.position === "number" ? g.position : undefined,
            // Sent only if the API has the column; otherwise the board derives
            // the status link from the group's name.
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

  // Board view only, like loadBoardTasks above: the lanes are drawn nowhere
  // else, so a List or Gantt visit pays nothing for them. What was loaded is
  // kept when the view changes — leaving the Board is not a reason to drop the
  // lanes the Status filter is built from — and a board owner change while off
  // the Board is picked up by the fetch that runs on the way back in.
  useEffect(() => {
    if (viewMode === "board") loadBoardGroups();
  }, [viewMode, loadBoardGroups]);

  const handleGroupCreate = async (data: { name: string; color: string }) => {
    try {
      // Same board the groups were read from, so a manager's lane lands on the
      // user's board and comes back in the reload below.
      await createTaskGroup(data, boardOwnerId);
      showSnackbar({ message: `Group "${data.name}" created`, severity: "success" });
      await loadBoardGroups();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to create group"), severity: "error" });
      throw error;
    }
  };

  const handleGroupRename = async (groupId: string, name: string) => {
    // Captured before the reload so the message can name both sides of the change.
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
      // Tasks that were in the group fall back to their status lane.
      await Promise.all([loadBoardGroups(), loadBoardTasks()]);
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to remove group"), severity: "error" });
    }
  };

  const getUserName = (id: string | number | null | undefined) => {
    if (!id) return "Unassigned";
    const u = users.find((u) => String(u.id) === String(id));
    return u?.fullName || "Unknown";
  };


  const filterableUsers = (() => {
    if (role === "SP") return users.filter((u) => (u.role || "").toUpperCase() === "AM");
    if (role === "AM") return users.filter((u) => ["USER", "DEVLOPER"].includes((u.role || "").toUpperCase()));
    return [];
  })();

  // ─── Filter panel ───
  /*
   * `lockedProject` means the project is not the reader's to change — the room
   * tasks page is a view of one workspace, and a workspace owns exactly one
   * project. So it is left out of the tray's values and out of the "Filters
   * (n)" count, which would otherwise show a filter with no way to clear it.
   */
  const taskFilterValues: FilterValues = {
    ...(lockedProject ? {} : { project: projectFilter }),
    ...(viewUserId ? {} : { assignee: assigneeFilter }),
    status: statusFilter,
  };

  /**
   * Scope projects to whoever's tasks are on screen: viewing one person shows
   * only the projects they're assigned to, not every project in the system.
   * An empty scope (SP/AM on "All members") keeps the full list.
   */
  const scopedUserId =
    viewUserId || assigneeFilter || (isUserOrDev ? String(userId) : "");

  const scopedProjects = scopedUserId
    ? projects.filter((p) =>
        (p.teamAssigned || []).some(
          (member: any) => String(member.id) === String(scopedUserId)
        )
      )
    : projects;

  const projectFilterOptions = scopedProjects.map((p) => ({
    value: p.name,
    label: p.name,
  }));

  // An applied project that falls outside the current scope (deep link, or a
  // changed assignee) stays listed so it is still visible and removable.
  if (
    projectFilter &&
    !projectFilterOptions.some((option) => option.value === projectFilter)
  ) {
    projectFilterOptions.unshift({ value: projectFilter, label: projectFilter });
  }

  /**
   * Status options come from the API's task groups, so the filter offers exactly
   * the lanes that exist — including custom ones like "production".
   *
   * The value sent as `status` is the group's own status: the canonical spelling
   * for a workflow group, and the group's name for a custom one, which is what
   * the backend writes onto the task.
   */
  const statusFilterOptions = (() => {
    if (!boardGroups.length) return TASK_STATUS_FILTER_OPTIONS;

    const ranked = [...boardGroups].sort((a, b) => {
      const rank = (g: TaskGroup) => {
        const i = STATUS_LANE_ORDER.indexOf(g.status || groupNameToStatus(g.name) || "");
        return i === -1 ? STATUS_LANE_ORDER.length : i;
      };
      return rank(a) - rank(b) || (a.position ?? 0) - (b.position ?? 0);
    });

    const options = ranked.map((g) => ({
      value: g.status || groupNameToStatus(g.name) || g.name,
      label: g.name.trim(),
    }));

    // Keep the combined shortcut when both halves are on the board.
    const values = new Set(options.map((o) => o.value));
    if (values.has("in_progress") && values.has("yet_to_start")) {
      options.unshift({
        value: "in_progress,yet_to_start",
        label: "Active (In Progress + Yet to Start)",
      });
    }
    return options;
  })();

  /*
   * Project and assignee, minus whichever the page has already settled. On a
   * room member's page both are pinned — the workspace owns one project and the
   * header names one person — so this comes out empty and the category is
   * dropped below rather than rendered as a heading with nothing under it.
   */
  const peopleFields = [
        ...(lockedProject
          ? []
          : [
              {
                key: "project",
                label: "Project",
                placeholder: "All projects",
                emptyText: scopedUserId
                  ? "No projects assigned"
                  : "No projects available",
                icon: <FiLayers size={15} />,
                options: projectFilterOptions,
              },
            ]),
        // Hidden when the page is already one person's — the header says whose
        // tasks these are, so a control that could contradict it does not belong.
        ...(filterableUsers.length > 0 && !viewUserId
          ? [
              {
                key: "assignee",
                label: role === "SP" ? "Assignee" : "Assigned to",
                placeholder: "All members",
                emptyText: "No members available",
                icon: <FiUsers size={15} />,
                options: [
                  ...(role === "AM"
                    ? [{ value: String(userId), label: "My Tasks" }]
                    : []),
                  ...filterableUsers.map((u) => ({
                    value: String(u.id),
                    label: u.fullName || String(u.id),
                  })),
                ],
              },
            ]
          : []),
  ];

  const taskFilterCategories: FilterCategory[] = [
    ...(peopleFields.length
      ? [
          {
            key: "taskFilters",
            label: "Project & People",
            icon: <FiGrid size={16} />,
            caption:
              peopleFields.length === 1 && peopleFields[0].key === "assignee"
                ? "Filter tasks by assignee"
                : filterableUsers.length > 0 && !viewUserId
                  ? "Filter tasks by project and assignee"
                  : "Filter tasks by project",
            fields: peopleFields,
          } as FilterCategory,
        ]
      : []),
    {
      key: "statusFilters",
      label: "Status",
      icon: <FiActivity size={16} />,
      caption: "Filter tasks by status",
      fields: [
        {
          key: "status",
          label: "Status",
          placeholder: "All statuses",
          icon: <FiActivity size={15} />,
          options: statusFilterOptions,
        },
      ],
    },
  ];

  const applyTaskFilters = (values: FilterValues) => {
    /*
     * The pinned project survives an apply. Without this, changing the status
     * filter on a room member's page sent `project` back as "" — the field is
     * not in the tray, so `values` has no key for it — and the page quietly
     * widened to that member's tasks across every project.
     */
    setProjectFilter(lockedProject ?? values.project ?? "");
    /*
     * And the pinned assignee, for the same reason. `viewUserId` is whose page
     * this is — the room member the ring was clicked on — so it is not the
     * reader's to change, and for a USER the field is not in the tray at all.
     * Without this, applying a status filter sent `assigned_to` back as "" and
     * the page widened from "Mayookh's tasks" to everybody's.
     */
    setAssigneeFilter(viewUserId ?? values.assignee ?? "");
    setStatusFilter(values.status ?? "");
    setPage(1);
  };

  const filtered = tasks.filter((t) => {
    if (!search) return true;
    return (t.description || "").toLowerCase().includes(search.toLowerCase());
  });

  /**
   * Open the task a notification pointed at, once the list has loaded it.
   *
   * It cannot be opened on mount: the panel reads the task out of the fetched
   * data, which is not there yet. So this waits for the row to appear and fires
   * once — `opened` keeps a later reload from re-opening a panel the reader has
   * since closed.
   */
  const openedFocus = useRef<string | null>(null);
  useEffect(() => {
    if (!focusTaskId || openedFocus.current === focusTaskId) return;
    const pool = viewMode === "board" ? boardTasks : tasks;
    if (!findTaskById(pool, focusTaskId)) return;
    openedFocus.current = focusTaskId;
    setPanelTaskId(focusTaskId);
  }, [focusTaskId, tasks, boardTasks, viewMode]);

  /** The task the detail panel is showing, taken from the current data. */
  const panelTask = findTaskById(
    viewMode === "board" ? boardTasks : tasks,
    panelTaskId
  );

  const isManagerView = isManagerRole;
  const groupedFiltered = groupTasks(filtered, isManagerView, getUserName);

  // Board rows come from the board's own request, filtered by the same search box.
  const boardFiltered = boardTasks.filter((t) =>
    search ? (t.description || "").toLowerCase().includes(search.toLowerCase()) : true
  );
  const groupedBoard = groupTasks(boardFiltered, isManagerView, getUserName);

  // Columns for the shared TableList component
  const taskColumns: Column<GroupedTask>[] = [
    {
      key: "taskName",
      header: "Task Name",
      width: "22%",
      render: (row) => {
        const priorityColor = PRIORITY_DOT[(row.priority || "Low")] || "#6b7280";
        return (
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: priorityColor,
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              maxWidth: "min(360px, 28vw)",
            }}>
              {row.description}
            </span>
          </div>
        );
      },
    },
    {
      key: "project",
      header: "Project",
      render: (row) => {
        const projName = typeof row.project === "object" && row.project !== null
          ? (row.project as any).name
          : (row.project || "");
        const projColor = projectColorMap[projName] || PROJECT_COLORS[0];
        return (
          <span
            style={{
              backgroundColor: projColor.bg,
              color: projColor.text,
              fontWeight: 600,
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 8,
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {projName}
          </span>
        );
      },
    },
    // Assigned To column — for AM/SP
    ...(isManagerView
      ? [
          {
            key: "assignedTo",
            header: "Assigned To",
            render: (row: GroupedTask) => {
              const assignees = row.assignees || [];
              const total = assignees.length;
              if (total === 0) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>;
              if (total === 1) {
                const a = assignees[0];
                const aIdx = users.findIndex((u) => String(u.id) === String(a.userId));
                const color = avatarColors[Math.max(0, aIdx) % avatarColors.length];
                return (
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: color,
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(a.name)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{a.name}</span>
                  </div>
                );
              }
              // Multiple assignees — stacked avatars
              return (
                <div className="d-flex align-items-center gap-2">
                  <div style={{ display: "flex" }}>
                    {assignees.slice(0, 3).map((a, i) => {
                      const aIdx = users.findIndex((u) => String(u.id) === String(a.userId));
                      const color = avatarColors[Math.max(0, aIdx) % avatarColors.length];
                      return (
                        <div
                          key={i}
                          title={a.name}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            backgroundColor: color,
                            color: "#fff",
                            fontSize: 9,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid var(--bg-card)",
                            marginLeft: i > 0 ? -6 : 0,
                            zIndex: total - i,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(a.name)}
                        </div>
                      );
                    })}
                    {total > 3 && (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          backgroundColor: "var(--border-light)",
                          color: "var(--text-secondary)",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid #fff",
                          marginLeft: -6,
                          flexShrink: 0,
                        }}
                      >
                        +{total - 3}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{total} assigned</span>
                </div>
              );
            },
          } as Column<GroupedTask>,
        ]
      : []),
    {
      key: "startTime",
      header: "Start Time",
      render: (row) => {
        // A task with subtasks starts when its first subtask does.
        const startTime = taskTiming(row).startTime;
        if (!startTime) return <span style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>--</span>;
        const d = new Date(parseServerTime(startTime));
        return (
          <div style={{ whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>
              {d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
            </span>
            <div style={{ fontSize: 10, color: "var(--text-faint)" }}>
              {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        );
      },
    },
    {
      key: "endTime",
      header: "End Time",
      render: (row) => {
        const s = (row.status || "").toLowerCase().replace(/[\s_]+/g, "_");
        const isCompleted = s === "completed" || s === "done";
        // And ends when the last one finishes — not before.
        const timeToShow = taskTiming(row).endTime;
        if (!timeToShow) return <span style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>--</span>;
        const d = new Date(parseServerTime(timeToShow));
        return (
          <div style={{ whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>
              {d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
            </span>
            <div style={{ fontSize: 10, color: isCompleted ? "#16a34a" : "var(--text-faint)" }}>
              {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        );
      },
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (row) => {
        // The deadline, which is `due_date` — not `end_time`, which records when
        // the work actually finished and is overwritten on completion.
        if (!row.due_date) {
          return (
            <span style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>
              --
            </span>
          );
        }
        // Due today or already missed: the badge, blinking, escalated for overdue.
        const due = dueState(row.due_date, row.status);
        if (due) return <DueBadge dueDate={row.due_date} state={due} />;

        const d = toLocalDate(row.due_date);
        if (!d) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>;
        return (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
            }}
          >
            {d.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      key: "totalTime",
      header: "Total Time",
      render: (row) => {
        const t = taskTiming(row);
        return (
          <TaskTimer
            status={t.status}
            startTime={t.runningSince}
            endTime={t.endTime}
            totalSeconds={t.totalSeconds}
          />
        );
      },
    },
    {
      key: "progress",
      header: "Status",
      render: (row) => {
        const assignees = row.assignees || [];
        if (assignees.length > 1) {
          // Multi-assign: show breakdown
          const counts: Record<string, number> = {};
          for (const a of assignees) {
            const badge = getStatusBadge(a.status);
            counts[badge.label] = (counts[badge.label] || 0) + 1;
          }
          return (
            <div className="d-flex flex-wrap gap-1">
              {Object.entries(counts).map(([label, count]) => {
                const badge = label === "DONE"
                  ? { color: "#16a34a", bg: "#dcfce7" }
                  : label === "IN PROGRESS"
                    ? { color: "#2563eb", bg: "#dbeafe" }
                    : label === "YET TO START"
                      ? { color: "#9333ea", bg: "#f5f3ff" }
                      : { color: "#6b7280", bg: "#f3f4f6" };
                return (
                  <span
                    key={label}
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      fontWeight: 600,
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {count} {label === "YET TO START" ? "TODO" : label === "IN PROGRESS" ? "ACTIVE" : label}
                  </span>
                );
              })}
            </div>
          );
        }
        const status = getStatusBadge(row.status || "");
        return (
          <span
            style={{
              backgroundColor: status.bg,
              color: status.color,
              fontWeight: 600,
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 8,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {status.label}
          </span>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (row) => {
        /*
         * A task with subtasks shows two things, because they are two separate
         * things: how far through its children it is, and its own Start.
         *
         * The children no longer move the parent — starting one starts that one
         * — so the owner needs their own control here rather than only inside
         * the panel. The bar still opens the panel, which is where each child's
         * own action lives.
         */
        const finished = ["completed", "done"].includes(normalizeStatus(row.status));

        if ((row.subtask_count ?? row.subtasks?.length ?? 0) > 0) {
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <SubtaskProgress
                dense
                subtasks={row.subtasks}
                done={row.subtask_done_count}
                total={row.subtask_count}
                onOpen={() => setPanelTaskId(String(row.tasks[0]?.id ?? ""))}
              />
              {/* The progress bar already opens the task, so a finished row
                  needs nothing beside it — a second button to the same place,
                  or a badge repeating the Status column. */}
              {!finished && (
                <TaskActionCell
                  dense
                  status={row.status}
                  owns={ownsAllTasks(row)}
                  busy={!!quickBusy[row.key]}
                  // Startable on its own, but not finishable while a piece of it
                  // is outstanding — a task showing DONE beside "1/2" is wrong.
                  onStart={() => void handleQuickStatus(row, "in_progress")}
                  onComplete={() => void handleQuickStatus(row, "completed")}
                />
              )}
            </span>
          );
        }
        // A task on its own keeps the full cycle, ending on the Completed badge.
        return (
          <TaskActionCell
            status={row.status}
            owns={ownsAllTasks(row)}
            busy={!!quickBusy[row.key]}
            onStart={() => void handleQuickStatus(row, "in_progress")}
            onComplete={() => void handleQuickStatus(row, "completed")}
          />
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => {
        const priorityColor = PRIORITY_DOT[(row.priority || "Low")] || "#6b7280";
        return (
          <span style={{ color: priorityColor, fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>
            {row.priority}
          </span>
        );
      },
    },
  ];

  // ─── Board drag & drop ───────────────────────────────────────────
  // A card is only draggable under the same rules the detail modal enforces:
  // you move your own tasks, and you can only have one task in progress.
  const ownsAllTasks = (row: GroupedTask) =>
    row.tasks.every((t) => assigneeIdOf(t) === String(userId));

  const dragBlockedReason = (row: GroupedTask): string | null => {
    if (!ownsAllTasks(row)) return "Only the assignee can move this task";
    return null;
  };

  const handleTaskMove = async (
    row: GroupedTask,
    target: { groupId?: string; statusKey?: string; label: string }
  ) => {
    if (!ownsAllTasks(row)) {
      showSnackbar({ message: "Only the assignee can move this task", severity: "error" });
      throw new Error("not-assignee");
    }

    // Two payload shapes, and that is all:
    //   group lane  → { group_id }            the API derives the status
    //   status lane → { status, group_id: null }
    // The second only comes up if /task-groups gave us nothing and the board fell
    // back to bare status lanes.
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

  /**
   * The `subtasks[]` the API takes, from the drafted rows.
   *
   * `position` is 1-based and always distinct: two children on the same number
   * are peers that do not block each other, which is not what an ordered list
   * on screen promises. An unassigned child sends no `assigned_to` and inherits
   * the parent's owner.
   */
  const toSubtaskPayload = (subtasks: SubtaskDraft[]) =>
    subtasks.map((sub, i) => ({
      name: sub.name,
      ...(sub.assignee ? { assigned_to: sub.assignee } : {}),
      position: i + 1,
      priority: sub.priority,
      start_date: sub.startDate || undefined,
      due_date: sub.dueDate || undefined,
    }));

  /**
   * Create from the Board's modal.
   *
   * **One request, whatever the assignees.** This used to POST once per
   * assignee, which made two independent tasks out of one — wrong now that a
   * task's work is split across its subtasks, since each copy would carry a
   * duplicate set of them. The parent has a single owner; everyone else is on
   * the task through a subtask of their own.
   */
  const handleModalCreate = async (data: CreateTaskFormData) => {
    setSubmitting(true);
    // Every new task starts in Yet to Start — that is where the board's only
    // path begins (yet_to_start → in_progress → completed → a group), so the
    // lane is resolved here rather than offered as a choice.
    const startLane = findGroupForStatus(boardGroups, "yet_to_start");
    try {
      const owner =
        isUserOrDev || !data.assignees.length ? String(userId) : data.assignees[0];

      await addTask({
        description: data.taskName.trim(),
        project: data.project,
        project_id: formProjects.find((p) => p.name === data.project)?.id,
        assigned_to: owner,
        created_by: userId,
        priority: data.priority,
        status: "yet_to_start",
        group_id: startLane?.id,
        // Makes it the room's task: readable by every member, and the roster
        // each subtask's assignee is validated against.
        room_id: roomId,
        // The plan goes in its own fields. It used to ride in `end_time`,
        // which the API overwrites on completion — that destroyed the
        // deadline the moment the task was finished.
        start_date: data.startDate || undefined,
        due_date: data.dueDate || undefined,
        tags: data.tags.length ? data.tags : undefined,
        // Only meaningful with children to order, so it is not sent without them.
        sequential: data.subtasks.length > 1 ? data.sequential : undefined,
        subtasks: data.subtasks.length ? toSubtaskPayload(data.subtasks) : undefined,
      });

      showSnackbar({
        message: `"${data.taskName.trim()}" created`,
        severity: "success",
      });
      setCreateTaskOpen(false);
      await loadBoardTasks();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to create task"), severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Open a child task in the same detail modal the parent uses.
   *
   * The API nests children without their `project` or `dailyLog` objects, but a
   * subtask shares both with its parent — same `project_id`, same `daily_log_id`
   * — so they are merged in, otherwise the modal would show "Unassigned" and no
   * project.
   */
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

  /**
   * Start or complete a task straight from the List table, without opening the
   * detail modal first. Routed through the group that drives the target status,
   * exactly like a board drop.
   */
  const handleQuickStatus = async (row: GroupedTask, next: "in_progress" | "completed") => {
    const ids = row.tasks.map((t) => String(t.id));
    setQuickBusy((b) => ({ ...b, [row.key]: true }));
    try {
      const lane = findGroupForStatus(boardGroups, next);
      await Promise.all(
        ids.map((id) =>
          updateTaskLane(id, lane ? { groupId: lane.id } : { status: next, groupId: null })
        )
      );
      showSnackbar({
        message: next === "in_progress" ? "Task started" : "Task completed",
        severity: "success",
      });
      await (viewMode === "board" ? loadBoardTasks() : loadTasks());
    } catch (error: unknown) {
      showSnackbar({
        message: apiMessage(error, "Failed to update task"),
        severity: isConflict(error) ? "warning" : "error",
      });
      // A refused transition means this view is behind — go and get the truth.
      if (isConflict(error)) {
        await (viewMode === "board" ? loadBoardTasks() : loadTasks());
      }
    } finally {
      setQuickBusy((b) => {
        const nextBusy = { ...b };
        delete nextBusy[row.key];
        return nextBusy;
      });
    }
  };

  /**
   * Start or complete one child task, and nothing else.
   *
   * This used to carry the move up to the parent with a second PATCH: first
   * child to start moved it to In Progress, last to finish completed it. That
   * is gone. A subtask and the task it belongs to are separate units of work
   * with separate clocks — the task is started by whoever owns it, from its own
   * card in the detail panel, and no child's move starts it for them.
   *
   * A `409` is the server refusing an out-of-turn start. Its message names what
   * the subtask is waiting on, so it is shown as-is — and the list is reloaded,
   * because a 409 means somebody else has moved and this view is stale.
   */
  const handleSubtaskStatus = async (
    subtaskId: string | undefined,
    next: "in_progress" | "completed"
  ) => {
    if (!subtaskId) return;
    const key = String(subtaskId);
    // Read before the write, so the response can be compared against it.
    const parentStatusBefore = tasks.find((t) =>
      (t.subtasks ?? []).some((sub) => String(sub.id) === key)
    )?.status;
    setQuickBusy((b) => ({ ...b, [key]: true }));
    try {
      const g = findGroupForStatus(boardGroups, next);
      const res = await updateTaskLane(key, g ? { groupId: g.id } : { status: next, groupId: null });

      /*
       * Nothing here touches the parent.
       *
       * A subtask is its own unit of work with its own clock: starting one
       * starts that one, and the task it belongs to is started by whoever owns
       * it, from its own card. The frontend used to carry the child's move up
       * to the parent with a second PATCH — that is gone, and the API is asked
       * not to do it either (see docs/room-shared-tasks-api.md §4b).
       *
       * The parent still comes back on the response because its children's
       * `is_blocked` flags have to be recomputed after any move; it is read
       * only to report what actually happened, never to assume it.
       */
      /*
       * If the parent's own status moved, the server rolled it up — which it is
       * asked not to do (§4b). Say so rather than reporting it as the expected
       * outcome: a task nobody finished showing as complete is a bug to see,
       * not a success to celebrate.
       */
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
      await (viewMode === "board" ? loadBoardTasks() : loadTasks());
    } catch (error: unknown) {
      showSnackbar({
        message: apiMessage(error, "Failed to update subtask"),
        severity: isConflict(error) ? "warning" : "error",
      });
      // Someone else moved: what is on screen is out of date either way.
      if (isConflict(error)) {
        await (viewMode === "board" ? loadBoardTasks() : loadTasks());
      }
    } finally {
      setQuickBusy((b) => {
        const rest = { ...b };
        delete rest[key];
        return rest;
      });
    }
  };

  // ─── Comments ─────────────────────────────────────────────────────
  //
  // `taskId` is whatever the thread hangs off — the main task or one subtask.
  // There is no read endpoint: comments arrive nested in `/task-list`, so the
  // reload after each write is what refreshes the thread.

  const reloadTasks = () =>
    viewMode === "board" ? loadBoardTasks() : loadTasks();

  const handleCommentAdd = async (taskId: string, body: string) => {
    try {
      await addTaskComment(taskId, body);
      await reloadTasks();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to post comment"), severity: "error" });
    }
  };

  const handleCommentEdit = async (taskId: string, commentId: string, body: string) => {
    try {
      await editTaskComment(taskId, commentId, body);
      await reloadTasks();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to edit comment"), severity: "error" });
    }
  };

  const handleCommentDelete = async (taskId: string, commentId: string) => {
    try {
      await removeTaskComment(taskId, commentId);
      await reloadTasks();
      showSnackbar({ message: "Comment deleted", severity: "success" });
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to delete comment"), severity: "error" });
    }
  };

  /*
   * Same rule as the modal: a task has to outlast its subtasks, so the last day
   * any of them runs to is the floor for its own due date. `YYYY-MM-DD` compares
   * correctly as a string and "" sorts below every real date.
   */
  const panelLastSubtaskDue = form.subtasks.reduce(
    (latest, sub) => (sub.dueDate > latest ? sub.dueDate : latest),
    ""
  );
  const panelDue =
    panelLastSubtaskDue > form.dueDate ? panelLastSubtaskDue : form.dueDate;
  const panelDueMin =
    panelLastSubtaskDue > form.startDate ? panelLastSubtaskDue : form.startDate;

  /**
   * What has to be true before the subtasks step. The same checks guard the
   * submit — this only brings them forward, so a missing project is caught on
   * the step that holds the field rather than two screens later.
   */
  const stepOneError = (): string | null => {
    if (!form.taskName.trim()) return "Task name is required";
    if (!form.project) return "Please select a project";
    if (!isUserOrDev && !assignToSelf && form.assignees.length === 0) {
      return "Please assign at least one person";
    }
    if (form.startDate && panelDue && form.startDate > panelDue) {
      return "Start date must be on or before the due date";
    }
    return null;
  };

  const goToSubtasks = () => {
    const error = stepOneError();
    if (error) {
      showSnackbar({ message: error, severity: "error" });
      return;
    }
    setCreateStep(2);
  };

  const handleCreateTask = async () => {
    if (!form.taskName.trim()) {
      showSnackbar({ message: "Task name is required", severity: "error" });
      return;
    }
    if (!form.project) {
      showSnackbar({ message: "Please select a project", severity: "error" });
      return;
    }
    if (!isUserOrDev && !assignToSelf && form.assignees.length === 0) {
      showSnackbar({ message: "Please assign at least one person", severity: "error" });
      return;
    }
    if (form.startDate && panelDue && form.startDate > panelDue) {
      showSnackbar({
        message: "Start date must be on or before the due date",
        severity: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      // USER/DEVELOPER always self-assign
      const assigneeIds = (isUserOrDev || assignToSelf) ? [String(userId)] : form.assignees;

      /*
       * A room task is created once. Its work is split across its subtasks, so
       * duplicating the parent per assignee would duplicate everyone's subtasks
       * with it — three copies of the same shared task, one per member.
       *
       * Outside a room, assigning the same task to several people still means
       * one independent row each, which is what this panel has always done.
       */
      const owners = roomId ? assigneeIds.slice(0, 1) : assigneeIds;

      const promises = owners.map((assigneeId) => {
        const payload: CreateTaskPayload = {
          description: form.taskName,
          project: form.project,
          project_id: formProjects.find((p) => p.name === form.project)?.id,
          assigned_to: assigneeId,
          created_by: userId,
          priority: form.priority,
          // Plan dates, not the actual-work timestamps — see handleModalCreate.
          start_date: form.startDate || undefined,
          // `panelDue`, not `form.dueDate`: the subtasks may have pushed it out.
          due_date: panelDue || undefined,
          status: "yet_to_start",
          group_id: findGroupForStatus(boardGroups, "yet_to_start")?.id,
          room_id: roomId,
          sequential: form.subtasks.length > 1 ? form.sequential : undefined,
          subtasks: form.subtasks.length ? toSubtaskPayload(form.subtasks) : undefined,
        };
        return addTask(payload);
      });
      await Promise.all(promises);
      const count = owners.length;
      showSnackbar({
        message: assignToSelf
          ? "Task assigned to yourself successfully"
          : count > 1
            ? `Task assigned to ${count} members successfully`
            : "Task created successfully",
        severity: "success",
      });
      setForm({
        taskName: "",
        // Back to the locked project, not blank — the field is disabled, so a
        // blank value here could not be corrected by the user.
        project: lockedProject ?? "",
        assignees: viewUserId ? [viewUserId] : [],
        priority: "HIGH",
        startDate: toDateInput(selectedDate),
        dueDate: "",
        sequential: false,
        subtasks: [],
      });
        setCreateStep(1);
      setWantSubtasks(false);
      setAssignToSelf(false);
      setShowCreateForm(false);
      if (viewMode === "board") await loadBoardTasks();
      else await loadTasks();
    } catch (error: any) {
      console.log(error)
      showSnackbar({
        message: error?.response?.data?.message || "Failed to create task",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Active projects
  const activeProjects = scopedProjects.filter(
    (p) => (p.status || "").toLowerCase().replace(/\s+/g, "_") === "active"
  );

  // Date navigation
  const goToPrevDay = () => {
    setSelectedDate((d) => {
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 1);
      return prev;
    });
    setPage(1);
  };
  const goToNextDay = () => {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
    setPage(1);
  };
  const goToToday = () => {
    setSelectedDate(new Date());
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "clamp(1.15rem, 4vw, 1.65rem)" }}>
            {viewUserId
              ? `${viewUserName || getUserName(viewUserId)}'s Tasks`
              : "My Tasks"}
          </h2>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.95rem)" }}>
            {viewUserId
              ? `Viewing tasks assigned to ${
                  viewUserName || getUserName(viewUserId)
                }`
              : "Manage and track your daily activities"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-shrink-0">
          {/* Project + Assignee filters */}
          <FilterTrigger
            count={countActiveFilters(taskFilterValues)}
            onClick={() => setFilterOpen(true)}
          />

          {/* Create Task Button — only in All Tasks view, hidden when form is open */}
          {viewMode !== "gantt" && !showCreateForm && (
            <button
              className="btn text-white d-flex align-items-center justify-content-center gap-1 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 18px",
                whiteSpace: "nowrap",
              }}
              onClick={() =>
                viewMode === "board" ? setCreateTaskOpen(true) : openCreateForm()
              }
            >
              {isCompact ? "+ Task" : "+ Create Task"}
            </button>
          )}
        </div>
      </div>

      {/* View Tabs + Date Picker + Active Projects, all on one row */}
      <div className="rounded-2xl shadow-sm px-3 sm:px-5 py-3 mb-4 sm:mb-5 flex flex-row justify-between items-center gap-2 sm:gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              gap: 2,
              padding: 4,
              borderRadius: 14,
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-hover)",
              flexShrink: 0,
            }}
          >
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = viewMode === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key)}
                  whileTap={{ scale: 0.94 }}
                  transition={TAB_SPRING}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: isCompact ? 4 : 6,
                    backgroundColor: "transparent",
                    color: active ? "#fff" : "var(--text-muted)",
                    borderRadius: 10,
                    fontSize: isCompact ? 11 : 12.5,
                    fontWeight: 600,
                    padding: isCompact ? "6px 9px" : "7px 14px",
                    whiteSpace: "nowrap",
                    border: "none",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    transition: "color 0.2s",
                  }}
                >
                  {/* The pill itself is one element shared across tabs, so framer
                      slides it from the old tab to the new one on click. */}
                  {active && (
                    <motion.span
                      layoutId="viewTabPill"
                      transition={TAB_SPRING}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                        boxShadow: "0 2px 10px rgba(124, 58, 237, 0.35)",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <motion.span
                    animate={{ scale: active ? 1.12 : 1 }}
                    transition={TAB_SPRING}
                    style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
                  >
                    {Icon && <Icon sx={{ fontSize: isCompact ? 12 : 14 }} />}
                  </motion.span>
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {isCompact ? tab.shortLabel : tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Date Navigator — hidden when Gantt view is active */}
          {viewMode !== "gantt" && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={goToPrevDay}
                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition flex-shrink-0"
                style={{ border: "1px solid var(--border-light)", borderRadius: 8, backgroundColor: "var(--bg-card)" }}
              >
                <KeyboardArrowLeftIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
              </button>
              <button
                className="flex items-center gap-1 sm:gap-1.5 text-white"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                  borderRadius: isCompact ? 8 : 12,
                  fontSize: isCompact ? 10 : 12,
                  fontWeight: 600,
                  padding: isCompact ? "5px 8px" : "7px 10px",
                  whiteSpace: "nowrap",
                }}
                onClick={goToToday}
              >
                <CalendarMonthIcon sx={{ fontSize: isCompact ? 12 : 14 }} />
                {formatDateLabel(selectedDate)}
              </button>
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                <input
                  type="date"
                  value={toDateInput(selectedDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value + "T00:00:00"));
                      setPage(1);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ zIndex: 2 }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center transition"
                  style={{ border: "1px solid var(--border-light)", borderRadius: 8, zIndex: 1 }}
                >
                  <CalendarMonthIcon sx={{ fontSize: 14, color: "var(--text-muted)" }} />
                </div>
              </div>
              <button
                onClick={goToNextDay}
                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition flex-shrink-0"
                style={{ border: "1px solid var(--border-light)", borderRadius: 8, backgroundColor: "var(--bg-card)" }}
              >
                <KeyboardArrowRightIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
              </button>
            </div>
          )}
        </div>

        {/*
            The legend shares the controls' row and takes whatever width they
            leave, scrolling inside it.

            It used to be `flex-shrink-0`, which made it hold its full content
            width and run past the end of the card — and because the card clips
            its overflow, the last project came out sliced through the middle of
            its name with nothing to say there were more. `min-w-0` is the fix:
            a flex item will not shrink below its content without it, so
            `overflow-x-auto` on its own did nothing.
        */}
        {activeProjects.length > 0 && !isCompact && (
          <div className="flex items-center gap-3 text-xs min-w-0 flex-1 justify-end">
            <span className="font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: "var(--text-faint)" }}>Projects:</span>
            <div className="myt__legend flex items-center gap-4 flex-nowrap min-w-0 overflow-x-auto">
              {activeProjects.map((p, i) => {
                const color = PROJECT_COLORS[i % PROJECT_COLORS.length].dot;
                return (
                  <div key={p.id} className="flex items-center gap-1.5 flex-shrink-0" title={p.name}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-medium whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Gantt Chart View */}
      {viewMode === "gantt" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <TaskGanttChart
            tasks={tasks}
            users={users}
            projects={projectFilter ? projects.filter(p => p.name === projectFilter) : projects}
            projectColorMap={projectColorMap}
            getUserName={getUserName}
            loading={loading}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        </motion.div>
      ) : (
      /* Task Table + Create Form */
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
        {/* Create Task Form Panel */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 overflow-hidden w-full lg:w-[380px]"
            >
              <div className="rounded-2xl shadow-sm p-4 sm:p-5 h-full" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold" style={{ fontSize: 18, color: "var(--text-primary)" }}>
                      Create New Task
                    </h3>
                    <p className="mt-1" style={{ fontSize: 12, color: "var(--text-faint)" }}>
                      {createStep === 1
                        ? "Fill in the details to add a new task."
                        : "Break the task down — as many subtasks as it needs."}
                    </p>
                  </div>
                  <IconButton size="small" onClick={() => setShowCreateForm(false)}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </div>

                {createStep === 1 && (
                  <>
                {/* Task Name */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Task Name
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Update Patient Portal UI"
                    value={form.taskName}
                    onChange={(e) => setForm((f) => ({ ...f, taskName: e.target.value }))}
                    sx={selectSx}
                  />
                </div>

                {/* Project Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Project Selection
                  </label>
                  <FormControl
                    fullWidth
                    size="small"
                    sx={lockedProject ? fixedSelectSx : selectSx}
                  >
                    <Select
                      disabled={!!lockedProject}
                      value={form.project}
                      onChange={(e) => setForm((f) => ({ ...f, project: e.target.value, assignees: [] }))}
                      displayEmpty
                      renderValue={(val) =>
                        val
                          ? formProjects.find((p) => String(p.name) === val)?.name || val
                          : <span style={{ color: "#9ca3af" }}>Select a project</span>
                      }
                      MenuProps={menuProps}
                    >
                      {(lockedProject
                        ? formProjects.filter((p) => p.name === lockedProject)
                        : formProjects
                      ).map((p) => (
                        <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                      ))}
                      {/* Keeps the value renderable if the list has not arrived. */}
                      {lockedProject &&
                        !formProjects.some((p) => p.name === lockedProject) && (
                          <MenuItem value={lockedProject}>{lockedProject}</MenuItem>
                        )}
                    </Select>
                  </FormControl>
                </div>

                {/* Assignee — hidden for USER/DEVELOPER (they self-assign automatically) */}
                {!isUserOrDev && (
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-sm font-semibold" style={{ lineHeight: 1, color: "var(--text-secondary)" }}>
                      Assignee
                    </span>
                    {/*
                     * Not offered while viewing someone else's tasks: the task
                     * is for them, so assigning it to yourself here would
                     * contradict the page. Hiding the box also hides the
                     * "assigned to you" card, which only appears when it is on.
                     */}
                    {role === "AM" && !viewUserId && (
                      <div
                        className="d-flex align-items-center gap-2 cursor-pointer"
                        onClick={() => {
                          const next = !assignToSelf;
                          setAssignToSelf(next);
                          if (next) setForm((f) => ({ ...f, assignees: [] }));
                        }}
                        style={{ lineHeight: 1 }}
                      >
                        <input
                          type="checkbox"
                          checked={assignToSelf}
                          readOnly
                          style={{ accentColor: "#7c3aed", width: 15, height: 15, margin: 0, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>
                          Assign to myself
                        </span>
                      </div>
                    )}
                  </div>

                  {assignToSelf ? (
                    <div
                      className="flex items-center gap-3 p-3"
                      style={{
                        backgroundColor: "#f5f3ff",
                        border: "1px solid #e0d6ff",
                        borderRadius: 12,
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full text-white flex-shrink-0"
                        style={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, backgroundColor: "#7c3aed" }}
                      >
                        {getInitials(user?.fullName || "Me")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ margin: 0, color: "var(--text-primary)" }}>
                          {user?.fullName || "Me"}
                        </p>
                        <p className="text-xs" style={{ margin: 0, color: "var(--text-muted)" }}>
                          This task will be assigned to you
                        </p>
                      </div>
                    </div>
                  ) : noMembersAssigned ? (
                    <div
                      className="flex items-start gap-3 p-3"
                      style={{
                        backgroundColor: "#fef3c7",
                        border: "1px solid #fcd34d",
                        borderRadius: 12,
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1.2 }}>&#9888;</span>
                      <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                          No members assigned to this project
                        </p>
                        <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                          Please assign members to this project first before creating a task.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(`/${(role || "").toLowerCase()}/domain-project`)}
                          className="text-xs font-semibold"
                          style={{
                            color: "#7c3aed",
                            textDecoration: "underline",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Go to Departments & Projects &rarr;
                        </button>
                      </div>
                    </div>
                  ) : (
                    <FormControl fullWidth size="small" sx={selectSx}>
                      <Select
                        multiple
                        value={form.assignees}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((f) => ({
                            ...f,
                            assignees: typeof val === "string" ? val.split(",") : val,
                          }));
                        }}
                        displayEmpty
                        renderValue={(selected) =>
                          selected.length === 0
                            ? <span style={{ color: "#9ca3af" }}>Search team members...</span>
                            : <span style={{ fontSize: 13 }}>{selected.length} member{selected.length > 1 ? "s" : ""} selected</span>
                        }
                        MenuProps={menuProps}
                      >
                        {assignableUsers.map((u, i) => {
                          const isSelected = form.assignees.includes(String(u.id));
                          return (
                            <MenuItem key={u.id} value={String(u.id)}>
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  style={{ accentColor: "#7c3aed", width: 14, height: 14 }}
                                />
                                <div
                                  className="flex items-center justify-center rounded-full text-white"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    backgroundColor: avatarColors[i % avatarColors.length],
                                  }}
                                >
                                  {getInitials(u.fullName)}
                                </div>
                                <span style={{ fontSize: 13 }}>{u.fullName}</span>
                              </div>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  )}
                  {/* Selected assignee chips */}
                  {form.assignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.assignees.map((id) => {
                        const name = getUserName(id);
                        const idx = users.findIndex((u) => String(u.id) === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-1.5 px-2 py-1"
                            style={{ backgroundColor: "var(--bg-hover)", borderRadius: 12 }}
                          >
                            <div
                              className="flex items-center justify-center rounded-full text-white"
                              style={{
                                width: 20,
                                height: 20,
                                fontSize: 8,
                                fontWeight: 700,
                                backgroundColor: avatarColors[Math.max(0, idx) % avatarColors.length],
                              }}
                            >
                              {getInitials(name)}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 500 }}>{name}</span>
                            <button
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  assignees: f.assignees.filter((a) => a !== id),
                                }))
                              }
                              className="ml-0.5"
                              style={{ color: "var(--text-faint)", fontSize: 13, lineHeight: 1, fontWeight: 700 }}
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )}

                {/* Priority Level */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Priority Level
                  </label>
                  <div className="flex gap-2">
                    {[
                      { key: "HIGH", label: "HIGH", icon: "!", color: "#dc2626", bg: "#fef2f2" },
                      { key: "MEDIUM", label: "MEDIUM", icon: "=", color: "#d97706", bg: "#fffbeb" },
                      { key: "LOW", label: "LOW", icon: "\u26A1", color: "#7c3aed", bg: "#f5f3ff" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
                        className="flex-1 flex flex-col items-center gap-1 py-3 border-2 transition-all"
                        style={{
                          borderRadius: 12,
                          borderColor: form.priority === p.key ? p.color : "var(--border-light)",
                          backgroundColor: form.priority === p.key ? p.bg : "var(--bg-card)",
                        }}
                      >
                        <span style={{ fontSize: 18, color: p.color, fontWeight: 700 }}>
                          {p.icon}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: p.color }}>
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Date + Due Date */}
                <div className="mb-5 flex gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Start Date
                    </label>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      sx={selectSx}
                      slotProps={{
                        inputLabel: { shrink: true },
                        // Can't plan a start after the due date.
                        htmlInput: panelDue ? { max: panelDue } : undefined,
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Due Date
                    </label>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={panelDue}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                      sx={selectSx}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: panelDueMin ? { min: panelDueMin } : undefined,
                      }}
                    />
                    {/* Said out loud, because the field moved on its own. */}
                    {panelLastSubtaskDue > form.dueDate && (
                      <p className="ctm__hint">Set by the longest subtask.</p>
                    )}
                  </div>
                </div>
                  </>
                )}

                {/* Step two: subtasks, the same rows as the board's Create Task
                    dialog, reflowed for this 380px column. */}
                {createStep === 2 && (
                  <div className="mb-4">
                    <SubtaskEditor
                      compact
                      subtasks={form.subtasks}
                      onChange={(next) => setForm((f) => ({ ...f, subtasks: next }))}
                      sequential={form.sequential}
                      onSequentialChange={(next) =>
                        setForm((f) => ({ ...f, sequential: next }))
                      }
                      roomMembers={roomMembers}
                      defaultStartDate={form.startDate}
                      defaultDueDate={panelDue}
                    />
                  </div>
                )}

                {/*
                  * The one thing that decides whether there is a second step at
                  * all. Off — the default — the button below creates the task,
                  * exactly as this panel always worked.
                  */}
                {createStep === 1 && (
                  <div
                    className="d-flex align-items-center gap-2 cursor-pointer mb-3"
                    onClick={() => {
                      const next = !wantSubtasks;
                      setWantSubtasks(next);
                      // Turning it back off drops the drafted rows rather than
                      // saving subtasks the panel no longer shows.
                      if (!next) {
                        setForm((f) => ({ ...f, subtasks: [] }));
                                          }
                    }}
                    style={{ lineHeight: 1 }}
                  >
                    <input
                      type="checkbox"
                      checked={wantSubtasks}
                      readOnly
                      style={{ accentColor: "#7c3aed", width: 15, height: 15, margin: 0, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>
                      Break this into subtasks
                    </span>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  <button
                    className="flex-1 btn font-semibold"
                    style={{ border: "1px solid var(--border-light)", color: "var(--text-secondary)", borderRadius: 12, fontSize: 13, padding: "10px 0" }}
                    onClick={() =>
                      createStep === 1 ? setShowCreateForm(false) : setCreateStep(1)
                    }
                  >
                    {createStep === 1 ? "Cancel" : "Back"}
                  </button>
                  <button
                    className="flex-1 btn text-white font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                      borderRadius: 12,
                      fontSize: 13,
                      padding: "10px 0",
                      opacity: submitting || (!assignToSelf && noMembersAssigned) ? 0.7 : 1,
                    }}
                    onClick={
                      createStep === 1 && wantSubtasks ? goToSubtasks : handleCreateTask
                    }
                    disabled={submitting || (!assignToSelf && noMembersAssigned)}
                  >
                    {submitting ? (
                      <CircularProgress size={16} sx={{ color: "#fff" }} />
                    ) : createStep === 1 && wantSubtasks ? (
                      "Next"
                    ) : (
                      "Create Task"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task List / Board — both render the same grouped, paginated task set */}
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
                tasks={groupedBoard}
                projectColorMap={projectColorMap}
                loading={boardLoading}
                isCompact={isCompact}
                emptyMessage={`No tasks found for ${formatDateLabel(selectedDate)}`}
                onTaskClick={(row) => setSelectedTask(row.tasks[0])}
                onSubtaskClick={openSubtask}
                onTaskMove={handleTaskMove}
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
              data={groupedFiltered}
              pagination={{ currentPage: page, totalPages, onPageChange: (p) => setPage(p) }}
              emptyMessage={`No tasks found for ${formatDateLabel(selectedDate)}`}
            />
          )}
          </motion.div>
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onStatusUpdate={viewMode === "board" ? loadBoardTasks : loadTasks}
        canStartTask={
          // A subtask opened from a board card carries its own assignee, which
          // on a shared task is not the person who owns the parent.
          selectedTask ? assigneeIdOf(selectedTask) === String(userId) : false
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
        // Each subtask now has an owner of its own, so the panel decides row by
        // row who may act rather than applying the parent's answer to all of them.
        currentUserId={userId}
        busy={quickBusy}
        onStart={(id) => void handleSubtaskStatus(id, "in_progress")}
        onComplete={(id) => void handleSubtaskStatus(id, "completed")}
        onCommentAdd={handleCommentAdd}
        onCommentEdit={handleCommentEdit}
        onCommentDelete={handleCommentDelete}
        projectColorMap={projectColorMap}
      />

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projects={formProjects}
        assignableUsers={assignableUsers}
        defaultStartDate={toDateInput(selectedDate)}
        startLane={findGroupForStatus(boardGroups, "yet_to_start")}
        fixedProject={lockedProject}
        defaultAssignee={
          viewUserId ? { id: viewUserId, name: getUserName(viewUserId) } : undefined
        }
        isUserOrDev={isUserOrDev}
        currentUserName={user?.fullName}
        roomMembers={roomMembers}
        submitting={submitting}
        onSubmit={handleModalCreate}
      />

      {/* Filter Tasks panel */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Tasks"
        categories={taskFilterCategories}
        values={taskFilterValues}
        onApply={applyTaskFilters}
      />
    </div>
  );
}
