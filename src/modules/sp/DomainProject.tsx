import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import { motion } from "framer-motion";

import TableList from "../../shared/Table/Table";
import GanttChart from "../../shared/GhantChart/types/GhantChart";
import TaskGanttChart from "../dashboard/widgets/TaskGanttChart";
import TaskDetailModal from "../dashboard/widgets/TaskDetailModal";
import { fetchTask, addTask } from "../../core/actions/action";
import {
  fetchAllExistProjects,
  fetchAllUsers,
  fetchUsers,
  fetchProjectMembers,
  assignProjectMembers,
  removeProjectMembers,
  updateProjectStatus,
  fetchProjectStats,
} from "../../core/actions/spAction";
import { getProjectColumns } from "./domainProjectColumns";
import { useSnackbar } from "../../contexts/SnackbarContext";
import Dialoge from "../../presentation/Dialog/Dialog";
import type {
  DomainTab,
  TabItem,
  ProjectRow,
  PhaseItem,
  CriticalUpdate,
} from "./types";
import type { formUserData } from "../../shared/User/types";
import type { taskList } from "../user/types";
import "../../styles/project-details.scss";


const allTabs: TabItem[] = [
  { key: "overview", label: "Overview" },
  { key: "Gantt chart", label: "Gantt chart" },
];


const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "#e5e7eb" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiSelect-select": { padding: "6px 12px" },
  "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600 },
};

const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

// Phase data & critical updates are now computed from real projects inside the component


const StatCard = ({
  title,
  value,
  subtitle,
  progress,
  icon,
  accentColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
  icon: React.ReactNode;
  accentColor: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex-1">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide m-0">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-1 mb-0 leading-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-gray-400 mt-0.5 mb-0">{subtitle}</p>
        )}
        {progress !== undefined && (
          <div
            style={{
              width: 100,
              height: 6,
              borderRadius: 99,
              backgroundColor: "#e5e7eb",
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 99,
                background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              }}
            />
          </div>
        )}
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: accentColor + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
          fontSize: 16,
        }}
      >
        {icon}
      </div>
    </div>

  </div>
);

