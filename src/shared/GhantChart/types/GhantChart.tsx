import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  FormControl,
  MenuItem,
  Select,
} from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FlagIcon from "@mui/icons-material/Flag";
import type { GanttChartProps, GanttProject, ProjectStatus, ViewMode } from ".";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function getDayOfWeek(y: number, m: number, d: number) {
  return new Date(y, m, d).getDay();
}

function mapStatus(status: string, progress: number, endDate?: string): ProjectStatus {
  if (progress >= 100) return "COMPLETED";
  if (status?.toUpperCase() === "COMPLETED") return "COMPLETED";
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today && progress < 100) return "DELAYED";
  }
  if (status?.toUpperCase() === "ON HOLD") return "DELAYED";
  return "ON TRACK";
}

/* ─── Column definitions per view mode ─── */
interface ColDef {
  label: string;
  sublabel?: string;
  start: Date;
  end: Date;
}

/** Week view → one column per day in the month */
function weekColumns(year: number, month: number): ColDef[] {
  const total = getDaysInMonth(year, month);
  return Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    return {
      label: String(d),
      sublabel: dayNames[getDayOfWeek(year, month, d)],
      start: new Date(year, month, d),
      end: new Date(year, month, d, 23, 59, 59, 999),
    };
  });
}

/** Month view → one column per week in the month */
function monthWeekColumns(year: number, month: number): ColDef[] {
  const totalDays = getDaysInMonth(year, month);
  const cols: ColDef[] = [];
  let ws = 1;
  let wn = 1;
  while (ws <= totalDays) {
    const we = Math.min(ws + 6, totalDays);
    cols.push({
      label: `Week ${wn}`,
      sublabel: `${ws}–${we} ${monthShort[month]}`,
      start: new Date(year, month, ws),
      end: new Date(year, month, we, 23, 59, 59, 999),
    });
    ws = we + 1;
    wn++;
  }
  return cols;
}

/** Year view → one column per month in the year */
function yearColumns(year: number): ColDef[] {
  return Array.from({ length: 12 }, (_, i) => ({
    label: monthShort[i],
    start: new Date(year, i, 1),
    end: new Date(year, i, getDaysInMonth(year, i), 23, 59, 59, 999),
  }));
}

/* ─── Map projects to bars based on columns ─── */
type MappedProject = GanttProject & { rawStart: Date | null };

function mapProjects(
  projects: GanttChartProps["projects"],
  cols: ColDef[],
): MappedProject[] {
  const rangeStart = cols[0].start;
  const rangeEnd = cols[cols.length - 1].end;
  const totalCols = cols.length;

  return projects.map((p) => {
    const pStart = p.start_date ? new Date(p.start_date) : null;
    const pEnd = p.end_date ? new Date(p.end_date) : null;
    const ganttStatus = mapStatus(p.status, p.progress, p.end_date);

    // Project entirely outside visible range — show in list with no bar
    if ((pStart && pStart > rangeEnd) || (pEnd && pEnd < rangeStart)) {
      return {
        id: p.id,
        name: p.name,
        status: ganttStatus,
        bars: [],
        rawStart: pStart,
      };
    }

    // find start column (1-based)
    let startCol = 1;
    if (pStart) {
      const idx = cols.findIndex((c) => pStart <= c.end);
      startCol = idx === -1 ? 1 : idx + 1;
    }

    // find end column (1-based)
    let endCol = totalCols;
    if (pEnd) {
      for (let i = totalCols - 1; i >= 0; i--) {
        if (pEnd >= cols[i].start) {
          endCol = i + 1;
          break;
        }
      }
    }

    // overdue columns
    let overdueCols = 0;
    let hasFlag = false;
    if (pEnd && ganttStatus === "DELAYED") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (today > pEnd) {
        hasFlag = true;
        for (let i = endCol; i < totalCols; i++) {
          if (today >= cols[i].start) overdueCols++;
          else break;
        }
      }
    }

    const barType =
      ganttStatus === "COMPLETED"
        ? "completed"
        : ganttStatus === "DELAYED"
          ? "delayed"
          : "active";

    return {
      id: p.id,
      name: p.name,
      status: ganttStatus,
      bars: [
        {
          startDay: startCol,
          endDay: endCol,
          label: ganttStatus === "COMPLETED" ? "Done" : `${p.progress}%`,
          progress: p.progress,
          type: barType,
          overdueDays: overdueCols > 0 ? overdueCols : undefined,
          hasFlag,
        },
      ],
      rawStart: pStart,
    };
  });
}

