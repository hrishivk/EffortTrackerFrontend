import type { RefObject } from "react";
import type { GroupedTaskRow, TaskBarStatus, TaskGanttChartProps } from "../../types";
import { avatarColors, statusDisplay } from "../ganttConstants";
import { getInitials, formatShortDate } from "../ganttUtils";

type Props = {
  panelRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  rows: GroupedTaskRow[];
  users: TaskGanttChartProps["users"];
  width: number;
  rowHeight: number;
  isTablet: boolean;
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
  onTaskClick?: TaskGanttChartProps["onTaskClick"];
};

const STATUS_COUNT_BADGES: { key: TaskBarStatus; label: string; color: string; bg: string }[] = [
  { key: "completed", label: "Done", color: "#7c3aed", bg: "#f3e8ff" },
  { key: "in_progress", label: "Active", color: "#9333ea", bg: "#f5f3ff" },
  { key: "pending", label: "Pending", color: "#6b7280", bg: "#f3f4f6" },
  { key: "overdue", label: "Overdue", color: "#dc2626", bg: "#fee2e2" },
];

const headerCellStyle = {
  fontWeight: 700,
  color: "var(--text-muted)",
  letterSpacing: 1,
  textTransform: "uppercase" as const,
};

const avatarStyle = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  fontSize: 8,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

function AssigneeAvatars({ row, users }: { row: GroupedTaskRow; users: Props["users"] }) {
  return (
    <div style={{ display: "flex", marginLeft: 2 }}>
      {row.assignees.slice(0, 4).map((a, i) => {
        const aIdx = users.findIndex(u => String(u.id) === String(a.userId));
        const color = avatarColors[Math.max(0, aIdx) % avatarColors.length];
        return (
          <div
            key={i}
            title={`${a.name} - ${statusDisplay[a.status].label}`}
            style={{
              ...avatarStyle,
              backgroundColor: color,
              color: "#fff",
              border: "2px solid #fff",
              marginLeft: i > 0 ? -6 : 0,
              zIndex: row.assignees.length - i,
            }}
          >
            {getInitials(a.name)}
          </div>
        );
      })}
      {row.assignees.length > 4 && (
        <div style={{
          ...avatarStyle,
          backgroundColor: "var(--bg-hover)", color: "var(--text-muted)",
          border: "2px solid var(--bg-card)", marginLeft: -6,
        }}>
          +{row.assignees.length - 4}
        </div>
      )}
    </div>
  );
}

function RowStatus({ row }: { row: GroupedTaskRow }) {
  if (row.assignees.length > 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
        {STATUS_COUNT_BADGES.filter(b => row.statusCounts[b.key] > 0).map(b => (
          <span key={b.key} style={{ fontSize: 9, fontWeight: 700, color: b.color, backgroundColor: b.bg, padding: "1px 6px", borderRadius: 4 }}>
            {row.statusCounts[b.key]} {b.label}
          </span>
        ))}
      </div>
    );
  }
  const sd = statusDisplay[row.overallStatus];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      color: sd.color,
      backgroundColor: sd.bg,
      padding: "3px 8px", borderRadius: 6,
    }}>
      {sd.label}
    </span>
  );
}

export default function GanttLeftPanel({
  panelRef, onScroll, rows, users, width, rowHeight, isTablet, hoveredIdx, setHoveredIdx, onTaskClick,
}: Props) {
  return (
    <div
      ref={panelRef}
      onScroll={onScroll}
      style={{
        width,
        minWidth: width,
        borderRight: "2px solid #e0d4f5",
        boxShadow: "4px 0 8px rgba(124,58,237,0.06)",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        backgroundColor: "var(--bg-card)",
        zIndex: 3,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "sticky",
          top: 0,
          zIndex: 4,
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-light)",
          minHeight: isTablet ? 58 : 68,
          alignItems: "flex-end",
        }}
      >
        <div style={{
          ...headerCellStyle,
          flex: 1,
          padding: isTablet ? "8px 10px" : "10px 16px",
          fontSize: isTablet ? 9 : 10,
        }}>
          Task Details
        </div>
        {!isTablet && (
          <div style={{
            ...headerCellStyle,
            width: 100,
            padding: "10px 8px",
            fontSize: 10,
            textAlign: "center",
          }}>
            Status
          </div>
        )}
      </div>

      {rows.length > 0 ? rows.map((row, idx) => {
        const isMulti = row.assignees.length > 1;
        return (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onTaskClick?.(row.tasks[0])}
            style={{
              display: "flex",
              alignItems: "center",
              height: rowHeight,
              borderBottom: "1px solid var(--border-table)",
              background: hoveredIdx === idx ? "var(--bg-hover)" : "var(--bg-card)",
              transition: "background 0.15s",
              cursor: onTaskClick ? "pointer" : undefined,
            }}
          >
            <div style={{ flex: 1, padding: isTablet ? "4px 10px" : "6px 16px", overflow: "hidden" }}>
              <div style={{
                fontSize: isTablet ? 11 : 13,
                fontWeight: 600,
                color: row.overallStatus === "in_progress" ? "#2563eb" : "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: isTablet ? 2 : 4,
              }}>
                {row.description}
              </div>
              <div className="d-flex align-items-center gap-2">
                <span style={{
                  backgroundColor: row.projectColor.bg,
                  color: row.projectColor.text,
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 4,
                  flexShrink: 0,
                }}>
                  {row.projectName}
                </span>

                <AssigneeAvatars row={row} users={users} />

                {isMulti ? (
                  <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600 }}>
                    {row.assignees.length} assigned
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                    {formatShortDate(row.latestEnd || row.earliestStart)}
                  </span>
                )}
              </div>
            </div>

            {!isTablet && (
              <div style={{ width: 100, textAlign: "center", flexShrink: 0, padding: "0 4px" }}>
                <RowStatus row={row} />
              </div>
            )}
          </div>
        );
      }) : (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>
          No tasks found for this period
        </div>
      )}
    </div>
  );
}
