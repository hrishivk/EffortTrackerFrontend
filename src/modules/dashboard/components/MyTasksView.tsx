import { useCallback, useEffect, useState } from "react";
import {
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../store/configureStore";
import { addTask, fetchTask } from "../../../core/actions/action";
import {
  fetchAllExistProjects,
  fetchAllUsers,
} from "../../../core/actions/spAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import TableList from "../../../shared/components/Table/Table";
import type { Column } from "../../../shared/components/Table/types";
import type { formUserData } from "../../../shared/types/User";
import type { taskList } from "../../user/types";
import TaskGanttChart from "./TaskGanttChart";
import TaskDetailModal from "./TaskDetailModal";

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

const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

const ITEMS_PER_PAGE = 5;

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
    return { label: "YET TO START", color: "#9333ea", bg: "#f5f3ff", pct: 0 };
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
  viewProject?: string;
  viewTab?: string;
}

export default function MyTasksView({ viewUserId, viewProject, viewTab }: MyTasksViewProps) {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const userId = user?.id;

  const [tasks, setTasks] = useState<taskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<formUserData[]>([]);
  const [search, _setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(viewProject || "");
  // Default: AM sees their own tasks, SP sees all
  const [assigneeFilter, setAssigneeFilter] = useState(
    viewUserId || (role === "AM" ? String(userId) : "")
  );
  const [viewMode, setViewMode] = useState<"all" | "gantt">(
    viewTab === "gantt" ? "gantt" : "all"
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assignToSelf, setAssignToSelf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<taskList | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    taskName: "",
    project: "",
    assignees: [] as string[],
    priority: "HIGH",
    dueDate: "",
  });

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
  const { assignableUsers, noMembersAssigned } = (() => {
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
    }
  }, [viewProject, viewTab]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { assigned_to?: string; project?: string } = {};
      if (assigneeFilter) filters.assigned_to = assigneeFilter;
      if (projectFilter) filters.project = projectFilter;

      const taskRes = await fetchTask(selectedDate, String(userId), role, filters, { page, limit: ITEMS_PER_PAGE });
      setTasks(taskRes?.data || []);
      setTotalPages(taskRes?.totalPages || 1);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, userId, role, assigneeFilter, projectFilter, page]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  const filtered = tasks.filter((t) => {
    if (!search) return true;
    return (t.description || "").toLowerCase().includes(search.toLowerCase());
  });

  // ─── Group tasks by description+project for AM/SP table view ───
  type GroupedTask = {
    key: string;
    description: string;
    project: string | { id: string; name: string };
    priority: string;
    start_time?: string | null;
    end_time?: string | null;
    status?: string;
    tasks: taskList[];
    assignees: { name: string; status: string; userId: string | number | null | undefined }[];
  };

  const isManagerView = role === "SP" || role === "AM";

  const groupedFiltered: GroupedTask[] = (() => {
    if (!isManagerView) {
      // USER/DEVLOPER: no grouping, wrap each task
      return filtered.map((t) => ({
        key: String(t.id),
        description: t.description,
        project: t.project,
        priority: t.priority,
        start_time: t.start_time,
        end_time: t.end_time,
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
    for (const t of filtered) {
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
    for (const [key, groupTasks] of map) {
      const first = groupTasks[0];
      const assignees = groupTasks.map((t) => ({
        name: t.dailyLog?.assignedUser?.fullName || getUserName(t.assigned_to),
        status: t.status || "",
        userId: t.assigned_to,
      }));
      // Pick earliest start, latest end
      let start: string | null = null;
      let end: string | null = null;
      for (const t of groupTasks) {
        if (t.start_time && (!start || t.start_time < start)) start = t.start_time;
        if (t.end_time && (!end || t.end_time > end)) end = t.end_time;
      }
      rows.push({
        key,
        description: first.description,
        project: first.project,
        priority: first.priority,
        start_time: start,
        end_time: end,
        status: first.status,
        tasks: groupTasks,
        assignees,
      });
    }
    return rows;
  })();

  // Columns for the shared TableList component
  const taskColumns: Column<GroupedTask>[] = [
    {
      key: "taskName",
      header: "Task Name",
      width: "25%",
      render: (row) => {
        const priorityColor = PRIORITY_DOT[(row.priority || "Low")] || "#6b7280";
        return (
          <div className="d-flex align-items-center gap-2">
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
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
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
        if (!row.start_time) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>;
        const d = new Date(row.start_time);
        return (
          <div>
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
        if (!row.end_time) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>;
        const d = new Date(row.end_time);
        const s = (row.status || "").toLowerCase().replace(/[\s_]+/g, "_");
        const isCompleted = s === "completed" || s === "done";
        return (
          <div>
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
            }}
          >
            {status.label}
          </span>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => {
        const priorityColor = PRIORITY_DOT[(row.priority || "Low")] || "#6b7280";
        return (
          <span style={{ color: priorityColor, fontWeight: 600, fontSize: 12 }}>
            {row.priority}
          </span>
        );
      },
    },
  ];

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

    setSubmitting(true);
    try {
      // USER/DEVELOPER always self-assign
      const assigneeIds = (isUserOrDev || assignToSelf) ? [String(userId)] : form.assignees;

      const promises = assigneeIds.map((assigneeId) => {
        const payload: taskList = {
          description: form.taskName,
          project: form.project,
          assigned_to: assigneeId,
          created_by: userId,
          priority: form.priority,
          end_time: form.dueDate || undefined,
          status: "pending",
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
      setForm({ taskName: "", project: "", assignees: [], priority: "HIGH", dueDate: "" });
      setAssignToSelf(false);
      setShowCreateForm(false);
      loadTasks();
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
  const activeProjects = projects.filter(
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
            {viewUserId ? `${getUserName(viewUserId)}'s Tasks` : "My Tasks"}
          </h2>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
            {viewUserId
              ? `Viewing tasks assigned to ${getUserName(viewUserId)}`
              : "Manage and track your daily activities"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Filter */}
          <FormControl size="small" sx={{
            minWidth: 140,
            ...selectSx,
          }}>
            <Select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
              displayEmpty
              renderValue={(val) => val || "All Projects"}
              MenuProps={menuProps}
            >
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((p, i) => (
                <MenuItem key={i} value={p.name}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Assignee Filter — SP sees AMs, AM sees Users/Developers */}
          {filterableUsers.length > 0 && (
            <FormControl size="small" sx={{
              minWidth: 140,
              ...selectSx,
            }}>
              <Select
                value={assigneeFilter}
                onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1); }}
                displayEmpty
                renderValue={(val) => {
                  if (!val) return role === "SP" ? "All AMs" : "All Members";
                  if (val === String(userId)) return "My Tasks";
                  const u = users.find((u) => String(u.id) === val);
                  return u?.fullName || val;
                }}
                MenuProps={menuProps}
              >
                <MenuItem value="">{role === "SP" ? "All AMs" : "All Members"}</MenuItem>
                {role === "AM" && (
                  <MenuItem value={String(userId)}>My Tasks</MenuItem>
                )}
                {filterableUsers.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>{u.fullName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Create Task Button — only in All Tasks view, hidden when form is open */}
          {viewMode === "all" && !showCreateForm && (
            <button
              className="btn text-white d-flex align-items-center gap-1"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 18px",
                whiteSpace: "nowrap",
              }}
              onClick={() => setShowCreateForm(true)}
            >
              + Create Task
            </button>
          )}
        </div>
      </div>

      {/* View Tabs + Date Picker + Active Projects Row */}
      <div className="rounded-2xl shadow-sm px-5 py-3 mb-5 flex flex-wrap justify-between items-center gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              borderRadius: 12,
              border: "1px solid var(--border-light)",
              overflow: "hidden",
              backgroundColor: "var(--bg-hover)",
            }}
          >
            <button
              onClick={() => setViewMode("all")}
              className="flex items-center gap-1.5"
              style={{
                backgroundColor: viewMode === "all" ? "#7c3aed" : "transparent",
                color: viewMode === "all" ? "#fff" : "var(--text-muted)",
                borderRadius: 0,
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 18px",
                whiteSpace: "nowrap",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <GridViewIcon sx={{ fontSize: 14 }} />
              All Tasks
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className="flex items-center gap-1.5"
              style={{
                backgroundColor: viewMode === "gantt" ? "#7c3aed" : "transparent",
                color: viewMode === "gantt" ? "#fff" : "var(--text-muted)",
                borderRadius: 0,
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 18px",
                whiteSpace: "nowrap",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Gantt chart
            </button>
          </div>

          {/* Date Navigator — hidden when Gantt view is active */}
          {viewMode !== "gantt" && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={goToPrevDay}
                className="w-8 h-8 flex items-center justify-center transition"
                style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)" }}
              >
                <KeyboardArrowLeftIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
              </button>
              <button
                className="flex items-center gap-1.5 text-white"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 18px",
                  whiteSpace: "nowrap",
                }}
                onClick={goToToday}
              >
                <CalendarMonthIcon sx={{ fontSize: 14 }} />
                {formatDateLabel(selectedDate)}
              </button>
              <div className="relative w-8 h-8 flex-shrink-0">
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
                  style={{ border: "1px solid var(--border-light)", borderRadius: 10, zIndex: 1 }}
                >
                  <CalendarMonthIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
                </div>
              </div>
              <button
                onClick={goToNextDay}
                className="w-8 h-8 flex items-center justify-center transition"
                style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)" }}
              >
                <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
              </button>
            </div>
          )}
        </div>

        {activeProjects.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Projects:</span>
            {activeProjects.map((p, i) => {
              const color = PROJECT_COLORS[i % PROJECT_COLORS.length].dot;
              return (
                <div key={p.id} className="flex items-center gap-1.5">
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
        <TaskGanttChart
          tasks={tasks}
          users={users}
          projects={projectFilter ? projects.filter(p => p.name === projectFilter) : projects}
          projectColorMap={projectColorMap}
          getUserName={getUserName}
          loading={loading}
          onTaskClick={(task) => setSelectedTask(task)}
        />
      ) : (
      /* Task Table + Create Form */
      <div className="flex gap-5">
        {/* Create Task Form Panel */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 380 }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <div className="rounded-2xl shadow-sm p-5 h-full" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
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
                  <FormControl fullWidth size="small" sx={selectSx}>
                    <Select
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
                      {formProjects.map((p) => (
                        <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                      ))}
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
                    {role === "AM" && (
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
                          Go to Domains & Projects &rarr;
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
                              style={{ color: "var(--text-faint)" }}
                              style={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}
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

                {/* Due Date */}
                <div className="mb-5">
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
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </div>
                <div className="flex gap-3">
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

        {/* Task Table */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <CircularProgress size={28} sx={{ color: "#7c3aed" }} />
            </div>
          ) : (
            <TableList<GroupedTask>
              columns={taskColumns}
              data={groupedFiltered}
              pagination={{ currentPage: page, totalPages, onPageChange: (p) => setPage(p) }}
              emptyMessage={`No tasks found for ${formatDateLabel(selectedDate)}`}
              onRowClick={(row) => setSelectedTask(row.tasks[0])}
            />
          )}
        </div>
      </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onStatusUpdate={loadTasks}
        canStartTask={
          selectedTask
            ? String(selectedTask.dailyLog?.assignedUser?.id || selectedTask.assigned_to || "") === String(userId)
            : false
        }
        hasInProgressTask={
          tasks.some((t) => {
            if (!selectedTask || String(t.id) === String(selectedTask.id)) return false;
            const s = (t.status || "").toLowerCase().replace(/[\s_]+/g, "_");
            const assignedId = String(t.dailyLog?.assignedUser?.id || t.assigned_to || "");
            return s === "in_progress" && assignedId === String(userId);
          })
        }
        projectColorMap={projectColorMap}
        showSnackbar={showSnackbar}
      />
    </div>
  );
}
