import { useState } from "react";
import { Dialog, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { taskList } from "../../user/types";
import { updateTaskStatus } from "../../../core/actions/action";

const PROJECT_COLORS = [
  { bg: "#dbeafe", text: "#2563eb" },
  { bg: "#dcfce7", text: "#16a34a" },
  { bg: "#fae8ff", text: "#a855f7" },
  { bg: "#fee2e2", text: "#dc2626" },
  { bg: "#fef3c7", text: "#d97706" },
  { bg: "#e0e7ff", text: "#4f46e5" },
];

const priorityConfig: Record<string, { color: string; bg: string }> = {
  high:   { color: "#dc2626", bg: "#fef2f2" },
  medium: { color: "#d97706", bg: "#fffbeb" },
  low:    { color: "#7c3aed", bg: "#f5f3ff" },
};

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getStatusInfo(status: string) {
  const s = (status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done")
    return { label: "COMPLETED", color: "#16a34a", bg: "#dcfce7" };
  if (s === "in_progress")
    return { label: "IN PROGRESS", color: "#2563eb", bg: "#dbeafe" };
  if (s === "review")
    return { label: "REVIEW", color: "#d97706", bg: "#fef3c7" };
  return { label: "YET TO START", color: "#9333ea", bg: "#f5f3ff" };
}

function formatDate(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function isOverdue(task: taskList) {
  if (!task.end_time) return false;
  const end = new Date(task.end_time);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = (task.status || "").toLowerCase().replace(/[\s_]+/g, "_");
  return end < today && s !== "completed" && s !== "done";
}

interface TaskDetailModalProps {
  task: taskList | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
  canStartTask: boolean;
  hasInProgressTask?: boolean;
  projectColorMap: Record<string, { bg: string; text: string }>;
  showSnackbar: (opts: { message: string; severity: "success" | "error" }) => void;
}

export default function TaskDetailModal({
  task,
  open,
  onClose,
  onStatusUpdate,
  canStartTask,
  hasInProgressTask = false,
  projectColorMap,
  showSnackbar,
}: TaskDetailModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!task) return null;

  const status = getStatusInfo(task.status || "");
  const normalizedStatus = (task.status || "").toLowerCase().replace(/[\s_]+/g, "_");
  const isCompleted = normalizedStatus === "completed" || normalizedStatus === "done";
  const isInProgress = normalizedStatus === "in_progress";
  const isYetToStart = normalizedStatus === "yet_to_start" || normalizedStatus === "pending" || !task.status;

  const projName = typeof task.project === "object" && task.project !== null
    ? (task.project as any).name : (task.project || "");
  const projColor = projectColorMap[projName] || PROJECT_COLORS[0];

  const assigneeName = task.dailyLog?.assignedUser?.fullName || "Unassigned";
  const assigneeEmail = task.dailyLog?.assignedUser?.email || "";
  const creatorName = task.dailyLog?.creator?.fullName || "Unknown";

  const prio = (task.priority || "medium").toLowerCase();
  const prioStyle = priorityConfig[prio] || priorityConfig.medium;

  const overdue = isOverdue(task);

  // Determine next action
  let actionLabel = "";
  let actionIcon: React.ReactNode = null;
  let nextStatus = "";
  const blockedByInProgress = isYetToStart && hasInProgressTask;

  if (canStartTask) {
    if (isYetToStart) {
      actionLabel = "Start Timer";
      actionIcon = <PlayArrowIcon sx={{ fontSize: 18 }} />;
      nextStatus = "in_progress";
    } else if (isInProgress) {
      actionLabel = "Complete Task";
      actionIcon = <CheckCircleIcon sx={{ fontSize: 18 }} />;
      nextStatus = "completed";
    }
  }

  const handleStatusUpdate = async () => {
    if (!nextStatus || !task.id) return;
    setUpdating(true);
    try {
      await updateTaskStatus(String(task.id), nextStatus);
      showSnackbar({
        message: nextStatus === "in_progress"
          ? "Task started successfully"
          : "Task completed successfully",
        severity: "success",
      });
      onStatusUpdate();
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to update task status";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "visible",
          maxWidth: 560,
        },
      }}
    >
      <div style={{ padding: "28px 32px 24px" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div style={{ flex: 1, paddingRight: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.4 }}>
              {task.description}
            </h3>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
              Created {formatDate(task.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              color: "#9ca3af",
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: status.color,
              backgroundColor: status.bg,
              padding: "4px 12px",
              borderRadius: 6,
              letterSpacing: 0.5,
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px 24px",
            marginBottom: 24,
            padding: "20px",
            backgroundColor: "#fafafa",
            borderRadius: 14,
            border: "1px solid #f0f0f0",
          }}
        >
          {/* Project */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>
              Project
            </p>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: projColor.text,
                backgroundColor: projColor.bg,
                padding: "3px 10px",
                borderRadius: 6,
              }}
            >
              {projName}
            </span>
          </div>

          {/* Assigned To */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>
              Assigned To
            </p>
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  backgroundColor: "#7c3aed",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {getInitials(assigneeName)}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                {assigneeName}
              </span>
            </div>
          </div>

          {/* Priority */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>
              Priority
            </p>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: prioStyle.color,
                backgroundColor: prioStyle.bg,
                padding: "3px 10px",
                borderRadius: 6,
              }}
            >
              {task.priority}
            </span>
          </div>

          {/* Due Date */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>
              Due Date
            </p>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                {formatDate(task.end_time)}
              </span>
              {overdue && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#dc2626",
                    backgroundColor: "#fef2f2",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  Overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Task Description */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>
            Task Description
          </p>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              lineHeight: 1.6,
              padding: "14px 16px",
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              minHeight: 60,
            }}
          >
            {task.description}
          </div>
        </div>

        {/* Task Timeline */}
        {(task.start_time || isInProgress || isCompleted) && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>
              Timeline
            </p>
            <div
              className="d-flex gap-4"
              style={{
                fontSize: 12,
                color: "#6b7280",
                padding: "12px 16px",
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
              }}
            >
              {task.start_time && (
                <div>
                  <span style={{ fontWeight: 600, color: "#374151" }}>Started: </span>
                  {formatDate(task.start_time)}
                </div>
              )}
              {isCompleted && task.end_time && (
                <div>
                  <span style={{ fontWeight: 600, color: "#374151" }}>Completed: </span>
                  {formatDate(task.end_time)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Created By */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
            Created by <span style={{ fontWeight: 600, color: "#6b7280" }}>{creatorName}</span>
            {assigneeEmail && (
              <span> &middot; {assigneeEmail}</span>
            )}
          </p>
        </div>

        {/* Blocked warning */}
        {blockedByInProgress && canStartTask && (
          <div
            className="d-flex align-items-center gap-2 mb-3"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              backgroundColor: "#fef3c7",
              border: "1px solid #fcd34d",
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>&#9888;</span>
            <span style={{ fontSize: 12, color: "#92400e", fontWeight: 500 }}>
              You have a task in progress. Complete it first before starting a new one.
            </span>
          </div>
        )}

     
        <div className="d-flex justify-content-end gap-3">
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              backgroundColor: "#fff",
              color: "#6b7280",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          {actionLabel && (
            <button
              onClick={handleStatusUpdate}
              disabled={updating || blockedByInProgress}
              className="d-flex align-items-center gap-2"
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "none",
                background: blockedByInProgress
                  ? "#d1d5db"
                  : nextStatus === "completed"
                    ? "linear-gradient(135deg, #16a34a, #22c55e)"
                    : "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: updating || blockedByInProgress ? "not-allowed" : "pointer",
                opacity: updating || blockedByInProgress ? 0.7 : 1,
              }}
            >
              {updating ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : (
                <>
                  {actionIcon}
                  {actionLabel}
                </>
              )}
            </button>
          )}

          {isCompleted && (
            <span
              className="d-flex align-items-center gap-1"
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                backgroundColor: "#dcfce7",
                color: "#16a34a",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 18 }} />
              Completed
            </span>
          )}
        </div>
      </div>
    </Dialog>
  );
}
