import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { GanttChartProps, ViewMode } from "../../types/GanttChart";
import {
  colWidthFor,
  colsBeforeMonth,
  colsInMonth,
  computeBaseRange,
  monthColumns,
  monthNames,
  yearColumns,
} from "./parts/ganttColumns";
import { mapProjects } from "./parts/mapProjects";
import { useTimelineScroll } from "./parts/useTimelineScroll";
import GanttToolbar from "./parts/GanttToolbar";
import GanttLeftPanel from "./parts/GanttLeftPanel";
import GanttTimeline from "./parts/GanttTimeline";
import GanttFooter from "./parts/GanttFooter";

function GanttChart({ projects, onProjectClick }: GanttChartProps) {
  const now = useRef(new Date()).current;
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const colWidth = colWidthFor(viewMode);

  const baseRange = useMemo(() => computeBaseRange(projects, now), [projects, now]);

  const {
    scrollRef,
    leftPanelRef,
    monthRange,
    visibleMonth,
    visibleYear,
    showMonth,
    extendBefore,
    extendAfter,
    hasInitialScrolled,
  } = useTimelineScroll(viewMode, baseRange, colWidth, now);

  const columns = useMemo(() =>
    viewMode === "Year"
      ? yearColumns(currentYear)
      : monthRange.flatMap(({ year, month }) => monthColumns(viewMode, year, month)),
    [viewMode, currentYear, monthRange],
  );

  const monthHeaders = useMemo(() => {
    if (viewMode === "Year") return [];
    return monthRange.map(({ year, month }) => ({
      label: `${monthNames[month]} ${year}`,
      span: colsInMonth(viewMode, year, month),
    }));
  }, [viewMode, monthRange]);

  /** Moves one year (Year view) or one month, growing the range if the target is outside it. */
  const goStep = (delta: 1 | -1) => {
    if (viewMode === "Year") {
      setCurrentYear((y) => y + delta);
      return;
    }
    const target = new Date(visibleYear, visibleMonth + delta, 1);
    const targetMonth = target.getMonth();
    const targetYear = target.getFullYear();

    if (delta < 0) {
      const first = monthRange[0];
      if (first && (targetYear < first.year || (targetYear === first.year && targetMonth < first.month))) {
        extendBefore();
      }
    } else {
      const last = monthRange[monthRange.length - 1];
      if (last && (targetYear > last.year || (targetYear === last.year && targetMonth > last.month))) {
        extendAfter();
      }
    }

    const colsBefore = colsBeforeMonth(monthRange, viewMode, targetYear, targetMonth);
    showMonth(targetYear, targetMonth, colsBefore * colWidth, true);
  };

  const headerLabel =
    viewMode === "Year"
      ? `${currentYear}`
      : `${monthNames[visibleMonth]} ${visibleYear}`;

  const ganttProjects = useMemo(() => mapProjects(projects, columns), [projects, columns]);

  const filteredProjects = useMemo(() => {
    const list = statusFilter === "All"
      ? ganttProjects
      : ganttProjects.filter((p) => p.status === statusFilter);
    return list.slice().sort((a, b) => {
      const aDate = a.rawStart?.getTime() ?? Infinity;
      const bDate = b.rawStart?.getTime() ?? Infinity;
      return aDate - bDate;
    });
  }, [ganttProjects, statusFilter]);

  useEffect(() => {
    if (!scrollRef.current || viewMode === "Year" || hasInitialScrolled.current) return;
    if (filteredProjects.length === 0) return;
    hasInitialScrolled.current = true;

    const earliest = filteredProjects.reduce<Date | null>((min, p) => {
      if (!p.rawStart) return min;
      return !min || p.rawStart < min ? p.rawStart : min;
    }, null);

    if (!earliest) return;

    const eMonth = earliest.getMonth();
    const eYear = earliest.getFullYear();

    let colsBefore = colsBeforeMonth(monthRange, viewMode, eYear, eMonth);
    const inRange = monthRange.some(({ year, month }) => year === eYear && month === eMonth);
    if (inRange && viewMode === "Week") {
      colsBefore += Math.max(0, earliest.getDate() - 2);
    }

    showMonth(eYear, eMonth, colsBefore * colWidth, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects, monthRange, viewMode]);

  const avgProgress =
    filteredProjects.length > 0
      ? Math.round(
          filteredProjects.reduce((s, p) => s + (p.bars[0]?.progress || 0), 0) /
            filteredProjects.length,
        )
      : 0;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 16,
        border: "1px solid var(--border-light)",
        overflow: "hidden",
      }}
    >
      <GanttToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        headerLabel={headerLabel}
        onPrev={() => goStep(-1)}
        onNext={() => goStep(1)}
      />

      <div style={{ display: "flex", maxHeight: 500, overflow: "hidden" }}>
        <GanttLeftPanel
          panelRef={leftPanelRef}
          scrollRef={scrollRef}
          projects={filteredProjects}
          viewMode={viewMode}
          colWidth={colWidth}
          onProjectClick={onProjectClick}
        />
        <GanttTimeline
          scrollRef={scrollRef}
          leftPanelRef={leftPanelRef}
          viewMode={viewMode}
          columns={columns}
          monthHeaders={monthHeaders}
          colWidth={colWidth}
          projects={filteredProjects}
          headerLabel={headerLabel}
        />
      </div>

      <GanttFooter total={filteredProjects.length} avgProgress={avgProgress} />
    </div>
  );
}

export default memo(GanttChart);
