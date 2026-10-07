import type { ReactNode } from "react";
import type { taskList } from "../../../user/types";
import { formatDate, getInitials, isOverdue, priorityConfig } from "./taskDetailHelpers";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 6px" }}>
      {children}
    </p>
  );
}

interface TaskInfoGridProps {
  task: taskList;
  projName: string;
  projColor: { bg: string; text: string };
  assigneeName: string;
}

export default function TaskInfoGrid({ task, projName, projColor, assigneeName }: TaskInfoGridProps) {
  const prio = (task.priority || "medium").toLowerCase();
  const prioStyle = priorityConfig[prio] || priorityConfig.medium;
  const overdue = isOverdue(task);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px 24px",
        marginBottom: 24,
        padding: "20px",
        backgroundColor: "var(--bg-surface)",
        borderRadius: 14,
        border: "1px solid var(--border-light)",
      }}
    >
      <div>
        <FieldLabel>Project</FieldLabel>
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

      <div>
        <FieldLabel>Assigned To</FieldLabel>
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
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            {assigneeName}
          </span>
        </div>
      </div>

      <div>
        <FieldLabel>Priority</FieldLabel>
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

      <div>
        <FieldLabel>Due Date</FieldLabel>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            {formatDate(task.end_time)}
          </span>
          {(task.extension_count ?? task.extensions?.length ?? 0) > 0 && (
            <span
              className="task-slip"
              title="The deadline has been pushed — the reasons are below"
            >
              +{task.extension_count ?? task.extensions?.length}
            </span>
          )}
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
  );
}
