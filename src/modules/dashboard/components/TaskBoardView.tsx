import { useEffect, useRef, useState, type DragEvent } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CircularProgress from "@mui/material/CircularProgress";

import SpinLoader from "../../../presentation/SpinLoader";
import { parseServerTime } from "../../../shared/utils/serverTime";
import type {
  BoardTask,
  BoardColumnKey,
  BoardColumnDef,
  BoardDensity,
  BoardLane,
  TaskGroup,
  TaskBoardViewProps,
} from "../types";
import { avatarColors, PROJECT_COLORS } from "./ganttConstants";
import { getInitials } from "./ganttUtils";
import TaskTimer from "./TaskTimer";
import { hasTrackedTime, taskTiming } from "../../../shared/utils/taskTime";
import DueBadge from "./DueBadge";
import SubtaskList from "./SubtaskList";
import { subtaskProgress } from "../../../shared/utils/subtasks";
import { dueState } from "../../../shared/utils/taskStatus";
import CreateGroupModal from "./CreateGroupModal";
import Dialoge from "../../../presentation/Dialog";
import BoardEmptyState from "./BoardEmptyState";
import {
  BOARD_COLUMNS,
  BOARD_AUTOSCROLL_EDGE,
  BOARD_AUTOSCROLL_STEP,
  BOARD_COLUMN_MIN_WIDTH,
  BOARD_COLUMN_MIN_WIDTH_COMPACT,
  AUTO_COMPACT_ABOVE,
  BOARD_DRAG_TYPE,
  DEFAULT_LANE_KEYS,
  GROUP_COLORS,
  GROUP_NAME_MAX,
  groupLaneKey,
  groupNameToStatus,
  STATUS_LANE_ORDER,
  STATUS_ACCENT,
  laneKind,
  dropDenialReason,
  PRIORITY_STYLE,
  BOARD_LANE_MIN_HEIGHT,
  BOARD_LANE_MAX_HEIGHT,
  paletteFromAccent,
  toBoardColumnKey,
} from "./boardConstants";

const projectName = (project: BoardTask["project"]) =>
  typeof project === "object" && project !== null ? project.name : String(project || "");

/**
 * A timestamp as it reads on a card: the clock time if it happened today,
 * otherwise the date. A board is usually one day's work, so "12:07 PM" says more
 * than repeating today's date on every card.
 */
const formatCardDate = (value?: string | null, dense = false) => {
  if (!value) return null;
  const ms = parseServerTime(value);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    ...(dense ? {} : { year: "numeric" }),
  });
};

/**
 * Which date a card shows, and what it means. `end_time` and `start_time` are
 * null until a task is started, so a To Do card falls back to when it was
 * created rather than showing nothing at all.
 */
const cardWhen = (task: BoardTask, statusKey: string | undefined, dense: boolean) => {
  if (statusKey === "completed" && task.end_time) {
    return { label: "Done", value: formatCardDate(task.end_time, dense) };
  }
  // Not started yet: show the plan (`start_date` / `due_date`), not the actuals,
  // which are still empty.
  if (statusKey === "yet_to_start") {
    if (task.start_date) return { label: "Starts", value: formatCardDate(task.start_date, dense) };
    if (task.due_date) return { label: "Due", value: formatCardDate(task.due_date, dense) };
  }
  if (task.start_time) {
    return { label: "Started", value: formatCardDate(task.start_time, dense) };
  }
  if (task.due_date) {
    return { label: "Due", value: formatCardDate(task.due_date, dense) };
  }
  if (task.created_at) {
    return { label: "Added", value: formatCardDate(task.created_at, dense) };
  }
  return null;
};

/**
 * Which column a row belongs to. A grouped row can carry several assignees at
 * different statuses, so the board shows the least-advanced one: a task nobody
 * has finished is not Completed.
 */
