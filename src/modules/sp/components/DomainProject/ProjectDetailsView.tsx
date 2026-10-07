import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import TaskGanttChart from "../../../dashboard/components/TaskGanttChart";
import TaskDetailModal from "../../../dashboard/components/TaskDetailModal";
import { fetchTasksByProject, addTask } from "../../../../core/actions/action";
import { fetchAllUsers, fetchProjectMembers } from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import SpinLoader from "../../../../presentation/SpinLoader";
import { TASK_PROJECT_COLORS } from "./constants";
import ProjectInfoCard from "./ProjectDetailsView/ProjectInfoCard";
import StakeholderStack from "./ProjectDetailsView/StakeholderStack";
import GroupedTaskCard from "./ProjectDetailsView/GroupedTaskCard";
import TaskPager from "./ProjectDetailsView/TaskPager";
import CreateTaskPanel from "./ProjectDetailsView/CreateTaskPanel";
import {
  EMPTY_TASK_FORM,
  TASKS_PER_PAGE,
  groupProjectTasks,
  isDoneStatus,
  normalizeStatus,
  type TaskFormState,
} from "./ProjectDetailsView/projectDetailsUtils";
import type { ProjectDetailsViewProps } from "../../types";
import type { formUserData } from "../../../../shared/types/User";
import type { taskList, CreateTaskPayload } from "../../../user/types";

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
  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM);

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

  const groupedTasks = groupProjectTasks(tasks, getUserName);

  const totalTasks = groupedTasks.length;
  const completedTasks = groupedTasks.filter((g) => isDoneStatus(g.status)).length;
  const inProgressTasks = groupedTasks.filter((g) => normalizeStatus(g.status) === "in_progress").length;
  const healthPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isUserOrDev = role === "USER" || role === "DEVLOPER";

  const assignableUsers = (() => {
    if (isUserOrDev) return [];
    const baseUsers = role === "SP"
      ? users.filter((u) => (u.role || "").toUpperCase() === "AM")
      : users.filter((u) => ["USER", "DEVLOPER"].includes((u.role || "").toUpperCase()));
    const projectId = String(project.id);
    return baseUsers.filter((u) => {
      if (!u.projects || !Array.isArray(u.projects)) return false;
      return u.projects.some((p) => String(p.id) === projectId);
    });
  })();

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setTaskForm(EMPTY_TASK_FORM);
    setAssignToSelf(false);
  };

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
        const payload: CreateTaskPayload = {
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
      closeCreateForm();
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
      <div className="pd-back-link" onClick={onBack}>
        <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Gantt Chart
      </div>

      <ProjectInfoCard project={project} members={members} totalTasks={totalTasks} healthPercent={healthPercent} />

      <div className="pd-panels">
          <div className="pd-task-panel">
            <div className="pd-task-panel-header">
              <div>
                <div className="pd-task-panel-title">
                  <CheckCircleIcon sx={{ fontSize: 18, color: "#7c3aed" }} /> Task Tracking
                </div>
                <div className="pd-task-panel-count">{inProgressTasks} active assignment{inProgressTasks !== 1 ? "s" : ""}</div>
              </div>
              <StakeholderStack members={members} />
            </div>
            <div className="pd-task-list">
              {groupedTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: 32, color: "#9ca3af", fontSize: 13 }}>No tasks found for this project.</div>
              )}
              {groupedTasks.map((group) => (
                <GroupedTaskCard key={group.key} group={group} users={users}
                  onClick={() => setSelectedTask(group.tasks[0])} />
              ))}
            </div>
            <TaskPager page={taskPage} totalPages={taskTotalPages} onPageChange={setTaskPage} />
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
            <CreateTaskPanel
              taskForm={taskForm}
              setTaskForm={setTaskForm}
              assignToSelf={assignToSelf}
              setAssignToSelf={setAssignToSelf}
              role={role}
              currentUserName={loggedInUser?.fullName}
              isUserOrDev={isUserOrDev}
              assignableUsers={assignableUsers}
              getUserName={getUserName}
              submitting={submitting}
              onCancel={closeCreateForm}
              onSubmit={handleCreateTask}
            />
          )}
        </div>

      <TaskDetailModal task={selectedTask} open={selectedTask !== null}
        onClose={() => setSelectedTask(null)} onStatusUpdate={loadDetails}
        canStartTask={role === "USER" || role === "DEVLOPER"}
        projectColorMap={projectColorMap}
        showSnackbar={showSnackbar} />
    </div>
  );
};

export default ProjectDetailsView;
