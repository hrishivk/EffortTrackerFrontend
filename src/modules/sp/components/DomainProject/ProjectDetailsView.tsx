import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Checkbox,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import TaskGanttChart from "../../../dashboard/components/TaskGanttChart";
import TaskDetailModal from "../../../dashboard/components/TaskDetailModal";
import { fetchTasksByProject, addTask } from "../../../../core/actions/action";
import { fetchAllUsers, fetchProjectMembers } from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import SpinLoader from "../../../../presentation/SpinLoader";
import HealthRing from "./HealthRing";
import { selectSx, menuProps, TASK_PROJECT_COLORS, pdAvatarColors } from "./constants";
import { pdGetInitials, pdFormatDate, pdGetTaskStatus, pdGetDaysLeft, pdGetProjectStatusBadge } from "./utils";
import type { ProjectDetailsViewProps } from "../../types";
import type { formUserData } from "../../../../shared/types/User";
import type { taskList } from "../../../user/types";

const TASKS_PER_PAGE = 5;

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
  const [taskPage, setTaskPage] = useState(1);
  const [taskTotalPages, setTaskTotalPages] = useState(1);
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
      const [userRes, memberRes, taskRes] = await Promise.all([
        fetchAllUsers().catch(() => null),
        fetchProjectMembers(String(project.id)).catch(() => null),
        fetchTasksByProject(project.name || "", { page: taskPage, limit: TASKS_PER_PAGE }).catch(() => null),
      ]);

      const allUsers: formUserData[] = userRes?.data || [];
      setUsers(allUsers);

      const memberData = memberRes?.data?.members || memberRes?.data || [];
      setMembers(Array.isArray(memberData) ? memberData : []);

      setTasks(taskRes?.data || []);
      setTaskTotalPages(taskRes?.totalPages || 1);
    } catch {
      showSnackbar({ message: "Failed to load project details", severity: "error" });
    } finally {
      setPdLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, project.name, taskPage, showSnackbar]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  // ─── Group tasks by description + project ───
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
        name: t.dailyLog?.assignedUser?.fullName || getUserName(t.dailyLog?.assigned_to || t.assigned_to) || "Unassigned",
        status: t.status || "",
        userId: t.dailyLog?.assigned_to || t.assigned_to,
      }));
      let start: string | null = null;
      let end: string | null = null;
      for (const t of groupTasks) {
        if (t.start_time && (!start || t.start_time < start)) start = t.start_time;
        if (t.end_time && (!end || t.end_time > end)) end = t.end_time;
      }
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

  const noMembersAssigned = assignableUsers.length === 0;

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
    return <SpinLoader isLoading />;
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
                      {daysLeft && st.label !== "COMPLETED" && (
                        <span className="pd-task-due" style={{
                          color: daysLeft === "Overdue" ? "#dc2626" : daysLeft === "Due today" ? "#d97706" : "#16a34a",
                        }}>{daysLeft}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Pagination */}
            {taskTotalPages > 1 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0", borderTop: "1px solid #f3f4f6", marginTop: 4,
              }}>
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>
                  Page {taskPage} of {taskTotalPages}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                    disabled={taskPage <= 1}
                    style={{
                      width: 28, height: 28, borderRadius: 8, border: "1px solid #e5e7eb",
                      background: taskPage <= 1 ? "#f9fafb" : "#fff", cursor: taskPage <= 1 ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: taskPage <= 1 ? 0.4 : 1,
                    }}>
                    <ChevronLeftIcon sx={{ fontSize: 16, color: "#6b7280" }} />
                  </button>
                  {Array.from({ length: taskTotalPages }, (_, i) => i + 1).map((pg) => (
                    <button key={pg} onClick={() => setTaskPage(pg)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: pg === taskPage ? "1.5px solid #7c3aed" : "1px solid #e5e7eb",
                        background: pg === taskPage ? "#f5f3ff" : "#fff",
                        color: pg === taskPage ? "#7c3aed" : "#6b7280",
                        cursor: "pointer",
                      }}>
                      {pg}
                    </button>
                  ))}
                  <button
                    onClick={() => setTaskPage((p) => Math.min(taskTotalPages, p + 1))}
                    disabled={taskPage >= taskTotalPages}
                    style={{
                      width: 28, height: 28, borderRadius: 8, border: "1px solid #e5e7eb",
                      background: taskPage >= taskTotalPages ? "#f9fafb" : "#fff", cursor: taskPage >= taskTotalPages ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: taskPage >= taskTotalPages ? 0.4 : 1,
                    }}>
                    <ChevronRightIcon sx={{ fontSize: 16, color: "#6b7280" }} />
                  </button>
                </div>
              </div>
            )}
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
                  ) : noMembersAssigned ? (
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

export default ProjectDetailsView;
