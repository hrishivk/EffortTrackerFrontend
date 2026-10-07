import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

import { toLocalDate } from "../../../shared/utils/taskStatus";
import { assigneeOf } from "../../../shared/utils/subtasks";
import { STATUS_ACCENT, PRIORITY_STYLE } from "./boardConstants";
import TaskTimer from "./TaskTimer";
import type { SubtaskBlocker, TaskUser } from "../../user/types";

export interface SubtaskRow {
  id?: string;
  description?: string;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  total_seconds?: number;
  assigned_to?: string | number | null;
  assignedUser?: TaskUser | null;
  dailyLog?: { assignedUser?: TaskUser } | null;
  is_blocked?: boolean;
  blocked_by?: SubtaskBlocker | null;
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const normalize = (v?: string | null) =>
  (v || "").toLowerCase().replace(/[\s-]+/g, "_");

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
  dense?: boolean;
  onSelect?: (subtaskId: string) => void;
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
        const who = assigneeOf(sub);

        const open = onSelect && sub.id ? () => onSelect(sub.id!) : undefined;

        return (
          <li
            key={sub.id ?? i}
            onClick={open}
            title={open ? `Open "${sub.description}"` : sub.description}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: dense ? 3 : 5,
              minWidth: 0,
              overflow: "hidden",
              padding: dense ? "5px 7px" : "7px 10px",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
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

              {who && (
                <span
                  title={who.fullName}
                  style={{
                    display: "inline-flex",
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    width: dense ? 17 : 19,
                    height: dense ? 17 : 19,
                    borderRadius: "50%",
                    backgroundColor: "#7c3aed",
                    color: "#fff",
                    fontSize: dense ? 7.5 : 8.5,
                    fontWeight: 700,
                  }}
                >
                  {initialsOf(who.fullName)}
                </span>
              )}

              {renderAction && (
                <span style={{ flexShrink: 0 }}>{renderAction(sub)}</span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: dense ? "2px 7px" : "3px 9px",
                minWidth: 0,
                paddingLeft: dense ? 19 : 21,
              }}
            >
              {prio && (
                <span
                  style={{
                    fontSize: dense ? 9 : 10,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    color: prio.color,
                  }}
                >
                  {(sub.priority || "").toUpperCase()}
                </span>
              )}

              {ran && (
                <span
                  title={ran.title}
                  style={{
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
                    fontSize: dense ? 9.5 : 10.5,
                    color: "var(--text-faint)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <CalendarTodayOutlinedIcon sx={{ fontSize: dense ? 10 : 11 }} />
                  {due.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                </span>
              )}

              <TaskTimer
                dense
                status={sub.status}
                startTime={sub.start_time}
                endTime={sub.end_time}
                totalSeconds={sub.total_seconds}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
