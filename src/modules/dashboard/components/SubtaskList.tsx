import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

import { toLocalDate } from "../../../shared/utils/taskStatus";
import { STATUS_ACCENT, PRIORITY_STYLE } from "./boardConstants";
import TaskTimer from "./TaskTimer";

/** The slice of a child task this list needs. */
export interface SubtaskRow {
  id?: string;
  description?: string;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  total_seconds?: number;
}

const normalize = (v?: string | null) =>
  (v || "").toLowerCase().replace(/[\s-]+/g, "_");

/** Icon and colour for a child task's state. */
const mark = (status?: string | null) => {
  const s = normalize(status);
  if (s === "completed" || s === "done")
    return { Icon: CheckCircleIcon, color: STATUS_ACCENT.completed };
  if (s === "in_progress")
    return { Icon: PlayCircleOutlineIcon, color: STATUS_ACCENT.in_progress };
  return { Icon: RadioButtonUncheckedIcon, color: STATUS_ACCENT.yet_to_start };
};

const clockOf = (v?: string | null) => {
  const d = toLocalDate(v);
  return d ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null;
};

/**
 * The window a subtask actually ran in, as a compact label. Null before it has
 * started, since there is nothing to report yet.
 */
const runWindow = (sub: SubtaskRow) => {
  const from = clockOf(sub.start_time);
  if (!from) return null;
  const to = clockOf(sub.end_time);
  return to
    ? { label: `${from} \u2192 ${to}`, title: `Ran from ${from} to ${to}` }
    : { label: `${from} \u2192`, title: `Started at ${from}` };
};

interface SubtaskListProps {
  subtasks: SubtaskRow[];
  /** Tighter rows, for a Board card rather than an expanded table row. */
  dense?: boolean;
  /** Opens the child task. Given its id, since the caller holds the full record. */
  onSelect?: (subtaskId: string) => void;
  /** The control shown at the end of each row — start, running, completed. */
  renderAction?: (subtask: SubtaskRow) => React.ReactNode;
}

export default function SubtaskList({
  subtasks,
  dense = false,
  onSelect,
  renderAction,
}: SubtaskListProps) {
  if (!subtasks.length) {
    return (
      <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)" }}>
        No subtasks on this task.
      </p>
    );
  }

  return (
    <ul
      style={{
        display: "flex",
        flexDirection: "column",
        gap: dense ? 4 : 6,
        margin: 0,
        padding: 0,
        listStyle: "none",
      }}
    >
      {subtasks.map((sub, i) => {
        const { Icon, color } = mark(sub.status);
        const prio = PRIORITY_STYLE[(sub.priority || "").toUpperCase()];
        const due = toLocalDate(sub.due_date);
        const ran = runWindow(sub);
        const isDone = normalize(sub.status) === "completed";

        const open = onSelect && sub.id ? () => onSelect(sub.id!) : undefined;

        return (
          <li
            key={sub.id ?? i}
            onClick={open}
            title={open ? `Open "${sub.description}"` : sub.description}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: dense ? "4px 7px" : "7px 10px",
              borderRadius: 8,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              cursor: open ? "pointer" : "default",
              transition: "border-color 0.15s, background-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!open) return;
              e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.4)";
            }}
            onMouseLeave={(e) => {
              if (!open) return;
              e.currentTarget.style.borderColor = "var(--border-light)";
            }}
          >
            <Icon sx={{ fontSize: dense ? 13 : 15, color, flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: dense ? 11.5 : 12.5,
                fontWeight: 500,
                color: isDone ? "var(--text-faint)" : "var(--text-primary)",
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              {sub.description}
            </span>

            {prio && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: dense ? 9 : 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  color: prio.color,
                }}
              >
                {(sub.priority || "").toUpperCase()}
              </span>
            )}

            {/* When it actually ran, if it has. */}
            {ran && (
              <span
                title={ran.title}
                style={{
                  flexShrink: 0,
                  fontSize: dense ? 9.5 : 10.5,
                  color: "var(--text-faint)",
                  whiteSpace: "nowrap",
                }}
              >
                {ran.label}
              </span>
            )}

            {due && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  flexShrink: 0,
                  fontSize: dense ? 9.5 : 10.5,
                  color: "var(--text-faint)",
                  whiteSpace: "nowrap",
                }}
              >
                <CalendarTodayOutlinedIcon sx={{ fontSize: dense ? 10 : 11 }} />
                {due.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
              </span>
            )}

            {/* Ticks while this subtask is running, the same as the List's
                Total Time column. */}
            <span style={{ flexShrink: 0 }}>
              <TaskTimer
                dense
                status={sub.status}
                startTime={sub.start_time}
                endTime={sub.end_time}
                totalSeconds={sub.total_seconds}
              />
            </span>

            {renderAction && (
              <span style={{ flexShrink: 0 }}>{renderAction(sub)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