// ─── Project Details View Helpers ────────────────────────────────
const TASK_PROJECT_COLORS = [
  { bg: "#dbeafe", text: "#2563eb", dot: "#2563eb" },
  { bg: "#dcfce7", text: "#16a34a", dot: "#16a34a" },
  { bg: "#fae8ff", text: "#a855f7", dot: "#a855f7" },
  { bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" },
  { bg: "#fef3c7", text: "#d97706", dot: "#d97706" },
  { bg: "#e0e7ff", text: "#4f46e5", dot: "#4f46e5" },
  { bg: "#ccfbf1", text: "#0d9488", dot: "#0d9488" },
  { bg: "#fce7f3", text: "#db2777", dot: "#db2777" },
];

const pdAvatarColors = [
  "#7c3aed", "#2563eb", "#16a34a", "#dc2626",
  "#d97706", "#db2777", "#0d9488", "#4f46e5",
];

function pdGetInitials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function pdFormatDate(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function pdGetTaskStatus(status: string) {
  const s = (status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done") return { label: "COMPLETED", color: "#16a34a", bg: "#dcfce7" };
  if (s === "in_progress") return { label: "IN PROGRESS", color: "#2563eb", bg: "#dbeafe" };
  if (s === "review") return { label: "REVIEW", color: "#d97706", bg: "#fef3c7" };
  if (s === "blocked") return { label: "BLOCKED", color: "#dc2626", bg: "#fee2e2" };
  return { label: "YET TO START", color: "#9333ea", bg: "#f5f3ff" };
}

function pdGetDaysLeft(endTime?: string | null) {
  if (!endTime) return null;
  const end = new Date(endTime);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due today";
  return `${diff} Day${diff > 1 ? "s" : ""} left`;
}

function pdGetProjectStatusBadge(status: string) {
  const s = (status || "").toLowerCase().replace(/\s+/g, "_");
  if (s === "active") return { label: "ACTIVE", color: "#059669", bg: "#ecfdf5" };
  if (s === "on_hold") return { label: "ON HOLD", color: "#ea580c", bg: "#fff7ed" };
  if (s === "paused") return { label: "PAUSED", color: "#d97706", bg: "#fef3c7" };
  if (s === "completed") return { label: "COMPLETED", color: "#16a34a", bg: "#f0fdf4" };
  return { label: status.toUpperCase(), color: "#7c3aed", bg: "#f5f3ff" };
}

function HealthRing({ percent }: { percent: number }) {
  const radius = 38;
  const stroke = 6;
  const nr = radius - stroke / 2;
  const circ = nr * 2 * Math.PI;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="pd-health-ring">
      <svg width={radius * 2} height={radius * 2}>
        <circle stroke="#e5e7eb" fill="transparent" strokeWidth={stroke} r={nr} cx={radius} cy={radius} />
        <circle stroke="#7c3aed" fill="transparent" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`} style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 0.5s ease" }}
          r={nr} cx={radius} cy={radius} />
      </svg>
      <div className="pd-health-text">
        <span className="pd-health-percent">{percent}%</span>
        <span className="pd-health-label">Health</span>
      </div>
    </div>
  );
}

interface ProjectDetailsViewProps {
  project: any;
  allProjects: any[];
  onBack: () => void;
}

const ProjectDetailsView = ({ project, allProjects, onBack }: ProjectDetailsViewProps) => {
  const { showSnackbar } = useSnackbar();
  const loggedInUser = useSelector((state: any) => state.user.user);
  const role = loggedInUser?.role;
  const userId = loggedInUser?.id;

  const [members, setMembers] = useState<formUserData[]>([]);
  const [tasks, setTasks] = useState<taskList[]>([]);
  const [users, setUsers] = useState<formUserData[]>([]);
  const [pdLoading, setPdLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<taskList | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignToSelf, setAssignToSelf] = useState(false);
  const [taskForm, setTaskForm] = useState({
    taskName: "",
    assignees: [] as string[],
    priority: "HIGH",
    dueDate: "",
  });

  const projectColorMap: Record<string, (typeof TASK_PROJECT_COLORS)[0]> = {};
  allProjects.forEach((p: any, i: number) => {
    projectColorMap[p.name] = TASK_PROJECT_COLORS[i % TASK_PROJECT_COLORS.length];
  });

  const getUserName = useCallback(
    (id: string | number | null | undefined) => {
      if (!id) return "Unassigned";
      const u = users.find((usr) => String(usr.id) === String(id));
      return u?.fullName || "Unknown";
    },
    [users]
  );

  const loadDetails = useCallback(async () => {
    setPdLoading(true);
    try {
      const userRes = await fetchAllUsers();
      const allUsers: formUserData[] = userRes?.data || [];
      setUsers(allUsers);

      try {
        const memberRes = await fetchProjectMembers(String(project.id));
        const memberData = memberRes?.data?.members || memberRes?.data || [];
        setMembers(Array.isArray(memberData) ? memberData : []);
      } catch { setMembers([]); }

      try {
        const taskRes = await fetchTask(new Date(), String(userId), role, { project: project.name || "" });
        setTasks(taskRes?.data || []);
      } catch { setTasks([]); }
    } catch {
      showSnackbar({ message: "Failed to load project details", severity: "error" });
    } finally {
      setPdLoading(false);
    }
  }, [project.id, project.name, userId, role, showSnackbar]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  // ─── Group tasks by description + project for Task Tracking panel ───
  type GroupedPdTask = {
    key: string;
    description: string;
    project: string | { id: string; name: string };
    priority: string;
    status: string;
    start_time?: string | null;
    end_time?: string | null;
    tasks: typeof tasks;
    assignees: { name: string; status: string; userId: string | number | null | undefined }[];
  };

  const groupedTasks: GroupedPdTask[] = (() => {
    const map = new Map<string, typeof tasks>();
    for (const t of tasks) {
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
    const rows: GroupedPdTask[] = [];
    for (const [key, groupTasks] of map) {
      const first = groupTasks[0];
      const assignees = groupTasks.map((t) => ({
        name: t.dailyLog?.assignedUser?.fullName || getUserName(t.assigned_to) || "Unassigned",
        status: t.status || "",
        userId: t.assigned_to,
      }));
      let start: string | null = null;
      let end: string | null = null;
      for (const t of groupTasks) {
        if (t.start_time && (!start || t.start_time < start)) start = t.start_time;
        if (t.end_time && (!end || t.end_time > end)) end = t.end_time;
      }
      // Derive group status: if any in_progress → in_progress, if all completed → completed, else yet_to_start
      const statuses = groupTasks.map((t) => (t.status || "").toLowerCase().replace(/[\s_]+/g, "_"));
      let groupStatus = first.status || "";
      if (statuses.some((s) => s === "in_progress")) groupStatus = "In Progress";
      else if (statuses.every((s) => s === "completed" || s === "done")) groupStatus = "Completed";
      rows.push({
        key,
        description: first.description,
        project: first.project,
        priority: first.priority,
        status: groupStatus,
        start_time: start,
        end_time: end,
        tasks: groupTasks,
        assignees,
      });
    }
    return rows;
  })();

  const totalTasks = groupedTasks.length;
  const completedTasks = groupedTasks.filter((g) => {
    const s = (g.status || "").toLowerCase().replace(/[\s_]+/g, "_");
    return s === "completed" || s === "done";
  }).length;
  const inProgressTasks = groupedTasks.filter((g) => {
    const s = (g.status || "").toLowerCase().replace(/[\s_]+/g, "_");
    return s === "in_progress";
  }).length;
  const healthPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const manager = members.find((m) => (m as any).role?.toUpperCase() === "AM") || members[0];
  const statusBadge = pdGetProjectStatusBadge(project.status || "active");

  const hasInProgressTask = tasks.some((t) => {
    const s = (t.status || "").toLowerCase().replace(/[\s_]+/g, "_");
    return s === "in_progress" && String(t.assigned_to) === String(userId);
  });

  const isUserOrDev = role === "USER" || role === "DEVLOPER";

  // Assignable users: SP assigns to AM, AM assigns to USER/DEVLOPER
  const assignableUsers = (() => {
    if (isUserOrDev) return [];
    const baseUsers = role === "SP"
      ? users.filter((u) => (u.role || "").toUpperCase() === "AM")
      : users.filter((u) => ["USER", "DEVLOPER"].includes((u.role || "").toUpperCase()));
    const projectId = String(project.id);
    return baseUsers.filter((u) => {
      if (!u.projects || !Array.isArray(u.projects)) return false;
      return u.projects.some((p: any) => String(p.id) === projectId);
    });
  })();

  const handleCreateTask = async () => {
    if (!taskForm.taskName.trim()) {
      showSnackbar({ message: "Task name is required", severity: "error" });
      return;
    }
    if (!isUserOrDev && !assignToSelf && taskForm.assignees.length === 0) {
      showSnackbar({ message: "Please assign at least one person", severity: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const assigneeIds = (isUserOrDev || assignToSelf) ? [String(userId)] : taskForm.assignees;
      const promises = assigneeIds.map((assigneeId) => {
        const payload: taskList = {
          description: taskForm.taskName,
          project: project.name,
          assigned_to: assigneeId,
          created_by: userId,
          priority: taskForm.priority,
          end_time: taskForm.dueDate || undefined,
          status: "pending",
        };
        return addTask(payload);
      });
      await Promise.all(promises);
      showSnackbar({
        message: assignToSelf
          ? "Task assigned to yourself successfully"
          : `Task assigned to ${assigneeIds.length} member${assigneeIds.length > 1 ? "s" : ""} successfully`,
        severity: "success",
      });
      setTaskForm({ taskName: "", assignees: [], priority: "HIGH", dueDate: "" });
      setAssignToSelf(false);
      setShowCreateForm(false);
      loadDetails();
    } catch (error: any) {
      showSnackbar({ message: error?.response?.data?.message || "Failed to create task", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (pdLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <CircularProgress size={28} sx={{ color: "#7c3aed" }} />
      </div>
    );
  }

  return (
    <div className="pd-page" style={{ padding: 0, minHeight: "auto", background: "transparent" }}>
      {/* Back link */}
      <div className="pd-back-link" onClick={onBack}>
        <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Gantt Chart
      </div>

      {/* Project Info Card */}
      <div className="pd-info-card">
        <div className="pd-info-top">
          <div className="pd-info-left">
            <div style={{ marginBottom: 12 }}>
              <span className="pd-status-badge" style={{ color: statusBadge.color, backgroundColor: statusBadge.bg }}>
                {statusBadge.label}
              </span>
              <span className="pd-project-id">PRJ-{project.id}</span>
            </div>
            <h2 className="pd-project-name">{project.name}</h2>
            <p className="pd-project-desc">
              {project.description || `Project managed under ${project.client_department || project.domain?.name || "the organization"}.`}
            </p>
          </div>
          <div className="pd-info-right">
            <HealthRing percent={healthPercent} />
            <div className="pd-manager-section">
              <div>
                <p className="pd-manager-label">Project Manager</p>
                <div className="pd-manager-info">
                  <div className="pd-manager-avatar">{manager ? pdGetInitials(manager.fullName || "PM") : "PM"}</div>
                  <span className="pd-manager-name">{manager?.fullName || "Not assigned"}</span>
                </div>
              </div>
              <div>
                <p className="pd-manager-label">Key Stakeholders</p>
                <div className="pd-stakeholder-stack">
                  {members.slice(0, 3).map((m, i) => (
                    <div key={m.id || i} className="pd-stakeholder-avatar"
                      style={{ backgroundColor: "#7c3aed" }} title={m.fullName}>
                      {pdGetInitials(m.fullName || "U")}
                    </div>
                  ))}
                  {members.length > 3 && <div className="pd-stakeholder-overflow">+{members.length - 3}</div>}
                  {members.length === 0 && <span style={{ fontSize: 12, color: "#9ca3af" }}>No members</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="pd-meta-row">
          <div className="pd-meta-item">
            <p className="pd-meta-label">Start Date</p>
            <div className="pd-meta-value">
              <CalendarTodayIcon sx={{ fontSize: 14, color: "#16a34a" }} />
              {pdFormatDate(project.start_date || project.startDate)}
            </div>
          </div>
          <div className="pd-meta-item">
            <p className="pd-meta-label">Deadline</p>
            <div className="pd-meta-value">
              <EventIcon sx={{ fontSize: 14, color: "#dc2626" }} />
              {pdFormatDate(project.end_date || project.dueDate)}
            </div>
          </div>
          <div className="pd-meta-item">
            <p className="pd-meta-label">Total Tasks</p>
            <div className="pd-meta-value">
              <AssignmentIcon sx={{ fontSize: 14, color: "#7c3aed" }} />
              {totalTasks}
            </div>
          </div>
          <div className="pd-meta-item">
            <p className="pd-meta-label">Team Members</p>
            <div className="pd-meta-value">
              <GroupIcon sx={{ fontSize: 14, color: "#2563eb" }} />
              {members.length}
            </div>
          </div>
          <div className="pd-meta-item">
            <p className="pd-meta-label">Completion</p>
            <div className="pd-meta-value">
              <CheckCircleIcon sx={{ fontSize: 14, color: "#16a34a" }} />
              {healthPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="pd-panels">
          {/* Task Tracking Panel */}
          <div className="pd-task-panel">
            <div className="pd-task-panel-header">
              <div>
                <div className="pd-task-panel-title">
                  <CheckCircleIcon sx={{ fontSize: 18, color: "#7c3aed" }} /> Task Tracking
                </div>
                <div className="pd-task-panel-count">{inProgressTasks} active assignment{inProgressTasks !== 1 ? "s" : ""}</div>
              </div>
              <div className="pd-stakeholder-stack">
                {members.slice(0, 3).map((m, i) => (
                  <div key={m.id || i} className="pd-stakeholder-avatar"
                    style={{ backgroundColor: "#7c3aed" }} title={m.fullName}>
                    {pdGetInitials(m.fullName || "U")}
                  </div>
                ))}
              </div>
            </div>
            <div className="pd-task-list">
              {groupedTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: 32, color: "#9ca3af", fontSize: 13 }}>No tasks found for this project.</div>
              )}
              {groupedTasks.map((group) => {
                const st = pdGetTaskStatus(group.status || "");
                const daysLeft = pdGetDaysLeft(group.end_time);
                const assignees = group.assignees;
                const total = assignees.length;
                return (
                  <div key={group.key} className="pd-task-card" onClick={() => setSelectedTask(group.tasks[0])}>
                    <div className="pd-task-card-top">
                      <span className="pd-task-status-badge" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                      {total === 1 ? (
                        <div className="pd-task-assignee-avatar"
                          style={{ backgroundColor: pdAvatarColors[Math.max(0, users.findIndex((u) => String(u.id) === String(assignees[0].userId))) % pdAvatarColors.length] }}
                          title={assignees[0].name}>
                          {pdGetInitials(assignees[0].name)}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {assignees.slice(0, 3).map((a, i) => {
                            const aIdx = users.findIndex((u) => String(u.id) === String(a.userId));
                            const color = pdAvatarColors[Math.max(0, aIdx) % pdAvatarColors.length];
                            return (
                              <div key={i} className="pd-task-assignee-avatar"
                                style={{
                                  backgroundColor: color,
                                  marginLeft: i > 0 ? -8 : 0,
                                  zIndex: total - i,
                                  border: "2px solid #fff",
                                }}
                                title={a.name}>
                                {pdGetInitials(a.name)}
                              </div>
                            );
                          })}
                          {total > 3 && (
                            <div className="pd-task-assignee-avatar"
                              style={{
                                backgroundColor: "#e5e7eb",
                                color: "#6b7280",
                                marginLeft: -8,
                                border: "2px solid #fff",
                              }}>
                              +{total - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="pd-task-description">{group.description}</p>
                    <p className="pd-task-detail">
                      {group.priority && `Priority: ${group.priority}`}
                      {group.start_time && ` | Started: ${pdFormatDate(group.start_time)}`}
                    </p>
                    <div className="pd-task-card-footer">
                      <span>{pdFormatDate(group.end_time)}</span>
                      {daysLeft && (
                        <span className="pd-task-due" style={{
                          color: daysLeft === "Overdue" ? "#dc2626" : daysLeft === "Due today" ? "#d97706" : "#16a34a",
                        }}>{daysLeft}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
              <button className="pd-create-task-btn" onClick={() => setShowCreateForm(true)}>
                <AddIcon sx={{ fontSize: 16 }} /> Create New Task
              </button>
          </div>
          {!showCreateForm ? (
            <div className="pd-timeline-panel">
              <TaskGanttChart tasks={tasks} users={users} projects={allProjects}
                projectColorMap={projectColorMap} getUserName={getUserName}
                loading={false} onTaskClick={(task) => setSelectedTask(task)} hideLeftPanel />
            </div>
          ) : (
            <div className="pd-timeline-panel" style={{ padding: 24 }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900" style={{ fontSize: 18 }}>Create New Task</h3>
                  <p className="text-gray-400 mt-1" style={{ fontSize: 12 }}>Fill in the details to add a new task.</p>
                </div>
                <button onClick={() => { setShowCreateForm(false); setTaskForm({ taskName: "", assignees: [], priority: "HIGH", dueDate: "" }); setAssignToSelf(false); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8, display: "flex", alignItems: "center", color: "#9ca3af" }}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Name</label>
                <TextField fullWidth size="small" placeholder="e.g., Update Patient Portal UI"
                  value={taskForm.taskName} onChange={(e) => setTaskForm((f) => ({ ...f, taskName: e.target.value }))} sx={selectSx} />
              </div>
              {!isUserOrDev && (
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-sm font-semibold text-gray-700" style={{ lineHeight: 1 }}>Assignee</span>
                    {role === "AM" && (
                      <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => { const next = !assignToSelf; setAssignToSelf(next); if (next) setTaskForm((f) => ({ ...f, assignees: [] })); }} style={{ lineHeight: 1 }}>
                        <input type="checkbox" checked={assignToSelf} readOnly style={{ accentColor: "#7c3aed", width: 15, height: 15, margin: 0, cursor: "pointer" }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#4b5563", cursor: "pointer" }}>Assign to myself</span>
                      </div>
                    )}
                  </div>

                  {assignToSelf ? (
                    <div className="flex items-center gap-3 p-3" style={{ backgroundColor: "#f5f3ff", border: "1px solid #e0d6ff", borderRadius: 12 }}>
                      <div className="flex items-center justify-center rounded-full text-white flex-shrink-0"
                        style={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, backgroundColor: "#7c3aed" }}>
                        {pdGetInitials(loggedInUser?.fullName || "Me")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800" style={{ margin: 0 }}>{loggedInUser?.fullName || "Me"}</p>
                        <p className="text-xs text-gray-500" style={{ margin: 0 }}>This task will be assigned to you</p>
                      </div>
                    </div>
                  ) : assignableUsers.length === 0 ? (
                    <div className="flex items-start gap-3 p-3" style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 12 }}>
                      <span style={{ fontSize: 18, lineHeight: 1.2 }}>&#9888;</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">No members assigned to this project</p>
                        <p className="text-xs text-gray-600 mb-0">Please assign members to this project first before creating a task.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FormControl fullWidth size="small" sx={selectSx}>
                        <Select multiple value={taskForm.assignees}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTaskForm((f) => ({ ...f, assignees: typeof val === "string" ? val.split(",") : val }));
                          }}
                          displayEmpty
                          renderValue={(selected) =>
                            selected.length === 0
                              ? <span style={{ color: "#9ca3af" }}>Search team members...</span>
                              : <span style={{ fontSize: 13 }}>{selected.length} member{selected.length > 1 ? "s" : ""} selected</span>
                          }
                          MenuProps={menuProps}>
                          {assignableUsers.map((u) => {
                            const isSelected = taskForm.assignees.includes(String(u.id));
                            return (
                              <MenuItem key={u.id} value={String(u.id)}>
                                <div className="flex items-center gap-2 w-full">
                                  <Checkbox checked={isSelected} size="small" sx={{ "&.Mui-checked": { color: "#7c3aed" } }} />
                                  <div className="flex items-center justify-center rounded-full text-white"
                                    style={{ width: 24, height: 24, fontSize: 10, fontWeight: 700, backgroundColor: "#7c3aed" }}>
                                    {pdGetInitials(u.fullName)}
                                  </div>
                                  <span style={{ fontSize: 13 }}>{u.fullName}</span>
                                </div>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                      {/* Selected assignee chips */}
                      {taskForm.assignees.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {taskForm.assignees.map((id) => {
                            const name = getUserName(id);
                            return (
                              <div key={id} className="flex items-center gap-1.5 px-2 py-1" style={{ backgroundColor: "#f3f4f6", borderRadius: 12 }}>
                                <div className="flex items-center justify-center rounded-full text-white"
                                  style={{ width: 20, height: 20, fontSize: 8, fontWeight: 700, backgroundColor: "#7c3aed" }}>
                                  {pdGetInitials(name)}
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 500 }}>{name}</span>
                                <button onClick={() => setTaskForm((f) => ({ ...f, assignees: f.assignees.filter((a) => a !== id) }))}
                                  className="ml-0.5 text-gray-400 hover:text-gray-600" style={{ fontSize: 13, lineHeight: 1, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Priority Level */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority Level</label>
                <div className="flex gap-2">
                  {[
                    { key: "HIGH", label: "HIGH", icon: "!", color: "#dc2626", bg: "#fef2f2" },
                    { key: "MEDIUM", label: "MEDIUM", icon: "=", color: "#d97706", bg: "#fffbeb" },
                    { key: "LOW", label: "LOW", icon: "\u26A1", color: "#7c3aed", bg: "#f5f3ff" },
                  ].map((p) => (
                    <button key={p.key} onClick={() => setTaskForm((f) => ({ ...f, priority: p.key }))}
                      className="flex-1 flex flex-col items-center gap-1 py-3 border-2 transition-all"
                      style={{ borderRadius: 12, borderColor: taskForm.priority === p.key ? p.color : "#e5e7eb", backgroundColor: taskForm.priority === p.key ? p.bg : "#fff" }}>
                      <span style={{ fontSize: 18, color: p.color, fontWeight: 700 }}>{p.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                <TextField fullWidth size="small" type="date" value={taskForm.dueDate}
                  onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                  sx={selectSx} slotProps={{ inputLabel: { shrink: true } }} />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 btn border border-gray-300 text-gray-700 font-semibold"
                  style={{ borderRadius: 12, fontSize: 13, padding: "10px 0" }}
                  onClick={() => { setShowCreateForm(false); setTaskForm({ taskName: "", assignees: [], priority: "HIGH", dueDate: "" }); setAssignToSelf(false); }}>
                  Cancel
                </button>
                <button className="flex-1 btn text-white font-semibold"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 12, fontSize: 13, padding: "10px 0", opacity: submitting ? 0.7 : 1 }}
                  onClick={handleCreateTask} disabled={submitting}>
                  {submitting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Create Task"}
                </button>
              </div>
            </div>
          )}
        </div>

      <TaskDetailModal task={selectedTask} open={selectedTask !== null}
        onClose={() => setSelectedTask(null)} onStatusUpdate={loadDetails}
        canStartTask={role === "USER" || role === "DEVLOPER"}
        hasInProgressTask={hasInProgressTask} projectColorMap={projectColorMap}
        showSnackbar={showSnackbar} />
    </div>
  );
};

const isUserInProject = (user: formUserData, projectId: any): boolean => {
  const pid = String(projectId);
  if (!user.projects || !Array.isArray(user.projects)) return false;
  return user.projects.some((p) => String(p.id) === pid);
};

const ProjectExpandedRow = ({ row, onRefresh }: { row: ProjectRow; onRefresh?: () => void }) => {
  const { showSnackbar } = useSnackbar();
  const loggedInRole = useSelector((state: any) => state.user.user.role);
  const isSP = loggedInRole?.toUpperCase() === "SP";
  const [users, setUsers] = useState<formUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<formUserData | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (isSP) {
        const res = await fetchUsers({ role: "AM" });
        setUsers(res.users || []);
      } else {
        const res = await fetchAllUsers();
        const allUsers: formUserData[] = res.data || [];
        setUsers(allUsers.filter((u) => u.role === "USER" || u.role === "DEVLOPER"));
      }
    } catch {
      showSnackbar({ message: "Failed to load users", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, isSP]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const assignedMembers = users.filter((u) => isUserInProject(u, row.id));
  const availableMembers = users.filter((u) => !isUserInProject(u, row.id));

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    try {
      await removeProjectMembers(String(row.id), [String(removeTarget.id)]);
      showSnackbar({ message: `${removeTarget.fullName} removed`, severity: "success" });
      await loadUsers();
      onRefresh?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to remove member";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setRemoveTarget(null);
    }
  };

  const handleOpenAssign = () => {
    setAssignOpen(true);
    setSelectedUserIds([]);
    setUserSearch("");
  };

  const handleAssignSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    setAssignLoading(true);
    try {
      await assignProjectMembers(String(row.id), selectedUserIds);
      showSnackbar({ message: `${selectedUserIds.length} member(s) assigned`, severity: "success" });
      setAssignOpen(false);
      await loadUsers();
      onRefresh?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to assign members";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const filteredAvailable = availableMembers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-4">
        <CircularProgress size={24} sx={{ color: "#7c3aed" }} />
      </div>
    );
  }

  const isActive = (row.status || "").toLowerCase().replace(/\s+/g, "_") === "active";

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0" style={{ fontSize: 14, color: "#374151" }}>
          Team Members ({assignedMembers.length})
        </h6>
        {isActive ? (
          <button
            className="btn btn-sm text-white"
            style={{
              backgroundColor: "#7c3aed",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
            }}
            onClick={handleOpenAssign}
          >
            + Assign Members
          </button>
        ) : (
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
            Only active projects can assign members
          </span>
        )}
      </div>

      {assignedMembers.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          No members assigned to this project yet.
        </p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {assignedMembers.map((member) => (
            <div
              key={member.id}
              className="d-flex align-items-center justify-content-between p-2 rounded-3"
              style={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#7c3aed",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getInitials(member.fullName)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{member.fullName}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{member.role}</div>
                </div>
              </div>
              <button
                className="btn btn-sm"
                style={{
                  color: "#dc3545",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "2px 10px",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                }}
                onClick={() => setRemoveTarget(member)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialoge
        open={removeTarget !== null}
        data="remove"
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
      />

      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          {isSP ? "Assign Managers (AM)" : "Assign Members"} to {row.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            sx={{ mb: 2, mt: 1, ...selectSx }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9ca3af", fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {filteredAvailable.map((user) => {
              const uid = String(user.id);
              const isSelected = selectedUserIds.includes(uid);
              return (
                <div
                  key={uid}
                  className="d-flex align-items-center gap-2 p-2 rounded-2"
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#f5f3ff" : "transparent",
                  }}
                  onClick={() => toggleUserSelection(uid)}
                >
                  <Checkbox
                    checked={isSelected}
                    size="small"
                    sx={{ "&.Mui-checked": { color: "#7c3aed" } }}
                  />
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "#e5e7eb",
                      color: "#6b7280",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getInitials(user.fullName)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user.fullName}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{user.role}</div>
                  </div>
                </div>
              );
            })}
            {filteredAvailable.length === 0 && (
              <p className="text-center py-3" style={{ fontSize: 13, color: "#9ca3af" }}>
                No available users to assign.
              </p>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)} sx={{ color: "#6b7280", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignSubmit}
            disabled={selectedUserIds.length === 0 || assignLoading}
            variant="contained"
            sx={{
              backgroundColor: "#7c3aed",
              "&:hover": { backgroundColor: "#6d28d9" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {assignLoading ? "Assigning..." : `Assign (${selectedUserIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const DomainProject = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { role: urlRole } = useParams();
  const role = useSelector((state: any) => state.user.user.role);
  const isAM = role?.toUpperCase() === "AM";
  const currentRole = urlRole || (isAM ? "am" : "sp");
  const tabs = allTabs;
  const [activeTab, setActiveTab] = useState<DomainTab>("overview");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [rawProjects, setRawProjects] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [search, _setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; projectId: number | null; projectName: string; current: string }>({
    open: false, projectId: null, projectName: "", current: "",
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("2023");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stats, setStats] = useState<{
    projects: { total: number; active: number; on_hold: number; paused: number; completed: number };
    activeResources: number;
    totalTasks: number;
    completedTasks: number;
  } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProjectStats()
      .then((res) => setStats(res?.data || null))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetchAllExistProjects(debouncedSearch || undefined);
      if (response?.data) {
        const mapped: ProjectRow[] = response.data.map((p: any) => ({
          id: p.id,
          name: p.name || "",
          dueDate: p.end_date || p.dueDate || "-",
          clientDepartment: p.client_department || p.clientDepartment || p.domain?.name || "-",
          status: (p.status || "ACTIVE").toUpperCase(),
          progress: p.progress ?? 0,
          teamAssigned: (p.teamAssigned || []).map((u: any) =>
            typeof u === "string"
              ? { name: u, avatar: "" }
              : { name: u.fullName || u.name || "", avatar: u.avatar || "" }
          ),
        }));
        setProjects(mapped);
        setRawProjects(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute phase distribution from real projects
  const totalProjectCount = projects.length || 1;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "_");
  const activeCount = projects.filter((p) => norm(p.status) === "active").length;
  const onHoldCount = projects.filter((p) => norm(p.status) === "on_hold").length;
  const pausedCount = projects.filter((p) => norm(p.status) === "paused").length;
  const completedCount = projects.filter((p) => norm(p.status) === "completed").length;

  const phaseData: PhaseItem[] = [
    { label: "Active", count: activeCount, color: "#7c3aed", max: totalProjectCount },
    { label: "On Hold", count: onHoldCount, color: "#ea580c", max: totalProjectCount },
    { label: "Paused", count: pausedCount, color: "#d97706", max: totalProjectCount },
    { label: "Completed", count: completedCount, color: "#16a34a", max: totalProjectCount },
  ];

  // Compute critical updates from real projects
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const criticalUpdates: CriticalUpdate[] = [
    ...projects
      .filter((p) => {
        if (p.status === "COMPLETED") return false;
        const end = p.dueDate && p.dueDate !== "-" ? new Date(p.dueDate) : null;
        return end && end < now;
      })
      .map((p) => ({
        title: p.name,
        description: `Overdue — was due ${p.dueDate}. Current progress: ${p.progress}%`,
        type: "warning" as const,
      })),
    ...projects
      .filter((p) => p.status === "COMPLETED" || p.progress >= 100)
      .map((p) => ({
        title: p.name,
        description: `Completed successfully. Final progress: ${p.progress}%`,
        type: "success" as const,
      })),
  ];

  return (
    <div className="container py-4">

      <div className="relative flex gap-6 mt-2 border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-2 pb-3 text-sm font-semibold transition-colors duration-200 ${
                isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="domain-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #AD21DB, #7C3AED)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="d-flex justify-content-between align-items-start mt-4 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem" }}>
            {isAM
              ? activeTab === "overview"
                ? "Executive Project List"
                : "All Completed Projects Timeline"
              : "Domains & Projects"}
          </h2>
           <p className="text-muted mt-2 mb-0"  style={{ fontSize: "0.90rem" }}>
            {isAM
              ? activeTab === "overview"
                ? "High-level overview of all active initiatives and project health."
                : "Historical view of delivered initiatives and retrospective data."
              : "Manage all domains and their associated projects"}
          </p>
        </div>


        <div className="d-flex align-items-center gap-2">
          {activeTab === "overview" ? (
            <>
              {isAM && (
                <>
                  <button
                    className="btn text-white"
                    style={{ backgroundColor: "#7c3aed", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                    onClick={() => navigate(`/${currentRole}/create-domain`)}
                  >
                    + Create Domain
                  </button>
                  <button
                    className="btn text-white"
                    style={{ backgroundColor: "#7c3aed", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                    onClick={() => navigate(`/${currentRole}/create-project`)}
                  >
                    + Create Projects
                  </button>
                </>
              )}
              {!isAM && (
                <>
                  <button
                    className="btn text-white"
                    style={{ backgroundColor: "#4f46e5", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                    onClick={() => navigate(`/${currentRole}/create-domain`)}
                  >
                    + Add Domain
                  </button>
                  <button
                    className="btn text-white"
                    style={{ backgroundColor: "#9333ea", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                    onClick={() => navigate(`/${currentRole}/create-project`)}
                  >
                    + Add Project
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <FormControl size="small" sx={{ minWidth: 140, ...selectSx }}>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  MenuProps={menuProps}
                  renderValue={(val) => `Date: ${val}`}
                >
                  <MenuItem value="2023">2023</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                  <MenuItem value="2025">2025</MenuItem>
                  <MenuItem value="2026">2026</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150, ...selectSx }}>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  MenuProps={menuProps}
                  renderValue={(val) => `Category: ${val}`}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Development">Development</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                </Select>
              </FormControl>
              <button
                className="btn text-white"
                style={{ backgroundColor: "#7c3aed", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
              >
                Export Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stat Cards — Overview only */}
      {activeTab === "overview" && (
        <div className="scrollbar-hide" style={{ display: "flex", gap: 16, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          <div style={{ minWidth: 200, flex: "1 0 auto" }}>
            <StatCard
              title="Active Projects"
              value={stats?.projects.active ?? 0}
              subtitle={`${stats?.projects.total ?? 0} total projects`}
              accentColor="#7c3aed"
              icon={<span>&#9989;</span>}
            />
          </div>
          <div style={{ minWidth: 200, flex: "1 0 auto" }}>
            <StatCard
              title="On Hold"
              value={stats?.projects.on_hold ?? 0}
              subtitle="Awaiting feedback"
              accentColor="#f59e0b"
              icon={<span>&#9208;&#65039;</span>}
            />
          </div>
          <div style={{ minWidth: 200, flex: "1 0 auto" }}>
            <StatCard
              title="Total Completion"
              value={stats && stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : "0%"}
              progress={stats && stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}
              accentColor="#10b981"
              icon={<span>&#128202;</span>}
            />
          </div>
          <div style={{ minWidth: 200, flex: "1 0 auto" }}>
            <StatCard
              title="Active Resources"
              value={stats?.activeResources ?? 0}
              subtitle="Allocated across teams"
              accentColor="#6366f1"
              icon={<span>&#128101;</span>}
            />
          </div>
        </div>
      )}

      {activeTab === "Gantt chart" && !selectedProjectId && (
        <div className="mb-4">
          <GanttChart
            projects={rawProjects.map((p: any) => ({
              id: p.id,
              name: p.name || "",
              start_date: p.start_date || p.startDate,
              end_date: p.end_date || p.dueDate,
              status: p.status || "active",
              progress: p.progress ?? 0,
            }))}
            onProjectClick={(_projectName, projectId) => {
              setSelectedProjectId(projectId);
            }}
          />
        </div>
      )}

      {activeTab === "Gantt chart" && selectedProjectId && (() => {
        const selectedProject = rawProjects.find((p: any) => String(p.id) === String(selectedProjectId));
        if (!selectedProject) return null;
        return (
          <ProjectDetailsView
            project={selectedProject}
            allProjects={rawProjects}
            onBack={() => setSelectedProjectId(null)}
          />
        );
      })()}

      {activeTab === "overview" && (() => {
        const handleManageMembers = (projectId: number) => {
          const idx = projects.findIndex((p) => p.id === projectId);
          setExpandedIndex(expandedIndex === idx ? null : idx);
        };
        const handleStatusClick = (projectId: number, currentStatus: string) => {
          const proj = projects.find((p) => p.id === projectId);
          setStatusDialog({
            open: true,
            projectId,
            projectName: proj?.name || "",
            current: currentStatus.toLowerCase().replace(/\s+/g, "_"),
          });
        };
        return (
          <TableList
            columns={getProjectColumns(handleManageMembers, handleStatusClick)}
            data={projects}
            expandable={{
              renderExpandedRow: (row) => <ProjectExpandedRow row={row} onRefresh={fetchData} />,
              accordion: true,
              expandedIndex,
              onExpandChange: setExpandedIndex,
            }}
          />
        );
      })()}

      {activeTab === "overview" && (
      <div className="d-flex flex-column flex-lg-row gap-4 mt-4">
   
        <div
          className="bg-white rounded-2xl border border-gray-200 p-4"
          style={{ flex: 1 }}
        >
          <h3
            className="fw-bold text-gray-800 mb-3"
            style={{ fontSize: "1rem" }}
          >
            PROJECT PHASE DISTRIBUTION
          </h3>
          <div className="d-flex flex-column gap-3">
            {phaseData.map((phase) => (
              <div key={phase.label}>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    {phase.label}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
                  >
                    {phase.count} Projects
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(phase.count / phase.max) * 100}%`,
                      height: "100%",
                      borderRadius: 99,
                      backgroundColor: phase.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Project Updates */}
        <div
          className="bg-white rounded-2xl border border-gray-200 p-4"
          style={{ flex: 1 }}
        >
          <h3
            className="fw-bold text-gray-800 mb-3"
            style={{ fontSize: "1rem" }}
          >
            CRITICAL PROJECT UPDATES
          </h3>
          <div className="d-flex flex-column gap-3">
            {criticalUpdates.length > 0 ? (
              criticalUpdates.map((update, i) => (
                <div
                  key={i}
                  className="d-flex align-items-start gap-3 p-3 rounded-3"
                  style={{
                    backgroundColor:
                      update.type === "warning" ? "#fef2f2" : "#f0fdf4",
                    border: `1px solid ${update.type === "warning" ? "#fecaca" : "#bbf7d0"}`,
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {update.type === "warning" ? "⚠️" : "✅"}
                  </span>
                  <div>
                    <p
                      className="mb-0"
                      style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}
                    >
                      {update.title}
                    </p>
                    <p
                      className="mb-0"
                      style={{ fontSize: 12, color: "#6b7280" }}
                    >
                      {update.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
                No critical updates at the moment.
              </p>
            )}
          </div>
        </div>
      </div>
      )}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, projectId: null, projectName: "", current: "" })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "visible" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
          Change Project Status
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
            Update status for <strong style={{ color: "#111827" }}>{statusDialog.projectName}</strong>
          </p>
          <div className="d-flex flex-column gap-2">
            {[
              { value: "active", label: "Active", desc: "Project is in progress", color: "#059669", bg: "#ecfdf5" },
              { value: "on_hold", label: "On Hold", desc: "Temporarily paused, awaiting input", color: "#ea580c", bg: "#fff7ed" },
              { value: "paused", label: "Paused", desc: "Work stopped, needs review", color: "#d97706", bg: "#fef3c7" },
              { value: "completed", label: "Completed", desc: "All tasks finished", color: "#16a34a", bg: "#f0fdf4" },
            ].map((opt) => {
              const isSelected = opt.value === statusDialog.current;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (!isSelected) setStatusDialog((prev) => ({ ...prev, current: opt.value }));
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${opt.color}` : "1px solid #e5e7eb",
                    backgroundColor: isSelected ? opt.bg : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: isSelected ? `5px solid ${opt.color}` : "2px solid #d1d5db",
                      backgroundColor: isSelected ? "#fff" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{opt.desc}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: opt.color,
                      backgroundColor: opt.bg,
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {opt.label.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setStatusDialog({ open: false, projectId: null, projectName: "", current: "" })}
            sx={{ color: "#6b7280", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            disabled={statusLoading}
            onClick={async () => {
              if (!statusDialog.projectId) return;
              setStatusLoading(true);
              try {
                await updateProjectStatus(String(statusDialog.projectId), statusDialog.current);
                showSnackbar({ message: `Status updated to ${statusDialog.current.replace("_", " ").toUpperCase()}`, severity: "success" });
                setStatusDialog({ open: false, projectId: null, projectName: "", current: "" });
                fetchData();
                fetchProjectStats().then((res) => setStats(res?.data || null)).catch(() => {});
              } catch (error: any) {
                const msg = error?.response?.data?.message || "Failed to update status";
                showSnackbar({ message: msg, severity: "error" });
              } finally {
                setStatusLoading(false);
              }
            }}
            variant="contained"
            sx={{
              backgroundColor: "#7c3aed",
              "&:hover": { backgroundColor: "#6d28d9" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {statusLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DomainProject;