const resolveColumn = (task: BoardTask): BoardColumnKey => {
  const statuses = (task.assignees || []).map((a) => toBoardColumnKey(a.status));
  if (!statuses.length) return toBoardColumnKey(task.status);
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.every((s) => s === "completed")) return "completed";
  return "yet_to_start";
};

/** Six-dot grab affordance, matching the handle in the design. */
function DragHandle({ disabled, title }: { disabled?: boolean; title?: string }) {
  return (
    <span
      title={title}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 3px)",
        gap: 2,
        alignContent: "start",
        paddingTop: 3,
        flexShrink: 0,
        cursor: disabled ? "not-allowed" : "grab",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 3,
            borderRadius: "50%",
            backgroundColor: "var(--text-faint)",
          }}
        />
      ))}
    </span>
  );
}

interface BoardCardProps {
  task: BoardTask;
  column: BoardColumnDef;
  /**
   * The workflow status this lane stands for, if any. Lane keys are `group:<id>`
   * now, so the timer and the completed styling have to key off this rather than
   * off `column.key`.
   */
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

function BoardCard({
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
  // The deadline is `due_date`; `end_time` is overwritten when work finishes.
  const due = dueState(task.due_date, statusKey);
  const assignees = task.assignees || [];
  const isCompleted = statusKey === "completed";
  const draggable = !blockedReason && !isMoving;
  // Show a timer whenever there is time on the clock — accumulated or running —
  // rather than inferring it from the lane. A card parked in a group keeps the
  // total it earned on the way there.
  const subs = task.subtasks ?? [];
  const progress = subtaskProgress(subs);
  // A parent's clock is its subtasks': first start to last finish.
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

  const avatarStack = (size: number, max: number) => (
    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      {assignees.slice(0, max).map((a, i) => (
        <span
          key={`${task.key}-${a.userId ?? i}`}
          title={a.name}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            fontSize: size <= 18 ? 8 : 9,
            fontWeight: 700,
            color: "#fff",
            backgroundColor: avatarColors[i % avatarColors.length],
            border: "2px solid var(--bg-card)",
            marginLeft: i === 0 ? 0 : -6,
            flexShrink: 0,
          }}
        >
          {getInitials(a.name || "?")}
        </span>
      ))}
      {assignees.length > max && (
        <span style={{ fontSize: 9, color: "var(--text-faint)", marginLeft: 3 }}>
          +{assignees.length - max}
        </span>
      )}
    </span>
  );

  const statusMark = isMoving ? (
    <CircularProgress size={dense ? 11 : 12} sx={{ color: column.accent, flexShrink: 0 }} />
  ) : isCompleted ? (
    <CheckCircleIcon sx={{ fontSize: dense ? 13 : 16, color: column.accent, flexShrink: 0 }} />
  ) : null;

