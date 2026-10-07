import { useState, type DragEvent } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";

import type { BoardTask, BoardColumnDef } from "../../types";
import { PROJECT_COLORS } from "../ganttConstants";
import TaskTimer from "../TaskTimer";
import { hasTrackedTime, taskTiming } from "../../../../shared/utils/taskTime";
import DueBadge from "../DueBadge";
import SubtaskList from "../SubtaskList";
import { subtaskProgress } from "../../../../shared/utils/subtasks";
import { dueState } from "../../../../shared/utils/taskStatus";
import { PRIORITY_STYLE } from "../boardConstants";
import DragHandle from "./DragHandle";
import AvatarStack from "./AvatarStack";
import { cardWhen, projectName } from "./boardUtils";

interface BoardCardProps {
  task: BoardTask;
  column: BoardColumnDef;
  statusKey?: string;
  projColor: (typeof PROJECT_COLORS)[0];
  blockedReason: string | null;
  isDragging: boolean;
  isMoving: boolean;
  clickable: boolean;
  dense: boolean;
  onClick: () => void;
  onSubtaskOpen?: (subtaskId: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

export default function BoardCard({
  task,
  column,
  statusKey,
  projColor,
  blockedReason,
  isDragging,
  isMoving,
  clickable,
  dense,
  onClick,
  onSubtaskOpen,
  onDragStart,
  onDragEnd,
}: BoardCardProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const priority = (task.priority || "").toUpperCase();
  const prio = PRIORITY_STYLE[priority];
  const projName = projectName(task.project);
  const when = cardWhen(task, statusKey, dense);
  const due = dueState(task.due_date, statusKey);
  const assignees = task.assignees || [];
  const isCompleted = statusKey === "completed";
  const draggable = !blockedReason && !isMoving;
  const subs = task.subtasks ?? [];
  const counted = subtaskProgress(subs);
  const progress = {
    done: task.subtask_done_count ?? counted.done,
    total: task.subtask_count ?? counted.total,
  };
  const timing = taskTiming(task);
  const showTimer = hasTrackedTime({
    status: timing.status,
    start_time: timing.runningSince,
    end_time: timing.endTime,
    total_seconds: timing.totalSeconds,
  });

  const shell = {
    position: "relative" as const,
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    borderLeft: `3px solid ${isCompleted ? column.accent : prio?.color || "#9ca3af"}`,
    borderRadius: dense ? 9 : 12,
    padding: dense ? "6px 8px" : "10px 12px",
    cursor: clickable ? "pointer" : "default",
    boxShadow: isDragging
      ? "0 12px 28px rgba(15, 23, 42, 0.18)"
      : "0 1px 2px rgba(15, 23, 42, 0.04)",
    opacity: isDragging ? 0.55 : 1,
    transform: isDragging ? "rotate(-1.5deg)" : "none",
    transition: "box-shadow 0.18s, transform 0.18s, opacity 0.18s",
  };

  const statusMark = isMoving ? (
    <CircularProgress size={dense ? 11 : 12} sx={{ color: column.accent, flexShrink: 0 }} />
  ) : isCompleted ? (
    <CheckCircleIcon sx={{ fontSize: dense ? 13 : 16, color: column.accent, flexShrink: 0 }} />
  ) : null;

  const timer = showTimer ? (
    <TaskTimer
      status={timing.status}
      startTime={timing.runningSince}
      endTime={timing.endTime}
      totalSeconds={timing.totalSeconds}
      dense
    />
  ) : null;

  const handle = (
    <DragHandle disabled={!draggable} title={blockedReason || "Drag to change status"} />
  );

  const shellProps = { draggable, onDragStart, onDragEnd, onClick, style: shell };

  if (dense) {
    return (
      <div {...shellProps}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {handle}
          <span
            title={task.description}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {task.description}
          </span>
          <AvatarStack taskKey={task.key} assignees={assignees} size={18} max={2} />
          {statusMark}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            paddingLeft: 14,
            overflow: "hidden",
          }}
        >
          {prio && (
            <span
              title={`${priority} priority`}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: prio.color,
                flexShrink: 0,
              }}
            />
          )}
          {projName && (
            <span
              title={projName}
              style={{
                color: projColor.text,
                fontSize: 9.5,
                fontWeight: 600,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {projName}
            </span>
          )}
          {progress.total > 0 && (
            <span
              title={`${progress.done} of ${progress.total} subtasks done`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                flexShrink: 0,
                fontSize: 9,
                fontWeight: 700,
                color: "var(--text-muted)",
              }}
            >
              <AccountTreeOutlinedIcon sx={{ fontSize: 10 }} />
              {progress.done}/{progress.total}
            </span>
          )}
          <span style={{ flex: 1 }} />
          {timer}
          {due && task.due_date ? (
            <DueBadge dueDate={task.due_date} state={due} dense />
          ) : (
            when?.value && (
              <span
                title={`${when.label} ${when.value}`}
                style={{ fontSize: 9.5, color: "var(--text-faint)", whiteSpace: "nowrap" }}
              >
                {when.label} {when.value}
              </span>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div {...shellProps}>
      {statusMark && (
        <span style={{ position: "absolute", top: 8, right: 8, lineHeight: 1 }}>{statusMark}</span>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {handle}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            title={task.description}
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.4,
              color: "var(--text-primary)",
              paddingRight: statusMark ? 18 : 0,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {task.description}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
            }}
          >
            {projName && (
              <span
                style={{
                  backgroundColor: projColor.bg,
                  color: projColor.text,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 6,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {projName}
              </span>
            )}
            {prio && (
              <span
                style={{
                  backgroundColor: prio.bg,
                  color: prio.color,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  padding: "3px 8px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {priority}
              </span>
            )}
            <AvatarStack taskKey={task.key} assignees={assignees} size={20} max={3} />

            {progress.total > 0 && (
              <button
                type="button"
                title={`${progress.done} of ${progress.total} subtasks done`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubtasks((v) => !v);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 7px",
                  border: "none",
                  borderRadius: 6,
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-muted)",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <AccountTreeOutlinedIcon sx={{ fontSize: 11 }} />
                {progress.done}/{progress.total}
                <ExpandMoreIcon
                  sx={{
                    fontSize: 12,
                    transition: "transform 0.18s",
                    transform: showSubtasks ? "rotate(180deg)" : "none",
                  }}
                />
              </button>
            )}
          </div>

          {showSubtasks && progress.total > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                marginTop: 8,
                paddingLeft: 8,
                borderLeft: "2px solid var(--border-light)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <SubtaskList subtasks={subs} dense onSelect={onSubtaskOpen} />
            </div>
          )}

          {(showTimer || when?.value || due) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                rowGap: 5,
                marginTop: 9,
                paddingTop: 9,
                borderTop: "1px solid var(--border-light)",
              }}
            >
              {timer ?? <span />}
              {due && task.due_date ? (
                <DueBadge
                  dueDate={task.due_date}
                  state={due}
                  style={{ marginLeft: "auto" }}
                />
              ) : (
                when?.value && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      color: "var(--text-faint)",
                      whiteSpace: "nowrap",
                      marginLeft: "auto",
                    }}
                  >
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 11 }} />
                    <span style={{ fontWeight: 600 }}>{when.label}</span>
                    {when.value}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
