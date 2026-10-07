import { useEffect, useRef, useState } from "react";

import SpinLoader from "../../../presentation/SpinLoader";
import type {
  BoardTask,
  BoardColumnDef,
  BoardDensity,
  BoardLane,
  TaskBoardViewProps,
} from "../types";
import { PROJECT_COLORS } from "./ganttConstants";
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
  GROUP_COLORS,
  laneKind,
  dropDenialReason,
  BOARD_LANE_MIN_HEIGHT,
  BOARD_LANE_MAX_HEIGHT,
  paletteFromAccent,
} from "./boardConstants";
import BoardCard from "./TaskBoardView/BoardCard";
import BoardToolbar from "./TaskBoardView/BoardToolbar";
import DropZone from "./TaskBoardView/DropZone";
import LaneHeader from "./TaskBoardView/LaneHeader";
import {
  bucketTasks,
  buildLanes,
  fallbackLanes,
  omitKey,
  projectName,
} from "./TaskBoardView/boardUtils";

const laneColumn = (lane: BoardLane): BoardColumnDef => {
  const base = BOARD_COLUMNS.find((c) => c.key === lane.key);
  return {
    ...(base ?? { key: lane.key, label: lane.label, ...paletteFromAccent(GROUP_COLORS[0]) }),
    key: lane.key,
    label: lane.label,
    ...(lane.accent ? paletteFromAccent(lane.accent) : {}),
  };
};

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
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const laneScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const revealLast = useRef(false);

  const lanes = groups.length ? buildLanes(groups) : fallbackLanes();

  useEffect(() => {
    if (!hoverColumn) return;
    laneScrollRefs.current[hoverColumn]?.scrollTo({ top: 0, behavior: "smooth" });
  }, [hoverColumn]);

  useEffect(() => {
    if (!revealLast.current) return;
    revealLast.current = false;
    rowRef.current?.scrollTo({ left: rowRef.current.scrollWidth, behavior: "smooth" });
  }, [groups.length]);

  if (loading) return <SpinLoader isLoading />;

  const { buckets, hiddenCount } = bucketTasks(tasks, lanes, placed);

  const minWidth = isCompact ? BOARD_COLUMN_MIN_WIDTH_COMPACT : BOARD_COLUMN_MIN_WIDTH;
  const density: BoardDensity =
    tasks.length > AUTO_COMPACT_ABOVE ? "compact" : "comfortable";
  const dense = density === "compact";
  const laneByKey = new Map(lanes.map((l) => [l.key, l]));
  const dragKind = drag ? laneKind(laneByKey.get(drag.from)) : null;

  const denial = (lane: BoardLane): string | null =>
    dragKind ? dropDenialReason(dragKind, laneKind(lane)) : null;

  const canDrop = (lane: BoardLane) =>
    drag !== null && drag.from !== lane.key && !!onTaskMove && !denial(lane);

  const clearDrag = () => {
    setDrag(null);
    setHoverColumn(null);
  };

  const renameLane = (lane: BoardLane, label: string) => {
    const next = label.trim();
    if (!next || !lane.groupId || next === lane.label) return;
    void onGroupRename?.(lane.groupId, next);
  };

  const handleDrop = async (lane: BoardLane) => {
    const moving = drag;
    const refused = denial(lane);
    clearDrag();
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
      setPlaced((p) => omitKey(p, key));
      setSaving((s) => omitKey(s, key));
    }
  };

  return (
    <div>
      <BoardToolbar
        taskCount={tasks.length}
        onNewGroup={onGroupCreate ? () => setCreateOpen(true) : undefined}
      />

      <div
        ref={rowRef}
        onDragOver={(e) => {
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
          const column = laneColumn(lane);
          const cards = buckets.get(lane.key) ?? [];
          const droppable = canDrop(lane);
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
              <LaneHeader
                column={column}
                count={cards.length}
                dense={dense}
                editable={!!lane.groupId}
                onRename={(label) => renameLane(lane, label)}
                onRemove={() => setRemoveTarget(lane.groupId ?? null)}
              />

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
                  paddingRight: 4,
                }}
              >
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
                        e.dataTransfer.setData(BOARD_DRAG_TYPE, task.key);
                        setDrag({ task, from: column.key });
                      }}
                      onDragEnd={clearDrag}
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
