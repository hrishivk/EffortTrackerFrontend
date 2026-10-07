import type { DayInfo } from "../../types";
import type { MonthHeader } from "./ganttRows";

type Props = {
  monthHeaders: MonthHeader[];
  rangeDays: DayInfo[];
  colWidth: number;
  isMobile: boolean;
  isTablet: boolean;
};

export default function GanttTimelineHeader({ monthHeaders, rangeDays, colWidth, isMobile, isTablet }: Props) {
  return (
    <>
      <div
        style={{
          display: "flex",
          position: "sticky",
          top: 0,
          zIndex: 4,
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
              fontSize: isMobile ? 9 : isTablet ? 10 : 11,
              fontWeight: 700,
              color: "#7c3aed",
              padding: isMobile ? "3px 0" : "4px 0",
              borderLeft: i > 0 ? "1px solid #e0d6ff" : undefined,
              letterSpacing: 0.5,
            }}
          >
            {mh.label}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          position: "sticky",
          top: isMobile ? 20 : 24,
          zIndex: 3,
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-light)",
          minHeight: isMobile ? 32 : isTablet ? 38 : 44,
        }}
      >
        {rangeDays.map((d, i) => (
          <div
            key={i}
            style={{
              width: colWidth,
              minWidth: colWidth,
              textAlign: "center",
              padding: isMobile ? "3px 0" : "6px 0",
              borderLeft: d.isFirstOfMonth ? "2px solid #d8b4fe" : "1px solid #f0f0f0",
              backgroundColor: d.isToday ? "#f5f3ff" : d.isWeekend ? "var(--bg-surface)" : undefined,
            }}
          >
            <div style={{
              fontSize: isMobile ? 8 : 10,
              fontWeight: 600,
              color: d.isToday ? "#7c3aed" : "var(--text-secondary)",
              letterSpacing: 0.3,
            }}>
              {String(d.day).padStart(2, "0")}
            </div>
            {!isMobile && (
              <div style={{
                fontSize: 8,
                fontWeight: 500,
                color: d.isToday ? "#7c3aed" : "var(--text-faint)",
                letterSpacing: 0.5,
              }}>
                {d.dowLabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function GanttGrid({ rangeDays, colWidth }: { rangeDays: DayInfo[]; colWidth: number }) {
  const todayIdx = rangeDays.findIndex(d => d.isToday);
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
      {rangeDays.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * colWidth,
            top: 0,
            bottom: 0,
            width: colWidth,
            borderLeft: d.isFirstOfMonth ? "2px solid #ede9fe" : "1px solid #f5f5f5",
            backgroundColor: d.isWeekend ? "rgba(249,250,251,0.5)" : undefined,
          }}
        />
      ))}
      {todayIdx >= 0 && (
        <div
          style={{
            position: "absolute",
            left: todayIdx * colWidth + colWidth / 2,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "#7c3aed",
            opacity: 0.3,
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}