/* ─── Styles ─── */
const statusConfig: Record<ProjectStatus, { color: string; bg: string }> = {
  "ON TRACK": { color: "#7c3aed", bg: "#f3e8ff" },
  COMPLETED: { color: "#9333ea", bg: "#f5f3ff" },
  DELAYED: { color: "#6d28d9", bg: "#ede9fe" },
};

const barStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "linear-gradient(90deg, #9333ea, #7c3aed)", text: "#fff" },
  completed: { bg: "linear-gradient(90deg, #9333ea, #7c3aed)", text: "#fff" },
  delayed: { bg: "linear-gradient(90deg, #9333ea, #7c3aed)", text: "#fff" },
  green: { bg: "linear-gradient(90deg, #9333ea, #7c3aed)", text: "#fff" },
};

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontSize: 13,
    "& fieldset": { borderColor: "#e5e7eb" },
    "&.Mui-focused fieldset": {
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiSelect-select": { padding: "6px 12px" },
};

/* ─── Component ─── */
export default function GanttChart({ projects, onProjectClick }: GanttChartProps) {
  const now = new Date();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: extra months before/after the data range
  const [extraBefore, setExtraBefore] = useState(1);
  const [extraAfter, setExtraAfter] = useState(1);
  const [visibleMonth, setVisibleMonth] = useState(now.getMonth());
  const [visibleYear, setVisibleYear] = useState(now.getFullYear());
  const isExtendingRef = useRef(false);
  const scrollAdjustRef = useRef(0);
  const hasInitialScrolled = useRef(false);

  // Compute base date range from project data (like TaskGanttChart)
  const baseRange = useMemo(() => {
    let earliest: Date | null = null;
    let latest: Date | null = null;
    for (const p of projects) {
      if (p.start_date) {
        const d = new Date(p.start_date);
        d.setHours(0, 0, 0, 0);
        if (!earliest || d < earliest) earliest = new Date(d);
      }
      if (p.end_date) {
        const d = new Date(p.end_date);
        d.setHours(0, 0, 0, 0);
        if (!latest || d > latest) latest = new Date(d);
      }
    }
    if (!earliest && !latest) {
      earliest = new Date(now.getFullYear(), now.getMonth(), 1);
      latest = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (!earliest) {
      earliest = new Date(latest!.getFullYear(), latest!.getMonth() - 1, 1);
    } else if (!latest) {
      latest = new Date(earliest.getFullYear(), earliest.getMonth() + 2, 0);
    }
    return {
      startYear: earliest!.getFullYear(),
      startMonth: earliest!.getMonth(),
      endYear: latest!.getFullYear(),
      endMonth: latest!.getMonth(),
    };
  }, [projects]);

  // Build month range from data range + extra months for infinite scroll
  const monthRange = useMemo(() => {
    if (viewMode === "Year") return [];
    const range: { year: number; month: number }[] = [];
    const start = new Date(baseRange.startYear, baseRange.startMonth - extraBefore, 1);
    const end = new Date(baseRange.endYear, baseRange.endMonth + extraAfter, 1);
    const cur = new Date(start);
    while (cur <= end) {
      range.push({ year: cur.getFullYear(), month: cur.getMonth() });
      cur.setMonth(cur.getMonth() + 1);
    }
    return range;
  }, [baseRange, extraBefore, extraAfter, viewMode]);

  /* columns + sizing based on view mode */
  const columns =
    viewMode === "Year"
      ? yearColumns(currentYear)
      : monthRange.flatMap(({ year, month }) =>
          viewMode === "Week" ? weekColumns(year, month) : monthWeekColumns(year, month),
        );

  const totalCols = columns.length;
  const colWidth = viewMode === "Week" ? 50 : viewMode === "Month" ? 150 : 100;

  /* month headers for multi-month timeline */
  const monthHeaderList = useMemo(() => {
    if (viewMode === "Year") return [];
    return monthRange.map(({ year, month }) => ({
      label: `${monthNames[month]} ${year}`,
      span:
        viewMode === "Week"
          ? weekColumns(year, month).length
          : monthWeekColumns(year, month).length,
    }));
  }, [viewMode, monthRange]);

  /* navigation — scroll to previous/next month */
  const goPrev = () => {
    if (viewMode === "Year") {
      setCurrentYear((y) => y - 1);
      return;
    }
    const prev = new Date(visibleYear, visibleMonth - 1, 1);
    const targetMonth = prev.getMonth();
    const targetYear = prev.getFullYear();

    // Extend range if target is before the start
    const first = monthRange[0];
    if (first && (targetYear < first.year || (targetYear === first.year && targetMonth < first.month))) {
      setExtraBefore((e) => e + 1);
    }

    let colsBefore = 0;
    for (const { year, month } of monthRange) {
      if (year === targetYear && month === targetMonth) break;
      colsBefore +=
        viewMode === "Week"
          ? weekColumns(year, month).length
          : monthWeekColumns(year, month).length;
    }
    scrollRef.current?.scrollTo({ left: colsBefore * colWidth, behavior: "smooth" });
    setVisibleMonth(targetMonth);
    setVisibleYear(targetYear);
  };

  const goNext = () => {
    if (viewMode === "Year") {
      setCurrentYear((y) => y + 1);
      return;
    }
    const next = new Date(visibleYear, visibleMonth + 1, 1);
    const targetMonth = next.getMonth();
    const targetYear = next.getFullYear();

    // Extend range if target is after the end
    const last = monthRange[monthRange.length - 1];
    if (last && (targetYear > last.year || (targetYear === last.year && targetMonth > last.month))) {
      setExtraAfter((e) => e + 1);
    }

    let colsBefore = 0;
    for (const { year, month } of monthRange) {
      if (year === targetYear && month === targetMonth) break;
      colsBefore +=
        viewMode === "Week"
          ? weekColumns(year, month).length
          : monthWeekColumns(year, month).length;
    }
    scrollRef.current?.scrollTo({ left: colsBefore * colWidth, behavior: "smooth" });
    setVisibleMonth(targetMonth);
    setVisibleYear(targetYear);
  };

  // Reset extra months when view mode changes
  useEffect(() => {
    setExtraBefore(1);
    setExtraAfter(1);
    hasInitialScrolled.current = false;
  }, [viewMode]);

  const headerLabel =
    viewMode === "Year"
      ? `${currentYear}`
      : `${monthNames[visibleMonth]} ${visibleYear}`;

  /* mouse-wheel → horizontal scroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  /* Infinite scroll — extend range when reaching edges */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || viewMode === "Year") return;
    const handleScroll = () => {
      if (isExtendingRef.current) return;
      const threshold = 200;

      // Near right edge → append next month
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - threshold) {
        isExtendingRef.current = true;
        setExtraAfter((prev) => prev + 1);
        setTimeout(() => { isExtendingRef.current = false; }, 200);
      }

      // Near left edge → prepend previous month
      if (el.scrollLeft <= threshold && el.scrollLeft > 0) {
        isExtendingRef.current = true;
        const firstInRange = monthRange[0];
        if (firstInRange) {
          const prevDate = new Date(firstInRange.year, firstInRange.month - 1, 1);
          const addedCols =
            viewMode === "Week"
              ? weekColumns(prevDate.getFullYear(), prevDate.getMonth()).length
              : monthWeekColumns(prevDate.getFullYear(), prevDate.getMonth()).length;
          scrollAdjustRef.current = addedCols * colWidth;
        }
        setExtraBefore((prev) => prev + 1);
      }

      // Update visible month from scroll position
      const centerX = el.scrollLeft + el.clientWidth / 2;
      let acc = 0;
      for (const { year, month } of monthRange) {
        const cols =
          viewMode === "Week"
            ? weekColumns(year, month).length
            : monthWeekColumns(year, month).length;
        acc += cols * colWidth;
        if (centerX < acc) {
          setVisibleMonth(month);
          setVisibleYear(year);
          break;
        }
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [monthRange, viewMode, colWidth]);

  /* Preserve scroll position when months are prepended */
  useLayoutEffect(() => {
    if (scrollAdjustRef.current > 0 && scrollRef.current) {
      scrollRef.current.scrollLeft += scrollAdjustRef.current;
      scrollAdjustRef.current = 0;
      setTimeout(() => { isExtendingRef.current = false; }, 200);
    }
  }, [extraBefore]);

  /* data */
  const ganttProjects = mapProjects(projects, columns);

  const filteredProjects = (
    statusFilter === "All"
      ? ganttProjects
      : ganttProjects.filter((p) => p.status === statusFilter)
  )
    // Sort by actual start date (earliest project appears first)
    .sort((a, b) => {
      const aDate = a.rawStart?.getTime() ?? Infinity;
      const bDate = b.rawStart?.getTime() ?? Infinity;
      return aDate - bDate;
    });

  // Auto-scroll to the earliest project's start date (1 col before it)
  useEffect(() => {
    if (!scrollRef.current || viewMode === "Year" || hasInitialScrolled.current) return;
    if (filteredProjects.length === 0) return;
    hasInitialScrolled.current = true;

    // Find the earliest raw start date across filtered projects
    const earliest = filteredProjects.reduce<Date | null>((min, p) => {
      if (!p.rawStart) return min;
      return !min || p.rawStart < min ? p.rawStart : min;
    }, null);

    if (!earliest) return;

    const eMonth = earliest.getMonth();
    const eYear = earliest.getFullYear();

    // Calculate column offset to that date
    let colsBefore = 0;
    for (const { year, month } of monthRange) {
      if (year === eYear && month === eMonth) {
        // Add day offset within the month (Week view = day columns)
        if (viewMode === "Week") {
          colsBefore += Math.max(0, earliest.getDate() - 2); // 1 day before start
        }
        break;
      }
      colsBefore +=
        viewMode === "Week"
          ? weekColumns(year, month).length
          : monthWeekColumns(year, month).length;
    }

    scrollRef.current.scrollLeft = colsBefore * colWidth;
    setVisibleMonth(eMonth);
    setVisibleYear(eYear);
  }, [filteredProjects, monthRange, viewMode, colWidth]);

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
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      {/* ─── Toolbar ─── */}
      <div
        className="d-flex align-items-center justify-content-between flex-wrap gap-2"
        style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <FormControl size="small" sx={{ minWidth: 110, ...selectSx }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              renderValue={(val) => `Status: ${val}`}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="ON TRACK">On Track</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="DELAYED">Delayed</MenuItem>
            </Select>
          </FormControl>

          <div
            className="d-flex"
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {(["Week", "Month", "Year"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="btn btn-sm"
                style={{
                  borderRadius: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "5px 14px",
                  backgroundColor: viewMode === mode ? "#f3f4f6" : "#fff",
                  color: viewMode === mode ? "#111827" : "#6b7280",
                  border: "none",
                  borderRight: mode !== "Year" ? "1px solid #e5e7eb" : "none",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={goPrev}
            className="btn btn-sm p-1"
            style={{ border: "1px solid #e5e7eb", borderRadius: 8, lineHeight: 1 }}
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: 18, color: "#6b7280" }} />
          </button>
          <button
            className="btn btn-sm text-white d-flex align-items-center gap-1"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #9333ea)",
              borderRadius: 8,
              padding: "5px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 16 }} />
            {headerLabel}
          </button>
          <button
            onClick={goNext}
            className="btn btn-sm p-1"
            style={{ border: "1px solid #e5e7eb", borderRadius: 8, lineHeight: 1 }}
          >
            <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "#6b7280" }} />
          </button>
        </div>
      </div>

      {/* ─── Chart (split panel like TaskGanttChart) ─── */}
      <div style={{ display: "flex", maxHeight: 500, overflow: "hidden" }}>

        {/* Fixed Left Panel — Project Names */}
        <div
          ref={leftPanelRef}
          onScroll={() => { if (leftPanelRef.current && scrollRef.current) scrollRef.current.scrollTop = leftPanelRef.current.scrollTop; }}
          style={{
            width: 240,
            minWidth: 240,
            borderRight: "2px solid #e0d4f5",
            boxShadow: "4px 0 8px rgba(124,58,237,0.06)",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            backgroundColor: "#fff",
            zIndex: 3,
          }}
        >
          {/* Left Header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 4,
              backgroundColor: "#fafafa",
              borderBottom: "1px solid #e5e7eb",
              padding: "10px 20px",
              fontSize: 10,
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: 1,
              textTransform: "uppercase",
              minHeight: viewMode !== "Year" ? 70 : colWidth > 50 ? 40 : 46,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            Project Name & Status
          </div>

          {/* Left Rows */}
          {filteredProjects.length > 0 ? (
            filteredProjects.map((p, idx) => {
              const sc = statusConfig[p.status];
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    padding: "10px 20px",
                    minHeight: 56,
                    borderBottom: "1px solid #f5f5f5",
                    background: hoveredIdx === idx ? "#faf8ff" : "#fff",
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
                      color: onProjectClick ? "#7c3aed" : "#111827",
                      marginBottom: 4,
                      cursor: onProjectClick ? "pointer" : "default",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    onMouseEnter={(e) => {
                      if (onProjectClick)
                        (e.target as HTMLElement).style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      if (onProjectClick)
                        (e.target as HTMLElement).style.textDecoration = "none";
                    }}
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
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              No projects found.
            </div>
          )}
        </div>

        {/* Right Scrollable Timeline */}
        <div
          ref={scrollRef}
          className="gantt-scroll"
          onScroll={() => { if (scrollRef.current && leftPanelRef.current) leftPanelRef.current.scrollTop = scrollRef.current.scrollTop; }}
          style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}
        >
          <div style={{ minWidth: totalCols * colWidth }}>
            {/* Month Header Row (multi-month) */}
            {viewMode !== "Year" && monthHeaderList.length > 0 && (
              <div
                style={{
                  display: "flex",
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                  backgroundColor: "#f3f0ff",
                  borderBottom: "1px solid #e5e7eb",
                  minHeight: 24,
                }}
              >
                {monthHeaderList.map((mh, i) => (
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
            {/* Timeline Header */}
            <div
              style={{
                display: "flex",
                position: "sticky",
                top: viewMode !== "Year" ? 24 : 0,
                zIndex: 2,
                backgroundColor: "#fafafa",
                borderBottom: "1px solid #e5e7eb",
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
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    {col.label}
                  </div>
                  {col.sublabel && (
                    <div style={{ fontSize: 8, fontWeight: 500, color: "#9ca3af", letterSpacing: 0.5 }}>
                      {col.sublabel}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Timeline Rows */}
            {filteredProjects.length > 0 ? (
              filteredProjects.map((p, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    position: "relative",
                    height: 56,
                    borderBottom: "1px solid #f5f5f5",
                    background: hoveredIdx === idx ? "#faf8ff" : "#fff",
                    transition: "background 0.15s",
                  }}
                >
                  {/* grid lines */}
                  {Array.from({ length: totalCols }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: i * colWidth,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: "#f5f5f5",
                      }}
                    />
                  ))}

                  {/* bars */}
                  {p.bars.map((bar, bIdx) => {
                    const bs = barStyles[bar.type];
                    const leftPx = (bar.startDay - 1) * colWidth;
                    const widthPx = (bar.endDay - bar.startDay + 1) * colWidth;
                    const overdueWidthPx = bar.overdueDays ? bar.overdueDays * colWidth : 0;

                    return (
                      <div key={bIdx}>
                        {/* main bar */}
                        <div
                          style={{
                            position: "absolute",
                            left: leftPx,
                            width: widthPx,
                            top: 15,
                            height: 26,
                            borderRadius: 6,
                            background: bs.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                            paddingInline: 8,
                            zIndex: 2,
                            boxShadow:
                              hoveredIdx === idx
                                ? "0 3px 12px rgba(0,0,0,0.15)"
                                : "0 1px 4px rgba(0,0,0,0.08)",
                            transition: "box-shadow 0.2s",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 600, color: bs.text }}>
                            {bar.type === "completed" ? "Done" : `${bar.progress}%`}
                          </span>
                          {bar.type === "completed" && (
                            <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#fff", opacity: 0.9 }} />
                          )}
                        </div>

                        {/* overdue extension */}
                        {bar.overdueDays && bar.overdueDays > 0 && (
                          <>
                            <div
                              style={{
                                position: "absolute",
                                left: leftPx + widthPx,
                                width: overdueWidthPx,
                                top: 15,
                                height: 26,
                                borderRadius: "0 6px 6px 0",
                                border: "2px dashed #ef4444",
                                borderLeft: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1,
                                backgroundColor: "#fef2f2",
                              }}
                            >
                              <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", letterSpacing: 0.5 }}>
                                OVERDUE
                              </span>
                            </div>
                            {bar.hasFlag && (
                              <FlagIcon sx={{ position: "absolute", left: leftPx + widthPx + overdueWidthPx, top: 12, fontSize: 16, color: "#dc2626", zIndex: 3 }} />
                            )}
                          </>
                        )}

                        {bar.hasFlag && !bar.overdueDays && (
                          <FlagIcon sx={{ position: "absolute", left: leftPx + widthPx, top: 12, fontSize: 16, color: "#dc2626", zIndex: 3 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div
                className="d-flex align-items-center justify-content-center"
                style={{ padding: 40, color: "#9ca3af", fontSize: 13 }}
              >
                No projects found for {headerLabel}.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div
        className="d-flex align-items-center justify-content-between flex-wrap"
        style={{
          padding: "14px 20px",
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#fafafa",
        }}
      >
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: "#7c3aed",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Active Projects</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: "#9333ea",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Completed</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "2px solid #ef4444",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Delayed / At Risk</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-4">
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Total Projects:{" "}
            <strong style={{ color: "#111827" }}>{filteredProjects.length}</strong>
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Average Completion:{" "}
            <strong style={{ color: "#111827" }}>{avgProgress}%</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
