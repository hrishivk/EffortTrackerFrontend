import { useEffect, useRef, useState } from "react";
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
function mapProjects(
  projects: GanttChartProps["projects"],
  cols: ColDef[],
): GanttProject[] {
  const rangeStart = cols[0].start;
  const rangeEnd = cols[cols.length - 1].end;
  const totalCols = cols.length;

  return projects
    .map((p) => {
      const pStart = p.start_date ? new Date(p.start_date) : null;
      const pEnd = p.end_date ? new Date(p.end_date) : null;

      // skip if outside visible range
      if (pStart && pStart > rangeEnd) return null;
      if (pEnd && pEnd < rangeStart) return null;

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

      const ganttStatus = mapStatus(p.status, p.progress, p.end_date);

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
      } as GanttProject;
    })
    .filter(Boolean) as GanttProject[];
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
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const scrollRef = useRef<HTMLDivElement>(null);

  /* columns + sizing based on view mode */
  const columns =
    viewMode === "Week"
      ? weekColumns(currentYear, currentMonth)
      : viewMode === "Month"
        ? monthWeekColumns(currentYear, currentMonth)
        : yearColumns(currentYear);

  const totalCols = columns.length;
  const colWidth = viewMode === "Week" ? 50 : viewMode === "Month" ? 150 : 100;

  /* navigation */
  const goPrev = () => {
    if (viewMode === "Year") {
      setCurrentYear((y) => y - 1);
    } else {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    }
  };

  const goNext = () => {
    if (viewMode === "Year") {
      setCurrentYear((y) => y + 1);
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    }
  };

  const headerLabel =
    viewMode === "Year"
      ? `${currentYear}`
      : `${monthNames[currentMonth]} ${currentYear}`;

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

  /* reset scroll to start when view / period changes */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [viewMode, currentMonth, currentYear]);

  /* data */
  const ganttProjects = mapProjects(projects, columns);

  const filteredProjects =
    statusFilter === "All"
      ? ganttProjects
      : ganttProjects.filter((p) => p.status === statusFilter);

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

      {/* ─── Chart ─── */}
      <div ref={scrollRef} className="gantt-scroll" style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 240 + totalCols * colWidth }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#fafafa",
            }}
          >
            <div
              style={{
                width: 240,
                minWidth: 240,
                padding: "10px 20px",
                fontSize: 10,
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Project Name & Status
            </div>
            <div style={{ flex: 1, display: "flex" }}>
              {columns.map((col, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: colWidth,
                    textAlign: "center",
                    padding: "6px 0",
                    borderLeft: "1px solid #f0f0f0",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    {col.label}
                  </div>
                  {col.sublabel && (
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 500,
                        color: "#9ca3af",
                        letterSpacing: 0.5,
                      }}
                    >
                      {col.sublabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Project rows */}
          {filteredProjects.length > 0 ? (
            filteredProjects.map((p, idx) => {
              const sc = statusConfig[p.status];
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid #f5f5f5",
                    background: hoveredIdx === idx ? "#faf8ff" : "#fff",
                    transition: "background 0.15s",
                    minHeight: 56,
                  }}
                >
                  <div style={{ width: 240, minWidth: 240, padding: "10px 20px" }}>
                    <div
                      onClick={() => onProjectClick?.(p.name, p.id)}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: onProjectClick ? "#7c3aed" : "#111827",
                        marginBottom: 4,
                        cursor: onProjectClick ? "pointer" : "default",
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
                      }}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div style={{ flex: 1, position: "relative", height: 36 }}>
                    {/* grid lines */}
                    {Array.from({ length: totalCols }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: `${(i / totalCols) * 100}%`,
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
                      const leftPct = ((bar.startDay - 1) / totalCols) * 100;
                      const widthPct =
                        ((bar.endDay - bar.startDay + 1) / totalCols) * 100;
                      const overdueWidthPct = bar.overdueDays
                        ? (bar.overdueDays / totalCols) * 100
                        : 0;

                      return (
                        <div key={bIdx}>
                          {/* main bar */}
                          <div
                            style={{
                              position: "absolute",
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              top: 5,
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
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: bs.text,
                              }}
                            >
                              {bar.type === "completed"
                                ? "Done"
                                : `${bar.progress}%`}
                            </span>
                            {bar.type === "completed" && (
                              <CheckCircleOutlineIcon
                                sx={{
                                  fontSize: 14,
                                  color: "#fff",
                                  opacity: 0.9,
                                }}
                              />
                            )}
                          </div>

                          {/* overdue extension */}
                          {bar.overdueDays && bar.overdueDays > 0 && (
                            <>
                              <div
                                style={{
                                  position: "absolute",
                                  left: `${leftPct + widthPct}%`,
                                  width: `${overdueWidthPct}%`,
                                  top: 5,
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
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: "#dc2626",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  OVERDUE
                                </span>
                              </div>
                              {bar.hasFlag && (
                                <FlagIcon
                                  sx={{
                                    position: "absolute",
                                    left: `${leftPct + widthPct + overdueWidthPct}%`,
                                    top: 2,
                                    fontSize: 16,
                                    color: "#dc2626",
                                    zIndex: 3,
                                  }}
                                />
                              )}
                            </>
                          )}

                          {bar.hasFlag && !bar.overdueDays && (
                            <FlagIcon
                              sx={{
                                position: "absolute",
                                left: `${leftPct + widthPct}%`,
                                top: 2,
                                fontSize: 16,
                                color: "#dc2626",
                                zIndex: 3,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
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
