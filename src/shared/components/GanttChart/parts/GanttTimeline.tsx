import type { RefObject } from "react";
import type { ViewMode } from "../../../types/GanttChart";
import type { ColDef } from "./ganttColumns";
import type { MappedProject } from "./mapProjects";
import { ROW_HEIGHT } from "./ganttStyles";
import GanttProjectBar from "./GanttProjectBar";

export type MonthHeader = { label: string; span: number };

interface Props {
  scrollRef: RefObject<HTMLDivElement | null>;
  leftPanelRef: RefObject<HTMLDivElement | null>;
  viewMode: ViewMode;
  columns: ColDef[];
  monthHeaders: MonthHeader[];
  colWidth: number;
  projects: MappedProject[];
  headerLabel: string;
}

export default function GanttTimeline({
  scrollRef,
  leftPanelRef,
  viewMode,
  columns,
  monthHeaders,
  colWidth,
  projects,
  headerLabel,
}: Props) {
  const totalCols = columns.length;

  return (
    <div
      ref={scrollRef}
      className="gantt-scroll"
      onScroll={() => {
        if (scrollRef.current && leftPanelRef.current) leftPanelRef.current.scrollTop = scrollRef.current.scrollTop;
      }}
      style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}
    >
      <div style={{ minWidth: totalCols * colWidth }}>
        {viewMode !== "Year" && monthHeaders.length > 0 && (
          <div
            style={{
              display: "flex",
              position: "sticky",
              top: 0,
              zIndex: 5,
              backgroundColor: "var(--bg-surface)",
              borderBottom: "1px solid var(--border-light)",
              minHeight: 24,
            }}
          >
            {monthHeaders.map((mh, i) => (
              <div
                key={i}
                style={{
                  width: mh.span * colWidth,
                  minWidth: mh.span * colWidth,
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#7c3aed",
                  padding: "4px 0",
                  borderLeft: i > 0 ? "1px solid #e0d6ff" : undefined,
                  letterSpacing: 0.5,
                }}
              >
                {mh.label}
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: "flex",
            position: "sticky",
            top: viewMode !== "Year" ? 24 : 0,
            zIndex: 4,
            backgroundColor: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          {columns.map((col, i) => (
            <div
              key={i}
              style={{
                minWidth: colWidth,
                width: colWidth,
                textAlign: "center",
                padding: "6px 0",
                borderLeft: "1px solid #f0f0f0",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                {col.label}
              </div>
              {col.sublabel && (
                <div style={{ fontSize: 8, fontWeight: 500, color: "var(--text-faint)", letterSpacing: 0.5 }}>
                  {col.sublabel}
                </div>
              )}
            </div>
          ))}
        </div>

        {projects.length > 0 ? (
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
              {Array.from({ length: totalCols }, (_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: i * colWidth,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "var(--border-table)",
                  }}
                />
              ))}
            </div>

            {projects.map((p, idx) => (
              <div
                key={idx}
                className="gantt-row-hover"
                style={{
                  position: "relative",
                  height: ROW_HEIGHT,
                  borderBottom: "1px solid var(--border-table)",
                  transition: "background 0.15s",
                  zIndex: 1,
                }}
              >
                {p.bars.map((bar, bIdx) => (
                  <GanttProjectBar key={bIdx} bar={bar} colWidth={colWidth} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ padding: 40, color: "var(--text-faint)", fontSize: 13 }}
          >
            No projects found for {headerLabel}.
          </div>
        )}
      </div>
    </div>
  );
}
