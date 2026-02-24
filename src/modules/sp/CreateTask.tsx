import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  CircularProgress,
  FormControl,
  IconButton,
  Menu,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import CodeIcon from "@mui/icons-material/Code";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { motion } from "framer-motion";

import { addTask, fetchTask } from "../../core/actions/action";
import { fetchAllUsers, fetchAllExistProjects } from "../../core/actions/spAction";
import { useSnackbar } from "../../contexts/SnackbarContext";
import type { formUserData } from "../../shared/User/types";
import type { taskList } from "../user/types";

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "#e5e7eb" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiInputBase-input": { padding: "10px 14px", fontSize: 13 },
};

const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

const priorityIcons: Record<string, React.ReactNode> = {
  HIGH: <AssignmentIcon sx={{ fontSize: 18, color: "#dc2626" }} />,
  MEDIUM: <EditIcon sx={{ fontSize: 18, color: "#f59e0b" }} />,
  LOW: <CodeIcon sx={{ fontSize: 18, color: "#7c3aed" }} />,
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "#fef2f2", text: "#dc2626" },
  MEDIUM: { bg: "#fffbeb", text: "#d97706" },
  LOW: { bg: "#f5f3ff", text: "#7c3aed" },
};

const CreateTask = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { role: urlRole } = useParams();
  const user = useSelector((state: any) => state.user.user);
  const role = user?.role;
  const userId = user?.id;
  const currentRole = urlRole || (role?.toUpperCase() === "AM" ? "am" : "sp");

  const [form, setForm] = useState({
    taskName: "",
    deadline: "",
    assignEmployee: "",
    project: "",
    priority: "HIGH",
  });
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<formUserData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetchAllUsers();
      setUsers(res.data || []);
    } catch {
      /* silent */
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetchAllExistProjects();
      const all = res?.data || [];
      console.log("Projects data:", all);
      const activeProjects = all.filter((p: any) => {
        const status = (p.status || "").toLowerCase().replace(/\s+/g, "_");
        return !status || status === "active";
      });
      setProjects(activeProjects.length > 0 ? activeProjects : all);
    } catch {
      /* silent */
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

  const selectedProject = projects.find((p) => String(p.id) === form.project);
  const projectStartDate = selectedProject?.start_date || selectedProject?.startDate || selectedProject?.start || "";
  const projectEndDate = selectedProject?.end_date || selectedProject?.endDate || selectedProject?.dueDate || selectedProject?.end || "";

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset deadline when project changes (new date range)
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
      const deadline = form.deadline || projectEndDate || undefined;
      const payload: taskList = {
        description: form.taskName,
        project: form.project,
        assigned_to: form.assignEmployee,
        priority: form.priority,
        end_time: deadline,
        status: "pending",
      };
      await addTask(payload);
      showSnackbar({ message: "Task assigned successfully", severity: "success" });
      setForm({ taskName: "", deadline: "", assignEmployee: "", project: "", priority: "HIGH" });
      loadRecentTasks();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to assign task";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

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
      {/* Back link */}
      <div
        className="d-flex align-items-center gap-1 mb-2"
        style={{ cursor: "pointer", color: "#7c3aed", fontSize: 13, fontWeight: 600 }}
        onClick={() => navigate(`/${currentRole}/domain-project`)}
      >
        <ArrowBackIcon sx={{ fontSize: 16 }} />
        Back to Dashboard
      </div>

      {/* Heading */}
      <h2 className="fw-bold mb-1" style={{ fontSize: "1.5rem" }}>
        Task Assignment View
      </h2>
      <p className="mb-4" style={{ fontSize: 14, color: "#6b7280" }}>
        Create new tasks and assign them to your team members.
      </p>

      {/* ─── Assign New Task Card ──────────────────────────────── */}
      <div
        className="bg-white rounded-3 border p-4 mb-4"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AssignmentIcon sx={{ color: "#fff", fontSize: 16 }} />
          </div>
          <h5 className="fw-bold mb-0" style={{ fontSize: 16 }}>
            Assign New Task
          </h5>
        </div>

        {/* Task Name */}
        <div className="mb-3">
          <label
            style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}
          >
            Task Name
          </label>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g., Design system documentation"
            value={form.taskName}
            onChange={(e) => handleChange("taskName", e.target.value)}
            sx={selectSx}
          />
        </div>

        {/* Project & Priority */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label
              style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}
            >
              Project
            </label>
            <FormControl fullWidth size="small" sx={selectSx}>
              <Select
                value={form.project}
                onChange={(e) => handleChange("project", e.target.value)}
                displayEmpty
                renderValue={(val) =>
                  val
                    ? projects.find((p) => String(p.id) === val)?.name || val
                    : <span style={{ color: "#9ca3af" }}>Select project</span>
                }
                MenuProps={menuProps}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className="col-md-6">
            <label
              style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}
            >
              Priority
            </label>
            <FormControl fullWidth size="small" sx={selectSx}>
              <Select
                value={form.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                MenuProps={menuProps}
              >
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Deadline & Assign Employee */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label
              style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}
            >
              Deadline
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={form.deadline}
              onChange={(e) => handleChange("deadline", e.target.value)}
              sx={selectSx}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: {
                  ...(projectStartDate ? { min: projectStartDate } : {}),
                  ...(projectEndDate ? { max: projectEndDate } : {}),
                },
              }}
              helperText={
                projectStartDate && projectEndDate
                  ? !form.deadline
                    ? `Defaults to project deadline: ${new Date(projectEndDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`
                    : `Range: ${new Date(projectStartDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit" })} – ${new Date(projectEndDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`
                  : projectEndDate && !form.deadline
                    ? `Defaults to project deadline: ${new Date(projectEndDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`
                    : ""
              }
            />
          </div>
          <div className="col-md-6">
            <label
              style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}
            >
              Assign Employee
            </label>
            <FormControl fullWidth size="small" sx={selectSx}>
              <Select
                value={form.assignEmployee}
                onChange={(e) => handleChange("assignEmployee", e.target.value)}
                displayEmpty
                renderValue={(val) =>
                  val
                    ? getUserName(val)
                    : <span style={{ color: "#9ca3af" }}>Select team member</span>
                }
                MenuProps={menuProps}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          backgroundColor: "#7c3aed",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getInitials(u.fullName)}
                      </div>
                      <span style={{ fontSize: 13 }}>{u.fullName}</span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Submit */}
        <div className="d-flex justify-content-end">
          <button
            className="btn text-white d-flex align-items-center gap-2"
            style={{
              backgroundColor: "#7c3aed",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 24px",
              opacity: submitting ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : (
              <AssignmentIcon sx={{ fontSize: 16 }} />
            )}
            {submitting ? "Assigning..." : "Assign Task"}
          </button>
        </div>
      </div>

      {/* ─── Recently Created Tasks ───────────────────────────── */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0" style={{ fontSize: 16 }}>
            Recently Created Tasks
          </h5>
          <span
            style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, cursor: "pointer" }}
            onClick={() => navigate(`/${currentRole}/dashboard?tab=myTasks`)}
          >
            View All Tasks
          </span>
        </div>

        {loadingTasks ? (
          <div className="d-flex justify-content-center py-4">
            <CircularProgress size={24} sx={{ color: "#7c3aed" }} />
          </div>
        ) : recentTasks.length === 0 ? (
          <div
            className="bg-white rounded-3 border p-4 text-center"
            style={{ borderColor: "#e5e7eb", color: "#9ca3af", fontSize: 13 }}
          >
            No tasks created yet. Use the form above to assign a new task.
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {recentTasks.slice(0, 5).map((task, i) => {
              const assignedName = getUserName(task.assigned_to);
              const priority = (task.priority || "LOW").toUpperCase();
              const pColor = priorityColors[priority] || priorityColors.LOW;
              const pIcon = priorityIcons[priority] || priorityIcons.LOW;
              const deadline = task.end_time
                ? new Date(task.end_time).toLocaleDateString("en-US", {
                    month: "long",
                    day: "2-digit",
                    year: "numeric",
                  })
                : "-";

              return (
                <div
                  key={task.id || i}
                  className="bg-white rounded-3 border d-flex align-items-center justify-content-between px-4 py-3"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: pColor.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {pIcon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                        {task.description}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>
                        Priority: {priority}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-4">
                    {/* Assigned To */}
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>Assigned to:</span>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          backgroundColor: "#7c3aed",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getInitials(assignedName)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                        {assignedName}
                      </span>
                    </div>

                    {/* Deadline */}
                    <div className="text-end">
                      <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", fontWeight: 600 }}>
                        Deadline
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                        {deadline}
                      </div>
                    </div>

                    {/* More menu */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setMenuTaskId(String(task.id));
                      }}
                    >
                      <MoreVertIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => { setAnchorEl(null); setMenuTaskId(null); }}
          PaperProps={{ sx: { borderRadius: 2, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)", minWidth: 140 } }}
        >
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              if (menuTaskId) navigate(`/${currentRole}/dashboard?tab=myTasks`);
            }}
            sx={{ fontSize: 13 }}
          >
            View Details
          </MenuItem>
        </Menu>
      </div>

      {/* ─── Bottom Cards ─────────────────────────────────────── */}
      <div className="row g-3">
        <div className="col-md-8">
          <div
            className="bg-white rounded-3 border p-4 text-center"
            style={{ borderColor: "#e5e7eb" }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 32, color: "#9ca3af", mb: 1 }} />
            <h6 className="fw-bold mb-1" style={{ fontSize: 15 }}>
              Team Load Status
            </h6>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
              Design department is currently at 90% capacity. Consider
              redistributing creative tasks.
            </p>
            <button
              className="btn btn-sm"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 16px",
                color: "#374151",
              }}
            >
              View Capacity Planner
            </button>
          </div>
        </div>
        <div className="col-md-4">
          <div
            className="rounded-3 border p-4"
            style={{
              borderColor: "#e9d5ff",
              backgroundColor: "#faf5ff",
              height: "100%",
            }}
          >
            <h6
              className="fw-bold mb-1"
              style={{ fontSize: 14, color: "#7c3aed" }}
            >
              Pending Assignments
            </h6>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
              {pendingCount} tasks in the backlog need attention before end of
              week.
            </p>
            <div className="d-flex justify-content-between align-items-end">
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#7c3aed",
                  lineHeight: 1,
                }}
              >
                {String(pendingCount).padStart(2, "0")}
              </span>
              <ContentCopyOutlinedIcon
                sx={{ fontSize: 28, color: "#a78bfa" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateTask;
