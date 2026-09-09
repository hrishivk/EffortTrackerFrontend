import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import type { taskList } from "../../user/types";
import { toLocalDate } from "../../../shared/utils/taskStatus";
import { isTaskRunning, taskTiming } from "../../../shared/utils/taskTime";
import { STATUS_ACCENT, PRIORITY_STYLE } from "./boardConstants";
import TaskActionCell from "./TaskActionCell";
import TaskTimer from "./TaskTimer";
import SubtaskProgress from "./SubtaskProgress";

const normalize = (v?: string | null) =>
  (v || "").toLowerCase().replace(/[\s-]+/g, "_");

const STATUS_LABEL: Record<string, string> = {
  yet_to_start: "YET TO START",
  pending: "YET TO START",
  in_progress: "IN PROGRESS",
  completed: "DONE",
  done: "DONE",
  blocked: "BLOCKED",
};

const statusFace = (status?: string | null) => {
  const s = normalize(status);
  const accent = STATUS_ACCENT[s] ?? "#6b7280";
  return {
    label: STATUS_LABEL[s] ?? (s ? s.replace(/_/g, " ").toUpperCase() : "—"),
    color: accent,
    bg: `${accent}1f`,
  };
};

const projectName = (project: taskList["project"] | undefined) =>
  typeof project === "object" && project !== null ? project.name : String(project || "");

const showDate = (v?: string | null) => {
  const d = toLocalDate(v);
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "--";
};

const showTime = (v?: string | null) => {
  const d = toLocalDate(v);
  return d ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--";
};

/** "Sep 02, 10:56 AM" — a real timestamp in one line. */
const showWhen = (v?: string | null) => {
  const d = toLocalDate(v);
  if (!d) return "--";
  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })}, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

