import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { taskList } from "../../../user/types";
import { normalizeStatus } from "./weeklyChartConfig";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH:   { label: "HIGH PRIORITY", color: "#dc2626", bg: "#fef2f2" },
  MEDIUM: { label: "MEDIUM",        color: "#d97706", bg: "#fffbeb" },
  LOW:    { label: "LOW",           color: "#2563eb", bg: "#eff6ff" },
};

function formatDueLabel(dateStr?: string | null): string {
  if (!dateStr) return "";
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  const dayMs = 86400000;

  if (diff === 0) {
    const d = new Date(dateStr);
    return `Today, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diff === dayMs) return "Tomorrow";
  if (diff === -dayMs) return "Yesterday";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ActiveTaskItem = ({ task }: { task: taskList }) => {
  const prio = PRIORITY_CONFIG[(task.priority || "").toUpperCase()] || PRIORITY_CONFIG.LOW;
  const projName =
    typeof task.project === "object" && task.project !== null
      ? task.project.name
      : task.project || "";
  const dueLabel = formatDueLabel(task.end_time);
  const isInProgress = normalizeStatus(task.status) === "in_progress";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderRadius: 14,
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        transition: "all 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f5f3ff";
        e.currentTarget.style.borderColor = "#ede9fe";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-surface)";
        e.currentTarget.style.borderColor = "var(--border-light)";
      }}
    >
      <div className="d-flex align-items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: isInProgress ? "3px solid #7c3aed" : "2px solid var(--border-light)",
            backgroundColor: isInProgress ? "#f5f3ff" : "var(--bg-card)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isInProgress && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#7c3aed",
              }}
            />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {task.description}
          </p>
          <div className="d-flex align-items-center gap-2 mt-1">
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: prio.color,
                backgroundColor: prio.bg,
                padding: "2px 8px",
                borderRadius: 4,
                letterSpacing: 0.3,
              }}
            >
              {prio.label}
            </span>
            {projName && (
              <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
                {projName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3 flex-shrink-0">
        {dueLabel && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            {dueLabel}
          </span>
        )}
        <OpenInNewIcon sx={{ fontSize: 16, color: "var(--text-faint)" }} />
      </div>
    </div>
  );
};

export default ActiveTaskItem;