  // Compact: two tight rows, title on one line. Roughly half the height, so a
  // 200-task day fits on screen instead of scrolling past full-size cards.
  if (dense) {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        style={shell}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <DragHandle disabled={!draggable} title={blockedReason || "Drag to change status"} />
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
          {avatarStack(18, 2)}
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
          {showTimer && (
            <TaskTimer
              status={timing.status}
              startTime={timing.runningSince}
              endTime={timing.endTime}
              totalSeconds={timing.totalSeconds}
              dense
            />
          )}
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

  // Comfortable: full card, wrapped title and roomy chips.
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={shell}
    >
      {statusMark && (
        <span style={{ position: "absolute", top: 8, right: 8, lineHeight: 1 }}>{statusMark}</span>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <DragHandle disabled={!draggable} title={blockedReason || "Drag to change status"} />
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Title */}
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

          {/* Project + priority chips */}
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
            {/* Assignee initials sit with the chips rather than on their own row,
                so project, priority and who owns it read as one line. */}
            {avatarStack(20, 3)}

            {progress.total > 0 && (
              <button
                type="button"
                title={`${progress.done} of ${progress.total} subtasks done`}
                onClick={(e) => {
                  // The card itself opens the task, so keep this click local.
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
              }}
            >
              <SubtaskList subtasks={subs} dense onSelect={onSubtaskOpen} />
            </div>
          )}

          {/* Timer + due date, on their own row so a long elapsed time has space */}
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
              {showTimer ? (
                <TaskTimer
                  status={timing.status}
                  startTime={timing.runningSince}
                  endTime={timing.endTime}
                  totalSeconds={timing.totalSeconds}
                  dense
                />
              ) : (
                <span />
              )}
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

/** Dashed target shown in every column that can receive the card being dragged. */
function DropZone({ column, active }: { column: BoardColumnDef; active: boolean }) {
  return (
    <div
      style={{
        border: `2px dashed ${active ? column.accent : column.border}`,
        backgroundColor: active ? column.tint : "transparent",
        borderRadius: 12,
        padding: "22px 12px",
        textAlign: "center",
        transition: "border-color 0.18s, background-color 0.18s",
      }}
    >
      <InboxOutlinedIcon sx={{ fontSize: 26, color: column.accent, opacity: active ? 1 : 0.7 }} />
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 12,
          fontWeight: 700,
          color: column.accent,
        }}
      >
        Drop tasks here
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
        to move to {column.label}
      </p>
    </div>
  );
}

/**
 * The lanes on the board, in the order the API stores them.
 *
 * Every lane is a row in `task_groups` — To Do / In Progress / Completed included
 * — so renaming, recolouring and reordering all work through one mechanism and
 * survive a refresh. A lane whose name is a workflow status also drives that
 * status (see `groupNameToStatus`), which is what keeps the timer and the
 * one-task-in-progress rule attached to the right column.
 */
const buildLanes = (groups: TaskGroup[]): BoardLane[] => {
  const lanes: BoardLane[] = groups.map((g) => {
    const statusKey = g.status || groupNameToStatus(g.name);
    return {
      key: groupLaneKey(g.id),
      label: g.name.trim(),
      groupId: g.id,
      // A workflow lane uses its canonical colour so the board, the List badge
      // and the create dialog agree; a custom group keeps its own.
      accent: (statusKey && STATUS_ACCENT[statusKey]) || g.color,
      statusKey,
      position: g.position ?? 0,
    };
  });

  // Status lanes lead, in workflow order; custom groups follow in stored order.
  const rank = (l: BoardLane) => {
    const i = l.statusKey ? STATUS_LANE_ORDER.indexOf(l.statusKey) : -1;
    return i === -1 ? STATUS_LANE_ORDER.length : i;
  };
  return lanes.sort(
    (a, b) => rank(a) - rank(b) || (a.position ?? 0) - (b.position ?? 0)
  );
};

/** Used only if `/task-groups` gives us nothing, so the board is never blank. */
const fallbackLanes = (): BoardLane[] =>
  DEFAULT_LANE_KEYS.map((key) => {
    const c = BOARD_COLUMNS.find((col) => col.key === key)!;
    return { key, label: c.label, accent: c.accent, statusKey: key };
  });

/** Per-lane overflow menu: rename the group, or take it off the board. */
function LaneMenu({
  accent,
  onRename,
  onRemove,
}: {
  accent: string;
  onRename: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        title="Group options"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          border: "none",
          background: open ? "var(--bg-hover)" : "none",
          borderRadius: 6,
          cursor: "pointer",
          color: "var(--text-faint)",
        }}
      >
        <MoreHorizIcon sx={{ fontSize: 17 }} />
      </button>

