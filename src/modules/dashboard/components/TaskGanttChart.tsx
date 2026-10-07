import { useState, useMemo } from "react";
import SpinLoader from "../../../presentation/SpinLoader";
import type { TaskGanttChartProps } from "../types";
import { computeGanttRange, groupGanttRows, buildMonthHeaders } from "./TaskGanttChart/ganttRows";
import { useGanttLayout } from "./TaskGanttChart/useGanttLayout";
import { useGanttScroll } from "./TaskGanttChart/useGanttScroll";
import GanttToolbar from "./TaskGanttChart/GanttToolbar";
import GanttLeftPanel from "./TaskGanttChart/GanttLeftPanel";
import GanttTimelineHeader, { GanttGrid } from "./TaskGanttChart/GanttTimelineHeader";
import GanttBarRow from "./TaskGanttChart/GanttBarRow";
import GanttTooltip from "./TaskGanttChart/GanttTooltip";
import GanttFooter from "./TaskGanttChart/GanttFooter";

export default function TaskGanttChart({
  tasks,
  users,
  projects,
  projectColorMap,
  getUserName,
  loading,
  onTaskClick,
  hideLeftPanel,
}: TaskGanttChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rangeOffset, setRangeOffset] = useState(0);
  const [extraBefore, setExtraBefore] = useState(1);
  const [extraAfter, setExtraAfter] = useState(1);

  const { screenWidth, isMobile, isTablet, colWidth, leftPanelWidth, rowHeight } = useGanttLayout(zoomLevel);

  const { rangeStart, rangeDays, rangeLabel } = useMemo(
    () => computeGanttRange(tasks, rangeOffset, extraBefore, extraAfter),
    [tasks, rangeOffset, extraBefore, extraAfter],
  );

  const totalDays = rangeDays.length;

  const groupedRows = useMemo(
    () => groupGanttRows(tasks, rangeStart, totalDays, projectColorMap, getUserName),
    [tasks, rangeStart, totalDays, projectColorMap, getUserName, users],
  );

  const monthHeaders = useMemo(() => buildMonthHeaders(rangeDays), [rangeDays]);

  const { timelineRef, leftPanelRef, handleTimelineScroll, handleLeftScroll } = useGanttScroll({
    groupedRows, rangeDays, colWidth, extraBefore, setExtraBefore, setExtraAfter,
  });

  const changeRange = (next: (o: number) => number) => {
    setRangeOffset(next);
    setExtraBefore(1);
    setExtraAfter(1);
  };

  if (loading) {
    return <SpinLoader isLoading />;
  }

  const hoveredRow = hoveredIdx !== null ? groupedRows[hoveredIdx] : undefined;

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: isMobile ? 10 : 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
      <GanttToolbar
        rangeLabel={rangeLabel}
        projects={projects}
        projectColorMap={projectColorMap}
        isMobile={isMobile}
        isTablet={isTablet}
        onPrev={() => changeRange(o => o - 1)}
        onToday={() => changeRange(() => 0)}
        onNext={() => changeRange(o => o + 1)}
      />

      <div style={{ display: "flex", maxHeight: isMobile ? 350 : isTablet ? 420 : 500, overflow: "hidden" }}>
        {!hideLeftPanel && !isMobile && (
          <GanttLeftPanel
            panelRef={leftPanelRef}
            onScroll={handleLeftScroll}
            rows={groupedRows}
            users={users}
            width={leftPanelWidth}
            rowHeight={rowHeight}
            isTablet={isTablet}
            hoveredIdx={hoveredIdx}
            setHoveredIdx={setHoveredIdx}
            onTaskClick={onTaskClick}
          />
        )}

        <div
          ref={timelineRef}
          onScroll={handleTimelineScroll}
          className="gantt-scroll"
          style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}
        >
          <div style={{ minWidth: totalDays * colWidth }}>
            <GanttTimelineHeader
              monthHeaders={monthHeaders}
              rangeDays={rangeDays}
              colWidth={colWidth}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            <div style={{ position: "relative" }}>
              <GanttGrid rangeDays={rangeDays} colWidth={colWidth} />

              {groupedRows.map((row, idx) => (
                <GanttBarRow
                  key={idx}
                  row={row}
                  colWidth={colWidth}
                  rowHeight={rowHeight}
                  isMobile={isMobile}
                  isTablet={isTablet}
                  isHovered={hoveredIdx === idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => { setHoveredIdx(null); setTooltipPos(null); }}
                  onMouseMove={setTooltipPos}
                  onTaskClick={onTaskClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {hoveredRow && tooltipPos && !isMobile && (
        <GanttTooltip row={hoveredRow} pos={tooltipPos} screenWidth={screenWidth} isTablet={isTablet} />
      )}

      <GanttFooter zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
    </div>
  );
}
