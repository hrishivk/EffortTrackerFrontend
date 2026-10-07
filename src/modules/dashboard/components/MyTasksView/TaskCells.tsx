import type React from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { formUserData } from "../../../../shared/types/User";
import { parseServerTime } from "../../../../shared/utils/serverTime";
import { dueState, toLocalDate } from "../../../../shared/utils/taskStatus";
import DueBadge from "../DueBadge";
import { PRIORITY_DOT } from "./constants";
import { avatarColorFor, getInitials, getStatusBadge } from "./helpers";
import type { GroupedTask, ProjectColor } from "./types";

const emptyCell = (
  <span style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>--</span>
);

const priorityColorOf = (priority: string) => PRIORITY_DOT[(priority || "Low")] || "#6b7280";

const shortDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

export function TaskNameCell({
  row,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  row: GroupedTask;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: priorityColorOf(row.priority),
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: "var(--text-primary)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "block",
        maxWidth: "min(360px, 28vw)",
      }}>
        {row.description}
      </span>

      {canEdit && (
        <button
          type="button"
          className="task-edit-btn"
          title="Edit this task, or break it into subtasks"
          onClick={onEdit}
        >
          <EditOutlinedIcon sx={{ fontSize: 14 }} />
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          className="task-edit-btn task-edit-btn--danger"
          title="Delete this task"
          onClick={onDelete}
        >
          <DeleteOutlineIcon sx={{ fontSize: 14 }} />
        </button>
      )}
    </div>
  );
}

export function ProjectCell({ name, color }: { name: string; color: ProjectColor }) {
  return (
    <span
      style={{
        backgroundColor: color.bg,
        color: color.text,
        fontWeight: 600,
        fontSize: 11,
        padding: "3px 10px",
        borderRadius: 8,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {name}
    </span>
  );
}

const bubbleStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  color: "#fff",
  fontSize: 9,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

export function AssigneesCell({
  assignees,
  users,
}: {
  assignees: GroupedTask["assignees"];
  users: formUserData[];
}) {
  const total = assignees.length;
  if (total === 0) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>;
  if (total === 1) {
    const a = assignees[0];
    return (
      <div className="d-flex align-items-center gap-2">
        <div style={{ ...bubbleStyle, backgroundColor: avatarColorFor(users, a.userId) }}>
          {getInitials(a.name)}
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{a.name}</span>
      </div>
    );
  }
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ display: "flex" }}>
        {assignees.slice(0, 3).map((a, i) => (
          <div
            key={i}
            title={a.name}
            style={{
              ...bubbleStyle,
              backgroundColor: avatarColorFor(users, a.userId),
              border: "2px solid var(--bg-card)",
              marginLeft: i > 0 ? -6 : 0,
              zIndex: total - i,
            }}
          >
            {getInitials(a.name)}
          </div>
        ))}
        {total > 3 && (
          <div
            style={{
              ...bubbleStyle,
              backgroundColor: "var(--border-light)",
              color: "var(--text-secondary)",
              border: "2px solid #fff",
              marginLeft: -6,
            }}
          >
            +{total - 3}
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{total} assigned</span>
    </div>
  );
}

export function TimestampCell({ value, timeColor }: { value?: string | null; timeColor: string }) {
  if (!value) return emptyCell;
  const d = new Date(parseServerTime(value));
  return (
    <div style={{ whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>
        {shortDate(d)}
      </span>
      <div style={{ fontSize: 10, color: timeColor }}>
        {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

export function DueDateCell({ row, onSlipClick }: { row: GroupedTask; onSlipClick: () => void }) {
  const slips = row.extension_count ?? 0;

  const slipMark =
    slips > 0 ? (
      <button
        type="button"
        className="task-slip"
        title={`Deadline pushed ${slips} time${
          slips === 1 ? "" : "s"
        } — click to read why`}
        onClick={(e) => {
          e.stopPropagation();
          onSlipClick();
        }}
      >
        +{slips}
      </button>
    ) : null;

  const withMark = (node: React.ReactNode) =>
    slipMark ? (
      <span className="d-flex align-items-center gap-1" style={{ whiteSpace: "nowrap" }}>
        {node}
        {slipMark}
      </span>
    ) : (
      node
    );

  if (!row.due_date) return withMark(emptyCell);

  const due = dueState(row.due_date, row.status);
  if (due) return withMark(<DueBadge dueDate={row.due_date} state={due} />);

  const d = toLocalDate(row.due_date);
  if (!d) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>;
  return withMark(
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: "var(--text-primary)",
        whiteSpace: "nowrap",
      }}
    >
      {shortDate(d)}
    </span>
  );
}

const countBadgeColors = (label: string) =>
  label === "DONE"
    ? { color: "#16a34a", bg: "#dcfce7" }
    : label === "IN PROGRESS"
      ? { color: "#2563eb", bg: "#dbeafe" }
      : label === "YET TO START"
        ? { color: "#9333ea", bg: "#f5f3ff" }
        : { color: "#6b7280", bg: "#f3f4f6" };

const countBadgeLabel = (label: string) =>
  label === "YET TO START" ? "TODO" : label === "IN PROGRESS" ? "ACTIVE" : label;

export function StatusCell({ row }: { row: GroupedTask }) {
  const assignees = row.assignees || [];
  if (assignees.length > 1) {
    const counts: Record<string, number> = {};
    for (const a of assignees) {
      const badge = getStatusBadge(a.status);
      counts[badge.label] = (counts[badge.label] || 0) + 1;
    }
    return (
      <div className="d-flex flex-wrap gap-1">
        {Object.entries(counts).map(([label, count]) => {
          const badge = countBadgeColors(label);
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
                whiteSpace: "nowrap",
              }}
            >
              {count} {countBadgeLabel(label)}
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
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {status.label}
    </span>
  );
}

export function PriorityCell({ priority }: { priority: string }) {
  return (
    <span style={{ color: priorityColorOf(priority), fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>
      {priority}
    </span>
  );
}
