import { useCallback, useEffect, useState } from "react";
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
  createTaskGroup,
  deleteTaskGroup,
  fetchTask,
  fetchTaskGroups,
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
import TaskActionCell from "./TaskActionCell";
import TaskDetailPanel from "./TaskDetailPanel";
import SubtaskProgress from "./SubtaskProgress";
import CreateTaskModal, { type CreateTaskFormData } from "./CreateTaskModal";
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

/**
 * A select that shows its value but cannot be changed. MUI's disabled styling
 * dims the text to near-unreadable, so the colour is restored: the point is
 * "this is fixed", not "this is unavailable".
 */
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

/** Statuses arrive in a few spellings; compare them in one normalised form. */
const normalizeStatus = (value?: string | null) =>
  (value || "").toLowerCase().replace(/[\s-]+/g, "_");

/** Pull the API's error message off an axios failure, falling back to `fallback`. */
const apiMessage = (error: unknown, fallback: string): string => {
  const res = (error as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message || fallback;
};

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
      status: t.status,
      tasks: [t],
      assignees: [{
        name: t.dailyLog?.assignedUser?.fullName || getUserName(t.assigned_to),
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
      name: t.dailyLog?.assignedUser?.fullName || getUserName(t.assigned_to),
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
    startDate: "",
    dueDate: "",
  });

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
      ...(lockedProject ? { project: lockedProject } : {}),
      ...(viewUserId && !f.assignees.length ? { assignees: [viewUserId] } : {}),
    }));
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

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const taskRes = await fetchTask(selectedDate, String(userId), role, activeFilters(), { page, limit: ITEMS_PER_PAGE });
      setTasks(taskRes?.data || []);
      setTotalPages(taskRes?.totalPages || 1);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, userId, role, activeFilters, page]);

  /** Board data: same /task-list endpoint, one big page so no column is empty by accident. */
  const loadBoardTasks = useCallback(async () => {
    setBoardLoading(true);
    try {
      const res = await fetchTask(selectedDate, String(userId), role, activeFilters(), { page: 1, limit: BOARD_TASK_LIMIT });
      setBoardTasks(res?.data || []);
      setBoardHasMore((res?.totalPages || 1) > 1);
    } catch {
      setBoardTasks([]);
      setBoardHasMore(false);
    } finally {
      setBoardLoading(false);
    }
  }, [selectedDate, userId, role, activeFilters]);

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

  /**
   * Board groups. Loaded alongside the board; a failure leaves the board on its
   * status lanes rather than breaking it, which also covers the API not having
   * the endpoint yet.
   */
  const loadBoardGroups = useCallback(async () => {
    try {
      // SP/AM can look at someone else's board; the API ignores this otherwise.
      const res = await fetchTaskGroups(
        isManagerRole && assigneeFilter ? assigneeFilter : undefined
      );
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
  }, [isManagerRole, assigneeFilter]);

  // Loaded for every view, not just the Board: the Status filter is built from
  // these groups and the filter panel is available in List view too.
  useEffect(() => {
    loadBoardGroups();
  }, [loadBoardGroups]);

  const handleGroupCreate = async (data: { name: string; color: string }) => {
    try {
      await createTaskGroup(data);
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
    assignee: assigneeFilter,
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

  const taskFilterCategories: FilterCategory[] = [
    {
      key: "taskFilters",
      label: "Project & People",
      icon: <FiGrid size={16} />,
      caption: lockedProject
        ? `Filter ${lockedProject} tasks by assignee`
        : filterableUsers.length > 0
          ? "Filter tasks by project and assignee"
          : "Filter tasks by project",
      fields: [
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
        ...(filterableUsers.length > 0
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
      ],
    },
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
    setAssigneeFilter(values.assignee ?? "");
    setStatusFilter(values.status ?? "");
    setPage(1);
  };

  const filtered = tasks.filter((t) => {
    if (!search) return true;
    return (t.description || "").toLowerCase().includes(search.toLowerCase());
  });

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
        // A task with subtasks has no Start of its own — its state follows its
        // children. The bar shows how far along it is and opens the panel, which
        // is where the children get started.
        if ((row.subtasks?.length ?? 0) > 0) {
          return (
            <SubtaskProgress
              subtasks={row.subtasks}
              onOpen={() => setPanelTaskId(String(row.tasks[0]?.id ?? ""))}
            />
          );
        }
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
    row.tasks.every(
      (t) =>
        String(t.dailyLog?.assignedUser?.id || t.assigned_to || "") === String(userId)
    );

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
   * Create from the Board's modal. Dates and times are combined into the single
   * timestamps the API takes; the lane comes through as `group_id` so the card
   * appears where it was asked for.
   */
  const handleModalCreate = async (data: CreateTaskFormData) => {
    setSubmitting(true);
    // Every new task starts in Yet to Start — that is where the board's only
    // path begins (yet_to_start → in_progress → completed → a group), so the
    // lane is resolved here rather than offered as a choice.
    const startLane = findGroupForStatus(boardGroups, "yet_to_start");
    try {
      const assigneeIds =
        isUserOrDev || !data.assignees.length ? [String(userId)] : data.assignees;

      await Promise.all(
        assigneeIds.map((assigneeId) =>
          addTask({
            description: data.taskName.trim(),
            project: data.project,
            project_id: formProjects.find((p) => p.name === data.project)?.id,
            assigned_to: assigneeId,
            created_by: userId,
            priority: data.priority,
            status: "yet_to_start",
            group_id: startLane?.id,
            // The plan goes in its own fields. It used to ride in `end_time`,
            // which the API overwrites on completion — that destroyed the
            // deadline the moment the task was finished.
            start_date: data.startDate || undefined,
            due_date: data.dueDate || undefined,
            // Not stored yet — see docs/create-task-fields.md.
            tags: data.tags.length ? data.tags : undefined,
            subtasks: data.subtasks.length
              ? data.subtasks.map((sub) => ({
                  name: sub.name,
                  priority: sub.priority,
                  start_date: sub.startDate || undefined,
                  due_date: sub.dueDate || undefined,
                }))
              : undefined,
          })
        )
      );

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
      showSnackbar({ message: apiMessage(error, "Failed to update task"), severity: "error" });
    } finally {
      setQuickBusy((b) => {
        const nextBusy = { ...b };
        delete nextBusy[row.key];
        return nextBusy;
      });
    }
  };

  /**
   * Start or complete one child task, and carry the consequence up to its parent.
   *
   * A parent with subtasks has no Start action of its own, so its state has to
   * follow theirs: the first child to start moves it to In Progress, and the last
   * child to finish completes it.
   */
  const handleSubtaskStatus = async (
    parent: taskList | null,
    subtaskId: string | undefined,
    next: "in_progress" | "completed"
  ) => {
    if (!subtaskId) return;
    const key = String(subtaskId);
    setQuickBusy((b) => ({ ...b, [key]: true }));
    try {
      const lane = (status: "in_progress" | "completed") => {
        const g = findGroupForStatus(boardGroups, status);
        return g ? { groupId: g.id } : { status, groupId: null };
      };

      await updateTaskLane(key, lane(next));

      // Roll the parent forward, if this move settles it.
      let rolled: "in_progress" | "completed" | null = null;
      const siblings = parent?.subtasks ?? [];
      if (parent && siblings.length) {
        const parentStatus = normalizeStatus(parent.status);
        if (next === "completed") {
          const allDone = siblings.every(
            (sib) =>
              String(sib.id) === key || normalizeStatus(sib.status) === "completed"
          );
          if (allDone && parentStatus !== "completed") rolled = "completed";
        } else if (parentStatus === "yet_to_start" || parentStatus === "pending") {
          rolled = "in_progress";
        }
      }
      if (rolled && parent) await updateTaskLane(String(parent.id), lane(rolled));

      showSnackbar({
        message:
          rolled === "completed"
            ? "All subtasks done — task completed"
            : next === "in_progress"
              ? "Subtask started"
              : "Subtask completed",
        severity: "success",
      });
      await (viewMode === "board" ? loadBoardTasks() : loadTasks());
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to update subtask"), severity: "error" });
    } finally {
      setQuickBusy((b) => {
        const rest = { ...b };
        delete rest[key];
        return rest;
      });
    }
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
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) {
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

      const promises = assigneeIds.map((assigneeId) => {
        const payload: CreateTaskPayload = {
          description: form.taskName,
          project: form.project,
          project_id: formProjects.find((p) => p.name === form.project)?.id,
          assigned_to: assigneeId,
          created_by: userId,
          priority: form.priority,
          // Plan dates, not the actual-work timestamps — see handleModalCreate.
          start_date: form.startDate || undefined,
          due_date: form.dueDate || undefined,
          status: "yet_to_start",
          group_id: findGroupForStatus(boardGroups, "yet_to_start")?.id,
        };
        return addTask(payload);
      });
      await Promise.all(promises);
      const count = assigneeIds.length;
      showSnackbar({
        message: assignToSelf
          ? "Task assigned to yourself successfully"
          : `Task assigned to ${count} member${count > 1 ? "s" : ""} successfully`,
        severity: "success",
      });
      setForm({
        taskName: "",
        // Back to the locked project, not blank — the field is disabled, so a
        // blank value here could not be corrected by the user.
        project: lockedProject ?? "",
        assignees: viewUserId ? [viewUserId] : [],
        priority: "HIGH",
        startDate: "",
        dueDate: "",
      });
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

      {/* View Tabs + Date Picker + Active Projects Row */}
      <div className="rounded-2xl shadow-sm px-3 sm:px-5 py-3 mb-4 sm:mb-5 flex flex-row justify-between items-center gap-2 sm:gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", overflow: "hidden" }}>
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
                  value={selectedDate.toISOString().split("T")[0]}
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

        {activeProjects.length > 0 && !isCompact && (
          <div className="flex items-center gap-4 text-xs overflow-x-auto flex-shrink-0">
            <span className="font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: "var(--text-faint)" }}>Projects:</span>
            {activeProjects.map((p, i) => {
              const color = PROJECT_COLORS[i % PROJECT_COLORS.length].dot;
              return (
                <div key={p.id} className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                </div>
              );
            })}
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
                      Fill in the details to add a new task to your workspace.
                    </p>
                  </div>
                  <IconButton size="small" onClick={() => setShowCreateForm(false)}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </div>

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
                        htmlInput: form.dueDate ? { max: form.dueDate } : undefined,
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
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                      sx={selectSx}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: form.startDate ? { min: form.startDate } : undefined,
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    className="flex-1 btn font-semibold"
                    style={{ border: "1px solid var(--border-light)", color: "var(--text-secondary)", borderRadius: 12, fontSize: 13, padding: "10px 0" }}
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
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
                    onClick={handleCreateTask}
                    disabled={submitting || (!assignToSelf && noMembersAssigned)}
                  >
                    {submitting ? (
                      <CircularProgress size={16} sx={{ color: "#fff" }} />
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
          selectedTask
            ? String(selectedTask.dailyLog?.assignedUser?.id || selectedTask.assigned_to || "") === String(userId)
            : false
        }
        projectColorMap={projectColorMap}
        groups={boardGroups}
        showSnackbar={showSnackbar}
      />

      <TaskDetailPanel
        task={panelTask}
        open={panelTaskId !== null}
        onClose={() => setPanelTaskId(null)}
        owns={
          panelTask
            ? String(
                panelTask.dailyLog?.assignedUser?.id || panelTask.assigned_to || ""
              ) === String(userId)
            : false
        }
        busy={quickBusy}
        onStart={(id) => void handleSubtaskStatus(panelTask, id, "in_progress")}
        onComplete={(id) => void handleSubtaskStatus(panelTask, id, "completed")}
        projectColorMap={projectColorMap}
      />

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projects={formProjects}
        assignableUsers={assignableUsers}
        startLane={findGroupForStatus(boardGroups, "yet_to_start")}
        fixedProject={lockedProject}
        defaultAssignee={
          viewUserId ? { id: viewUserId, name: getUserName(viewUserId) } : undefined
        }
        isUserOrDev={isUserOrDev}
        currentUserName={user?.fullName}
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
