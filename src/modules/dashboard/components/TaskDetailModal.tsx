import { useState } from "react";
import { Dialog, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { taskList } from "../../user/types";
import { updateTaskLane } from "../../../core/actions/action";
import { assigneeOf } from "../../../shared/utils/subtasks";
import type { TaskGroup } from "../types";
import { findGroupForStatus } from "./boardConstants";
import ExtensionLog from "./ExtensionLog";
import TaskInfoGrid from "./TaskDetailModal/TaskInfoGrid";
import {
  PROJECT_COLORS,
  formatDate,
  getStatusInfo,
  normalizeStatus,
} from "./TaskDetailModal/taskDetailHelpers";

interface TaskDetailModalProps {
  task: taskList | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
  canStartTask: boolean;
  projectColorMap: Record<string, { bg: string; text: string }>;
  groups?: TaskGroup[];
  showSnackbar: (opts: { message: string; severity: "success" | "error" }) => void;
}

export default function TaskDetailModal({
  task,
  open,
  onClose,
  onStatusUpdate,
  canStartTask,
  projectColorMap,
  groups = [],
  showSnackbar,
}: TaskDetailModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!task) return null;

  const status = getStatusInfo(task.status || "");
  const normalizedStatus = normalizeStatus(task.status);
  const isCompleted = normalizedStatus === "completed" || normalizedStatus === "done";
  const isInProgress = normalizedStatus === "in_progress";
  const isYetToStart = normalizedStatus === "yet_to_start" || normalizedStatus === "pending" || !task.status;

  const projName = typeof task.project === "object" && task.project !== null
    ? (task.project as any).name : (task.project || "");
  const projColor = projectColorMap[projName] || PROJECT_COLORS[0];

  const assignee = assigneeOf(task);
  const assigneeName = assignee?.fullName || "Unassigned";
  const assigneeEmail = assignee?.email || "";
  const creatorName = task.dailyLog?.creator?.fullName || "Unknown";

  let actionLabel = "";
  let actionIcon: React.ReactNode = null;
  let nextStatus = "";

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
      const target = findGroupForStatus(groups, nextStatus);
      await updateTaskLane(
        String(task.id),
        target ? { groupId: target.id } : { status: nextStatus, groupId: null }
      );
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
          overflow: "hidden",
          maxWidth: 560,
          maxHeight: "90vh",
          backgroundColor: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <div style={{ padding: "28px 32px 0", flexShrink: 0 }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div style={{ flex: 1, paddingRight: 16 }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: "break-word",
            }}>
              {task.description}
            </h3>
            <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "4px 0 0" }}>
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
              color: "var(--text-faint)",
              flexShrink: 0,
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

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
      </div>

      <div style={{ padding: "0 32px", overflowY: "auto", flex: 1, minHeight: 0 }}>

        <TaskInfoGrid
          task={task}
          projName={projName}
          projColor={projColor}
          assigneeName={assigneeName}
        />

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 8px" }}>
            Task Description
          </p>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              padding: "14px 16px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: 12,
              minHeight: 60,
              maxHeight: 200,
              overflowY: "auto",
              wordBreak: "break-word",
            }}
          >
            {task.description}
          </div>
        </div>

        {(task.start_time || isInProgress || isCompleted) && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 8px" }}>
              Timeline
            </p>
            <div
              className="d-flex gap-4"
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                padding: "12px 16px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: 12,
              }}
            >
              {task.start_time && (
                <div>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Started: </span>
                  {formatDate(task.start_time)}
                </div>
              )}
              {isCompleted && task.end_time && (
                <div>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Completed: </span>
                  {formatDate(task.end_time)}
                </div>
              )}
            </div>
          </div>
        )}

        {(task.extensions?.length ?? 0) > 0 && (
          <div style={{ marginBottom: 24 }}>
            <ExtensionLog
              extensions={task.extensions}
              title="Deadline changes"
              newestFirst
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0 }}>
            Created by <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{creatorName}</span>
            {assigneeEmail && (
              <span> &middot; {assigneeEmail}</span>
            )}
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 32px 24px", flexShrink: 0, borderTop: "1px solid var(--border-light)" }}>
        <div className="d-flex justify-content-end gap-3">
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-muted)",
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
              disabled={updating}
              className="d-flex align-items-center gap-2"
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "none",
                background:
                  nextStatus === "completed"
                    ? "linear-gradient(135deg, #16a34a, #22c55e)"
                    : "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: updating ? "not-allowed" : "pointer",
                opacity: updating ? 0.7 : 1,
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
