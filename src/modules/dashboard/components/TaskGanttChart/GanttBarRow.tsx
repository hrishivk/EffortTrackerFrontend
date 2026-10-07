import type { GroupedTaskRow, TaskGanttChartProps } from "../../types";
import { taskBarColors } from "../ganttConstants";
import { getInitials } from "../ganttUtils";
import { getBarLabel } from "./ganttRows";

type Props = {
  row: GroupedTaskRow;
  colWidth: number;
  rowHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseMove: (pos: { x: number; y: number }) => void;
  onTaskClick?: TaskGanttChartProps["onTaskClick"];
};

export default function GanttBarRow({
  row, colWidth, rowHeight, isMobile, isTablet, isHovered,
  onMouseEnter, onMouseLeave, onMouseMove, onTaskClick,
}: Props) {
  const barColor = taskBarColors[row.overallStatus];
  const barWidthPx = Math.max((row.endIdx - row.startIdx + 1) * colWidth - 4, 20);
  const isMulti = row.assignees.length > 1;
  const barLabel = getBarLabel(row, barWidthPx);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        height: rowHeight,
        borderBottom: "1px solid var(--border-table)",
        background: isHovered ? "var(--bg-hover)" : undefined,
        transition: "background 0.15s",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: row.startIdx * colWidth + 2,
          width: barWidthPx,
          top: isMobile ? (isMulti ? 8 : 12) : isTablet ? (isMulti ? 10 : 14) : (isMulti ? 12 : 18),
          height: isMobile ? (isMulti ? 24 : 22) : isTablet ? (isMulti ? 28 : 24) : (isMulti ? 32 : 28),
          borderRadius: 6,
          background: barColor.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingInline: 6,
          zIndex: 3,
          cursor: "pointer",
          boxShadow: isHovered
            ? "0 3px 12px rgba(0,0,0,0.18)"
            : "0 1px 4px rgba(0,0,0,0.08)",
          transition: "box-shadow 0.2s",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
        onMouseMove={(e) => onMouseMove({ x: e.clientX, y: e.clientY })}
        onClick={() => onTaskClick?.(row.tasks[0])}
      >
        {isMulti && barWidthPx >= 80 && !isMobile && (
          <div style={{ display: "flex", marginRight: 2 }}>
            {row.assignees.slice(0, 3).map((a, i) => (
              <div
                key={i}
                style={{
                  width: isTablet ? 14 : 18, height: isTablet ? 14 : 18, borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.3)",
                  color: "#fff", fontSize: isTablet ? 6 : 7, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginLeft: i > 0 ? -4 : 0,
                  border: "1.5px solid rgba(255,255,255,0.5)",
                }}
              >
                {getInitials(a.name)}
              </div>
            ))}
          </div>
        )}
        <span style={{ fontSize: isMobile ? 7 : isTablet ? 8 : 10, fontWeight: 700, color: barColor.text }}>
          {barLabel}
        </span>
        {row.overallStatus === "overdue" && barWidthPx >= 120 && (
          <span style={{ fontSize: 12, marginLeft: 2 }}>&#9888;</span>
        )}
      </div>

      {isMulti && (
        <div style={{
          position: "absolute",
          left: row.startIdx * colWidth + 2,
          width: barWidthPx,
          top: isMobile ? 34 : isTablet ? 40 : 48,
          height: 3,
          borderRadius: 2,
          backgroundColor: "rgba(0,0,0,0.06)",
          zIndex: 3,
        }}>
          <div style={{
            width: `${(row.statusCounts.completed / row.assignees.length) * 100}%`,
            height: "100%",
            borderRadius: 2,
            backgroundColor: "#7c3aed",
            transition: "width 0.3s",
          }} />
        </div>
      )}
    </div>
  );
}