const showStamp = (v?: string | null) => {
  const d = toLocalDate(v);
  return d
    ? `${d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
    : "--";
};

/**
 * What actually happened to this task, derived from its own timestamps.
 *
 * There is no activity endpoint, so nothing here is invented — creation comes
 * from `created_at` + `creator`, and the start/finish entries only appear once
 * the matching timestamp exists.
 */
const buildActivity = (task: taskList) => {
  const by = task.dailyLog?.creator?.fullName || "—";
  const events: { at: string; title: string; by: string; tone: string }[] = [];
  if (task.created_at)
    events.push({ at: task.created_at, title: "Task created", by, tone: "#7c3aed" });
  if (task.start_time)
    events.push({
      at: task.start_time,
      title: "Work started",
      by: task.dailyLog?.assignedUser?.fullName || by,
      tone: STATUS_ACCENT.in_progress,
    });
  if (task.end_time && normalize(task.status) === "completed")
    events.push({
      at: task.end_time,
      title: "Marked complete",
      by: task.dailyLog?.assignedUser?.fullName || by,
      tone: STATUS_ACCENT.completed,
    });
  return events.sort((a, b) => (a.at < b.at ? -1 : 1));
};

interface TaskDetailPanelProps {
  task: taskList | null;
  open: boolean;
  onClose: () => void;
  /** False when the viewer is not the assignee, which makes everything read-only. */
  owns: boolean;
  /** Ids with a request in flight. */
  busy: Record<string, boolean>;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  projectColorMap: Record<string, { bg: string; text: string }>;
}

export default function TaskDetailPanel({
  task,
  open,
  onClose,
  owns,
  busy,
  onStart,
  onComplete,
  projectColorMap,
}: TaskDetailPanelProps) {
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setOpenRows({});
  }, [open, task?.id]);

  if (!task) return null;

  const face = statusFace(task.status);
  const prio = PRIORITY_STYLE[(task.priority || "").toUpperCase()];
  const projName = projectName(task.project);
  const projColor = projectColorMap[projName] ?? { bg: "#ede9fe", text: "#7c3aed" };
  const subs = task.subtasks ?? [];
  // A parent's clock is its subtasks': first start to last finish.
  const timing = taskTiming(task);
  const running = isTaskRunning({ ...task, status: timing.status, start_time: timing.runningSince });
  const st = normalize(task.status);
  const activity = buildActivity(task);

  const facts: { icon: React.ElementType; label: string; value: React.ReactNode }[] = [
    { icon: CalendarTodayOutlinedIcon, label: "Start Date", value: showDate(task.start_date) },
    { icon: CalendarTodayOutlinedIcon, label: "Due Date", value: showDate(task.due_date) },
    { icon: AccessTimeRoundedIcon, label: "Start Time", value: showTime(timing.startTime) },
    { icon: AccessTimeRoundedIcon, label: "End Time", value: showTime(timing.endTime) },
    {
      icon: TimerOutlinedIcon,
      label: "Total Time",
      // The component, not a formatted string — a running task has to tick, and
      // the parent runs whenever one of its subtasks does.
      value: (
        <TaskTimer
          status={timing.status}
          startTime={timing.runningSince}
          endTime={timing.endTime}
          totalSeconds={timing.totalSeconds}
        />
      ),
    },
  ];

  /** One row of the tree, plus its own children indented beneath. */
  const renderRow = (row: taskList, depth: number): React.ReactElement[] => {
    const kids = row.subtasks ?? [];
    const isOpen = !!openRows[String(row.id)];
    const rowFace = statusFace(row.status);
    const rowPrio = PRIORITY_STYLE[(row.priority || "").toUpperCase()];
    const rowProj = projectName(row.project) || projName;
    const done = normalize(row.status) === "completed";

    return [
      <tr key={row.id} className={depth > 0 ? "tdp__child" : undefined}>
        <td>
          <span className="tdp__tree-name">
            {kids.length > 0 ? (
              <button
                type="button"
                className="tdp__twisty"
                title={isOpen ? "Collapse" : "Expand"}
                onClick={() =>
                  setOpenRows((o) => ({ ...o, [String(row.id)]: !isOpen }))
                }
              >
                {isOpen ? (
                  <ExpandMoreIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ChevronRightIcon sx={{ fontSize: 16 }} />
                )}
              </button>
            ) : (
              <span style={{ width: 18, flexShrink: 0 }} />
            )}

            {done ? (
              <CheckCircleIcon
                sx={{ fontSize: 14, color: STATUS_ACCENT.completed, flexShrink: 0 }}
              />
            ) : (
              <RadioButtonUncheckedIcon
                sx={{ fontSize: 14, color: rowFace.color, flexShrink: 0 }}
              />
            )}

            <span
              title={row.description}
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 600,
                color: done ? "var(--text-faint)" : "var(--text-primary)",
                textDecoration: done ? "line-through" : "none",
              }}
            >
              {row.description}
            </span>

            {depth === 0 && rowProj && (
              <span
                className="tdp__chip"
                style={{ backgroundColor: projColor.bg, color: projColor.text, fontWeight: 600 }}
              >
                {rowProj}
              </span>
            )}
          </span>
        </td>
        <td>
          {/* When work actually began — `start_time`, not the planned date, which
              is usually just inherited from the parent. */}
          <span className="tdp__cell-date">
            <PlayArrowRoundedIcon sx={{ fontSize: 13, color: "var(--text-faint)" }} />
            {showWhen(row.start_time)}
          </span>
        </td>
        <td>
          <span className="tdp__cell-date">
            <CheckRoundedIcon sx={{ fontSize: 13, color: "var(--text-faint)" }} />
            {showWhen(row.end_time)}
          </span>
        </td>
        <td>
          <span className="tdp__cell-date">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 12, color: "var(--text-faint)" }} />
            {showDate(row.due_date)}
          </span>
        </td>
        <td>
          <span
            className="tdp__chip"
            style={{ backgroundColor: rowFace.bg, color: rowFace.color }}
          >
            {rowFace.label}
          </span>
        </td>
        <td>
          <span
            style={{ fontSize: 11.5, fontWeight: 700, color: rowPrio?.color ?? "var(--text-faint)" }}
          >
            {row.priority || "--"}
          </span>
        </td>
        <td>
          {/* Ticks on its own while this subtask is running. */}
          <TaskTimer
            dense
            status={row.status}
            startTime={row.start_time}
            endTime={row.end_time}
            totalSeconds={row.total_seconds}
          />
        </td>
        <td style={{ textAlign: "right" }}>
          <TaskActionCell
            dense
            status={row.status}
            owns={owns}
            busy={!!busy[String(row.id)]}
            onStart={() => onStart(String(row.id))}
            onComplete={() => onComplete(String(row.id))}
          />
        </td>
      </tr>,
      ...(isOpen ? kids.flatMap((kid) => renderRow(kid, depth + 1)) : []),
    ];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            // A step past `lg`, capped so it does not stretch edge to edge on a
            // wide monitor. The subtask tree carries seven columns and wants it.
            maxWidth: 1340,
            borderRadius: 4,
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            boxShadow: "0 24px 70px rgba(15, 23, 42, 0.26)",
          },
        },
      }}
    >
      <div className="tdp">
        {/* Header */}
        <div className="tdp__head">
          <div className="tdp__title-row">
            <span
              className="tdp__dot"
              style={{ backgroundColor: prio?.color ?? "#9ca3af" }}
            />
            <h3 className="tdp__title" title={task.description}>
              {task.description}
            </h3>
            {projName && (
              <span
                className="tdp__chip"
                style={{ backgroundColor: projColor.bg, color: projColor.text, fontWeight: 600 }}
              >
                {projName}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <button type="button" className="tdp__icon-btn" onClick={onClose} title="Close">
              <CloseIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
            <span
              className="tdp__chip"
              style={{ backgroundColor: face.bg, color: face.color }}
            >
              {running && <span className="task-running-dot" />}
              {face.label}
            </span>
            {prio && (
              <span
                className="tdp__chip"
                style={{ backgroundColor: prio.bg, color: prio.color }}
              >
                {(task.priority || "").toUpperCase()} PRIORITY
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="tdp__body">
          {/* Left — the facts */}
          <div>
            <div className="tdp__facts">
              {facts.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="tdp__fact">
                    <span className="tdp__fact-icon">
                      <Icon sx={{ fontSize: 16 }} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <p className="tdp__fact-label">{f.label}</p>
                      <p className="tdp__fact-value">{f.value}</p>
                    </span>
                  </div>
                );
              })}
              <div className="tdp__fact">
                <span className="tdp__fact-icon">
                  <FlagOutlinedIcon sx={{ fontSize: 16 }} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <p className="tdp__fact-label">Status</p>
                  <p className="tdp__fact-value">
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: face.color,
                      }}
                    />
                    {face.label}
                  </p>
                </span>
              </div>
            </div>

            <p className="tdp__section-label">Description</p>
            <p className="tdp__description">{task.description}</p>

            <div className="tdp__promo">
              <AutoAwesomeIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
              <p
                style={{
                  marginTop: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7c3aed",
                }}
              >
                Keep track of your progress
              </p>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: "var(--text-muted)",
                }}
              >
                Break down large tasks into smaller subtasks and track them easily.
              </p>
            </div>
          </div>

          {/* Right — subtasks and history */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div className="tdp__panel">
              <div className="tdp__panel-head">
                <AccountTreeOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                <h4 className="tdp__panel-title">Subtasks ({subs.length})</h4>
                {/* The parent's state follows these, so show how far along it is. */}
                <SubtaskProgress subtasks={subs} />
              </div>

              {subs.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)" }}>
                  No subtasks yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="tdp__tree">
                    <thead>
                      <tr>
                        <th />
                        <th>Started</th>
                        <th>Ended</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Total Time</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>{subs.flatMap((sub) => renderRow(sub, 0))}</tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="tdp__panel">
              <div className="tdp__panel-head">
                <TimelineIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                <h4 className="tdp__panel-title">Activity</h4>
              </div>
              <ul className="tdp__activity">
                {activity.map((e, i) => (
                  <li key={i} className="tdp__event">
                    <span className="tdp__event-icon" style={{ backgroundColor: e.tone }}>
                      <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {e.title}
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--text-faint)" }}>
                        {showStamp(e.at)}
                      </p>
                    </span>
                    <span
                      style={{ fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}
                    >
                      by {e.by}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer — only Start, and only when there is something to start. The
            header's × closes, and a parent completes when its subtasks do. */}
        {owns && (st === "yet_to_start" || st === "pending") && (
          <div className="tdp__foot">
            <button
              type="button"
              className="tdp__primary-btn"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              disabled={!!busy[String(task.id)]}
              onClick={() => onStart(String(task.id))}
            >
              {busy[String(task.id)] ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                <PlayArrowRoundedIcon sx={{ fontSize: 17 }} />
              )}
              Start Task
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
