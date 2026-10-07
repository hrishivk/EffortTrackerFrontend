import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "framer-motion";

import { addTask, fetchTask } from "../../../../core/actions/action";
import { fetchAllUsers, fetchAllExistProjects } from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import type { formUserData } from "../../../../shared/types/User";
import type { CreateTaskPayload, taskList } from "../../../user/types";
import AssignTaskForm from "./CreateTask/AssignTaskForm";
import RecentTasksList from "./CreateTask/RecentTasksList";
import TeamInsights from "./CreateTask/TeamInsights";
import { INITIAL_FORM, type TaskForm } from "./CreateTask/constants";
import { filterActiveProjects, getProjectDates, type ProjectOption } from "./CreateTask/utils";

const CreateTask = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { role: urlRole } = useParams();
  const user = useSelector((state: any) => state.user.user);
  const role = user?.role;
  const userId = user?.id;
  const currentRole = urlRole || (role?.toUpperCase() === "AM" ? "am" : "sp");

  const [form, setForm] = useState<TaskForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<formUserData[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [recentTasks, setRecentTasks] = useState<taskList[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetchAllUsers();
      setUsers(res.data || []);
    } catch {

    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetchAllExistProjects();
      const all = res?.data || [];
      console.log("Projects data:", all);
      setProjects(filterActiveProjects(all));
    } catch {

    }
  }, []);

  const loadRecentTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetchTask(new Date(), String(userId), role);
      setRecentTasks(res?.data || []);
    } catch {
      setRecentTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [userId, role]);

  useEffect(() => {
    loadUsers();
    loadProjects();
    loadRecentTasks();
  }, [loadUsers, loadProjects, loadRecentTasks]);

  const handleChange = (field: keyof TaskForm, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "project") {
        updated.deadline = "";
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!form.taskName.trim()) {
      showSnackbar({ message: "Task name is required", severity: "error" });
      return;
    }
    if (!form.project) {
      showSnackbar({ message: "Please select a project", severity: "error" });
      return;
    }
    if (!form.assignEmployee) {
      showSnackbar({ message: "Please assign an employee", severity: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const selectedProject = projects.find((p) => String(p.id) === form.project);
      const deadline = form.deadline || getProjectDates(selectedProject).end || undefined;
      const payload: CreateTaskPayload = {
        description: form.taskName,
        project: form.project,
        assigned_to: form.assignEmployee,
        priority: form.priority,
        end_time: deadline,
        status: "pending",
      };
      await addTask(payload);
      showSnackbar({ message: "Task assigned successfully", severity: "success" });
      setForm(INITIAL_FORM);
      loadRecentTasks();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to assign task";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getUserName = (id: string | number | null | undefined) => {
    if (!id) return "Unassigned";
    const u = users.find((u) => String(u.id) === String(id));
    return u?.fullName || "Unknown";
  };

  const pendingCount = recentTasks.filter(
    (t) => (t.status || "").toLowerCase() === "pending"
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container py-4"
    >
      <div
        className="d-flex align-items-center gap-1 mb-2"
        style={{ cursor: "pointer", color: "#7c3aed", fontSize: 13, fontWeight: 600 }}
        onClick={() => navigate(`/${currentRole}/domain-project`)}
      >
        <ArrowBackIcon sx={{ fontSize: 16 }} />
        Back to Dashboard
      </div>

      <h2 className="fw-bold mb-1" style={{ fontSize: "1.5rem" }}>
        Task Assignment View
      </h2>
      <p className="mb-4" style={{ fontSize: 14, color: "var(--text-muted)" }}>
        Create new tasks and assign them to your team members.
      </p>

      <AssignTaskForm
        form={form}
        projects={projects}
        users={users}
        submitting={submitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
        getUserName={getUserName}
      />

      <RecentTasksList
        tasks={recentTasks}
        loading={loadingTasks}
        getUserName={getUserName}
        onViewAll={() => navigate(`/${currentRole}/dashboard?tab=myTasks`)}
      />

      <TeamInsights pendingCount={pendingCount} />
    </motion.div>
  );
};

export default CreateTask;
