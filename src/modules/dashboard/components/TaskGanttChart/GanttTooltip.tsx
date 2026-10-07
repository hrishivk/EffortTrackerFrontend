import type { GroupedTaskRow } from "../../types";
import { statusDisplay } from "../ganttConstants";
import { formatShortDate } from "../ganttUtils";

type Props = {
  row: GroupedTaskRow;
  pos: { x: number; y: number };
  screenWidth: number;
  isTablet: boolean;
};

export default function GanttTooltip({ row, pos, screenWidth, isTablet }: Props) {
  const isMulti = row.assignees.length > 1;
  return (
    <div
      style={{
        position: "fixed",
        left: Math.min(pos.x + 14, screenWidth - 260),
        top: pos.y - (isMulti ? 120 : 80),
        background: "var(--bg-card)",
        borderRadius: 12,
        padding: isTablet ? "10px 14px" : "14px 18px",
        fontSize: isTablet ? 11 : 12,
        zIndex: 9999,
        pointerEvents: "none",
        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        border: "1px solid var(--border-light)",
        minWidth: isTablet ? 200 : 240,
        maxWidth: isTablet ? 260 : 320,
      }}
    >
      <div className="d-flex align-items-center gap-2 mb-2">
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {row.description}
        </span>
      </div>
      <div style={{ color: "var(--text-muted)", marginBottom: 6 }}>
        Project: <span style={{ fontWeight: 600, color: row.projectColor.text }}>{row.projectName}</span>
      </div>
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
          {row.assignees.length} Assignee{row.assignees.length > 1 ? "s" : ""}:
        </span>
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          {row.assignees.slice(0, 5).map((a, i) => {
            const sd = statusDisplay[a.status];
            return (
              <div key={i} className="d-flex align-items-center gap-2">
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  backgroundColor: sd.color, display: "inline-block", flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{a.name}</span>
                <span style={{
                  fontSize: 9, fontWeight: 600, color: sd.color,
                  backgroundColor: sd.bg, padding: "1px 5px", borderRadius: 3, marginLeft: "auto",
                }}>
                  {sd.label}
                </span>
              </div>
            );
          })}
          {row.assignees.length > 5 && (
            <span style={{ fontSize: 10, color: "#9ca3af" }}>+{row.assignees.length - 5} more</span>
          )}
        </div>
      </div>
      <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>
        {formatShortDate(row.earliestStart)} &rarr; {formatShortDate(row.latestEnd)}
      </div>
    </div>
  );
}