      {open && (
        <>
          {/* Click-away catcher, so the menu closes without a document listener. */}
          <span
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 20, cursor: "default" }}
          />
          <span
            style={{
              position: "absolute",
              top: 26,
              right: 0,
              zIndex: 21,
              display: "flex",
              flexDirection: "column",
              minWidth: 148,
              padding: 5,
              borderRadius: 11,
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-card)",
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
            }}
          >
            {[
              { label: "Rename group", icon: EditOutlinedIcon, run: onRename, danger: false },
              { label: "Remove group", icon: DeleteOutlineIcon, run: onRemove, danger: true },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    item.run();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 9px",
                    border: "none",
                    borderRadius: 8,
                    background: "none",
                    color: item.danger ? "#dc2626" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Icon sx={{ fontSize: 15, color: item.danger ? "#dc2626" : accent }} />
                  {item.label}
                </button>
              );
            })}
          </span>
        </>
      )}
    </span>
  );
}

export default function TaskBoardView<T extends BoardTask>({
  tasks,
  projectColorMap,
  loading,
  isCompact,
  emptyMessage = "No tasks found",
  onTaskClick,
  onSubtaskClick,
  onTaskMove,
  dragBlockedReason,
  groups = [],
  onGroupCreate,
  onGroupRename,
  onGroupDelete,
}: TaskBoardViewProps<T>) {
  const [drag, setDrag] = useState<{ task: T; from: string } | null>(null);
  const [hoverColumn, setHoverColumn] = useState<string | null>(null);
  /** Optimistic placements, held until the parent's save settles. */
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  /** Which groups are on the board, in order. Restored from the last visit. */
  const [createOpen, setCreateOpen] = useState(false);
  /** Lane key currently being renamed inline from its header. */
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  /** Group id awaiting confirmation before it is removed. */
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  /** Each lane's scrolling card list, keyed by lane. */
  const laneScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /** Set when a group is created, so the new lane gets scrolled into view. */
  const revealLast = useRef(false);

  const lanes = groups.length ? buildLanes(groups) : fallbackLanes();

  // The drop target sits at the top of a lane, so a lane scrolled halfway down a
  // list of 20 would hide it. Bring it into view as soon as the lane is hovered.
  useEffect(() => {
    if (!hoverColumn) return;
    laneScrollRefs.current[hoverColumn]?.scrollTo({ top: 0, behavior: "smooth" });
  }, [hoverColumn]);

  // A new group is appended to the end of the row, which may be off-screen.
  useEffect(() => {
    if (!revealLast.current) return;
    revealLast.current = false;
    rowRef.current?.scrollTo({ left: rowRef.current.scrollWidth, behavior: "smooth" });
  }, [groups.length]);

  if (loading) return <SpinLoader isLoading />;

  const laneKeys = new Set(lanes.map((l) => l.key));

  /** Lane key for each status that has a lane driving it, e.g. in_progress → group:TG_4Zr. */
  const laneByStatus = new Map<string, string>();
  for (const l of lanes) if (l.statusKey && !laneByStatus.has(l.statusKey)) {
    laneByStatus.set(l.statusKey, l.key);
  }

  /**
   * Which lane a task belongs in:
   *
   * 1. an in-flight optimistic drop,
   * 2. its `group_id`, when that group is still on the board,
   * 3. the lane driving its status — this is how the existing tasks, which have
   *    no `group_id` at all, still appear under To Do / In Progress / Completed.
   *
   * A `group_id` pointing at a deleted group falls through to 3 rather than
   * taking the card off the board.
   */
  const laneOf = (task: T): string => {
    const optimistic = placed[task.key];
    if (optimistic) return optimistic;
    if (task.group_id) {
      const key = groupLaneKey(task.group_id);
      if (laneKeys.has(key)) return key;
    }
    return laneByStatus.get(resolveColumn(task)) ?? resolveColumn(task);
  };

  // Every lane gets a bucket, plus one per built-in status so tasks in a status
  // with no lane can still be counted rather than silently dropped.
  const buckets = new Map<string, T[]>();
  for (const l of lanes) buckets.set(l.key, []);
  for (const c of BOARD_COLUMNS) if (!buckets.has(c.key)) buckets.set(c.key, []);
  for (const task of tasks) {
    const key = laneOf(task);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(task);
  }

  /** Overdue first, then due today, then everything else. */
  const urgency = (task: T) => {
    const state = dueState(task.due_date, task.status);
    return state === "overdue" ? 0 : state === "today" ? 1 : 2;
  };

  // A card mid-drop stays at the very front, so it lands where the drop zone was
  // and is visible without scrolling; the rest sort by how pressing they are.
  // Array.sort is stable, so equal cards keep the API's order.
  for (const bucket of buckets.values()) {
    bucket.sort(
      (a, b) =>
        (placed[a.key] ? 0 : 1) - (placed[b.key] ? 0 : 1) || urgency(a) - urgency(b)
    );
  }

  const minWidth = isCompact ? BOARD_COLUMN_MIN_WIDTH_COMPACT : BOARD_COLUMN_MIN_WIDTH;
  // A busy board packs itself compact so it reads without a long scroll; a light
  // one keeps the full-size cards.
  const density: BoardDensity =
    tasks.length > AUTO_COMPACT_ABOVE ? "compact" : "comfortable";
  const dense = density === "compact";
  const laneByKey = new Map(lanes.map((l) => [l.key, l]));
  /** The class of lane the dragged card came from, while a drag is in flight. */
  const dragKind = drag ? laneKind(laneByKey.get(drag.from)) : null;

  /**
   * Why a lane cannot accept the card in flight, or null when it can. Refusing
   * up front is better than letting the drop fail: the API answers an illegal
   * move with a 409, and the user would only find out from an error toast.
   */
  const denial = (lane: BoardLane): string | null =>
    dragKind ? dropDenialReason(dragKind, laneKind(lane)) : null;

  const canDrop = (lane: BoardLane) =>
    drag !== null && drag.from !== lane.key && !!onTaskMove && !denial(lane);

  // Tasks parked in a status with no lane on the board — surfaced so work can't
  // sit somewhere invisible without saying so.
  let hiddenCount = 0;
  for (const [key, bucket] of buckets) if (!laneKeys.has(key)) hiddenCount += bucket.length;

  const renameLane = (lane: BoardLane, label: string) => {
    const next = label.trim();
    setRenaming(null);
    if (!next || !lane.groupId || next === lane.label) return;
    void onGroupRename?.(lane.groupId, next);
  };

  const handleDrop = async (lane: BoardLane) => {
    const moving = drag;
    const refused = moving ? dropDenialReason(laneKind(laneByKey.get(moving.from)), laneKind(lane)) : null;
    setDrag(null);
    setHoverColumn(null);
    if (!moving || !onTaskMove || moving.from === lane.key || refused) return;

    const { key } = moving.task;
    setPlaced((p) => ({ ...p, [key]: lane.key }));
    setSaving((s) => ({ ...s, [key]: true }));
    laneScrollRefs.current[lane.key]?.scrollTo({ top: 0, behavior: "smooth" });
    try {
      await onTaskMove(moving.task, {
        groupId: lane.groupId,
        statusKey: lane.statusKey,
        label: lane.label,
      });
    } finally {
      // Either the parent reloaded with the new status, or it failed and the card
      // snaps back to where the server still says it belongs.
      setPlaced((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
      setSaving((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div>
      {/* Toolbar: how the board is organised, a group filter, and New Group. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 13px",
            borderRadius: 11,
            border: "1px solid var(--border-light)",
            backgroundColor: "var(--bg-card)",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          <DashboardCustomizeOutlinedIcon sx={{ fontSize: 15, color: "var(--text-faint)" }} />
          Group by: Status
          <span style={{ fontWeight: 500, color: "var(--text-faint)" }}>
            &middot; {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {onGroupCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 15px",
              borderRadius: 11,
              border: "1px dashed #a855f7",
              backgroundColor: "rgba(168, 85, 247, 0.06)",
              color: "#7c3aed",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} /> New Group
          </button>
          )}
        </div>
      </div>

      {/* Every lane stays on one row — a card has to be able to reach any lane in
          a single drag, which a wrapped second row makes impossible. Lanes share
          the width evenly and the row scrolls only once they hit their floor. */}
      <div
        ref={rowRef}
        onDragOver={(e) => {
          // Nudge the row when a drag nears either edge, so a lane that is
          // scrolled out of view can still be dropped into.
          const row = rowRef.current;
          if (!row || !drag) return;
          const box = row.getBoundingClientRect();
          if (e.clientX > box.right - BOARD_AUTOSCROLL_EDGE) {
            row.scrollLeft += BOARD_AUTOSCROLL_STEP;
          } else if (e.clientX < box.left + BOARD_AUTOSCROLL_EDGE) {
            row.scrollLeft -= BOARD_AUTOSCROLL_STEP;
          }
        }}
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: `minmax(${minWidth}px, 1fr)`,
          gap: 14,
          alignItems: "stretch",
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {lanes.map((lane) => {
          // The lane keeps the status's colours but the name the user gave it.
          const base = BOARD_COLUMNS.find((c) => c.key === lane.key);
          const column: BoardColumnDef = {
            ...(base ?? { key: lane.key, label: lane.label, ...paletteFromAccent(GROUP_COLORS[0]) }),
            key: lane.key,
            label: lane.label,
            ...(lane.accent ? paletteFromAccent(lane.accent) : {}),
          };
          const cards = buckets.get(lane.key) ?? [];
          const droppable = canDrop(lane);
          // A lane the card cannot go to is dimmed and explains itself on hover,
          // so it reads as unavailable rather than unresponsive.
          const refusal = drag && drag.from !== lane.key ? denial(lane) : null;
          const isHovered = droppable && hoverColumn === column.key;
          return (
            <div
              key={column.key}
              onDragOver={(e) => {
                if (!droppable) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (hoverColumn !== column.key) setHoverColumn(column.key);
              }}
              onDragLeave={(e) => {
                // Ignore the leave events fired while crossing child elements.
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                if (hoverColumn === column.key) setHoverColumn(null);
              }}
              onDrop={(e) => {
                if (!droppable) return;
                e.preventDefault();
                void handleDrop(lane);
              }}
              title={refusal ?? undefined}
              style={{
                minWidth: 0,
                overflow: "hidden",
                opacity: refusal ? 0.45 : 1,
                cursor: refusal ? "not-allowed" : undefined,
                display: "flex",
                flexDirection: "column",
                borderRadius: 16,
                border: `1px solid ${isHovered ? column.accent : column.border}`,
                backgroundColor: "var(--bg-card)",
                backgroundImage: `linear-gradient(${column.tint}, ${column.tint})`,
                boxShadow: isHovered
                  ? `0 0 0 3px ${column.tint}, 0 6px 18px rgba(15, 23, 42, 0.06)`
                  : "0 1px 2px rgba(15, 23, 42, 0.04)",
                padding: dense ? 9 : 12,
                minHeight: dense ? BOARD_LANE_MIN_HEIGHT * 0.75 : BOARD_LANE_MIN_HEIGHT,
                transition: "border-color 0.18s, box-shadow 0.18s, opacity 0.18s",
              }}
            >
              {/* Column header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingBottom: dense ? 7 : 10,
                  marginBottom: dense ? 7 : 10,
                  borderBottom: `2px solid ${column.border}`,
                }}
              >
                {renaming === lane.key ? (
                  <>
                    <input
                      autoFocus
                      value={renameText}
                      maxLength={GROUP_NAME_MAX}
                      onChange={(e) => setRenameText(e.target.value)}
                      onBlur={() => renameLane(lane, renameText)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameLane(lane, renameText);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "3px 7px",
                        borderRadius: 7,
                        border: `1px solid ${column.accent}`,
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        fontSize: 13.5,
                        fontWeight: 700,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      title="Save name"
                      onClick={() => renameLane(lane, renameText)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        border: "none",
                        borderRadius: 6,
                        background: "none",
                        color: column.accent,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <CheckOutlinedIcon sx={{ fontSize: 16 }} />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      title={column.label}
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: column.accent,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {column.label}
                    </span>
                    <span
                      style={{
                        backgroundColor: column.countBg,
                        color: column.countText,
                        fontSize: 11,
                        fontWeight: 700,
                        minWidth: 20,
                        textAlign: "center",
                        padding: "1px 6px",
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    >
                      {cards.length}
                    </span>
                    <span style={{ flex: 1 }} />
                    {/* Only a saved group can be renamed or removed — the status
                        lanes are the board's fixed spine. */}
                    {lane.groupId && (
                      <LaneMenu
                        accent={column.accent}
                        onRename={() => {
                          setRenameText(column.label);
                          setRenaming(lane.key);
                        }}
                        onRemove={() => setRemoveTarget(lane.groupId ?? null)}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Cards */}
              <div
                className="board-lane-scroll"
                ref={(el) => {
                  laneScrollRefs.current[lane.key] = el;
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: dense ? 6 : 10,
                  flex: 1,
                  maxHeight: BOARD_LANE_MAX_HEIGHT,
                  // Room for the bar so a card's right edge never sits under it.
                  paddingRight: 4,
                }}
              >
                {/* Target first: a card is dropped in at the top, where it can
                    be seen without scrolling past the cards already there. */}
                {droppable && <DropZone column={column} active={isHovered} />}

                {cards.map((task) => {
                  const projName = projectName(task.project);
                  const reason = onTaskMove
                    ? dragBlockedReason?.(task) ?? null
                    : "Dragging is unavailable here";
                  return (
                    <BoardCard
                      key={task.key}
                      task={task}
                      column={column}
                      statusKey={lane.statusKey}
                      projColor={projectColorMap[projName] || PROJECT_COLORS[0]}
                      blockedReason={reason}
                      isDragging={drag?.task.key === task.key}
                      isMoving={!!saving[task.key]}
                      clickable={!!onTaskClick}
                      dense={dense}
                      onClick={() => onTaskClick?.(task)}
                      onSubtaskOpen={
                        onSubtaskClick
                          ? (subtaskId) => onSubtaskClick(task, subtaskId)
                          : undefined
                      }
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        // Firefox needs payload set for the drag to start at all.
                        e.dataTransfer.setData(BOARD_DRAG_TYPE, task.key);
                        setDrag({ task, from: column.key });
                      }}
                      onDragEnd={() => {
                        setDrag(null);
                        setHoverColumn(null);
                      }}
                    />
                  );
                })}

                {cards.length === 0 && !droppable && (
                  <BoardEmptyState
                    laneKey={lane.statusKey ?? lane.key}
                    label={column.label}
                    accent={column.accent}
                    tint={column.tint}
                    dense={dense}
                  />
                )}
              </div>

            </div>
          );
        })}

      </div>

      <Dialoge
        open={removeTarget !== null}
        data="removeGroup"
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          const id = removeTarget;
          setRemoveTarget(null);
          if (id) void onGroupDelete?.(id);
        }}
      />

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        takenNames={new Set(groups.map((g) => g.name.trim().toLowerCase()))}
        onCreate={async (data) => {
          revealLast.current = true;
          await onGroupCreate?.(data);
        }}
      />

      {hiddenCount > 0 && (
        <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--text-faint)" }}>
          {hiddenCount} {hiddenCount === 1 ? "task is" : "tasks are"} in a group that is not on the
          board. Re-add it to see {hiddenCount === 1 ? "that task" : "them"}.
        </p>
      )}

      {tasks.length === 0 && (
        <p
          style={{
            margin: "14px 0 0",
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          {emptyMessage}
        </p>
      )}

    </div>
  );
}
