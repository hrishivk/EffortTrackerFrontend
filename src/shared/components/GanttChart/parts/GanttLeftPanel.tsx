import type { RefObject } from "react";
import type { GanttChartProps, ViewMode } from "../../../types/GanttChart";
import type { MappedProject } from "./mapProjects";
import { ROW_HEIGHT, statusConfig } from "./ganttStyles";

interface Props {
  panelRef: RefObject<HTMLDivElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  projects: MappedProject[];
  viewMode: ViewMode;
  colWidth: number;
  onProjectClick?: GanttChartProps["onProjectClick"];
}

export default function GanttLeftPanel({
  panelRef,
  scrollRef,
  projects,
  viewMode,
  colWidth,
  onProjectClick,
}: Props) {
  const setUnderline = (e: React.MouseEvent, value: string) => {
    if (onProjectClick) (e.target as HTMLElement).style.textDecoration = value;
  };

  return (
    <div
      ref={panelRef}
      onScroll={() => {
        if (panelRef.current && scrollRef.current) scrollRef.current.scrollTop = panelRef.current.scrollTop;
      }}
      style={{
        width: 240,
        minWidth: 240,
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
          position: "sticky",
          top: 0,
          zIndex: 4,
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-light)",
          padding: "10px 20px",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-muted)",
          letterSpacing: 1,
          textTransform: "uppercase",
          minHeight: viewMode !== "Year" ? 70 : colWidth > 50 ? 40 : 46,
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        Project Name & Status
      </div>

      {projects.length > 0 ? (
        projects.map((p, idx) => {
          const sc = statusConfig[p.status];
          return (
            <div
              key={idx}
              className="gantt-row-hover"
              style={{
                padding: "10px 20px",
                minHeight: ROW_HEIGHT,
                borderBottom: "1px solid var(--border-table)",
                transition: "background 0.15s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                onClick={() => onProjectClick?.(p.name, p.id)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: onProjectClick ? "#7c3aed" : "var(--text-primary)",
                  marginBottom: 4,
                  cursor: onProjectClick ? "pointer" : "default",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                onMouseEnter={(e) => setUnderline(e, "underline")}
                onMouseLeave={(e) => setUnderline(e, "none")}
              >
                {p.name}
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: sc.color,
                  backgroundColor: sc.bg,
                  padding: "2px 8px",
                  borderRadius: 4,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  alignSelf: "flex-start",
                }}
              >
                {p.status}
              </span>
            </div>
          );
        })
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>
          No projects found.
        </div>
      )}
    </div>
  );
}
