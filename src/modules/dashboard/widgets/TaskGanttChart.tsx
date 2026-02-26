import { useState, useRef, useMemo, useEffect, useLayoutEffect } from "react";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { CircularProgress } from "@mui/material";
import type { taskList } from "../../user/types";
import type { formUserData } from "../../../shared/User/types";

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const monthAbbr = [
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC",
];
const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PROJECT_COLORS = [
  { bg: "#dbeafe", text: "#2563eb", dot: "#2563eb" },
  { bg: "#dcfce7", text: "#16a34a", dot: "#16a34a" },
  { bg: "#fae8ff", text: "#a855f7", dot: "#a855f7" },
  { bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" },
  { bg: "#fef3c7", text: "#d97706", dot: "#d97706" },
  { bg: "#e0e7ff", text: "#4f46e5", dot: "#4f46e5" },
  { bg: "#ccfbf1", text: "#0d9488", dot: "#0d9488" },
  { bg: "#fce7f3", text: "#db2777", dot: "#db2777" },
];

const avatarColors = [
  "#7c3aed","#2563eb","#16a34a","#dc2626",
  "#d97706","#db2777","#0d9488","#4f46e5",
];

type TaskBarStatus = "completed" | "in_progress" | "overdue" | "pending";

const taskBarColors: Record<TaskBarStatus, { bg: string; text: string }> = {
  completed:   { bg: "linear-gradient(90deg, #9333ea, #a855f7)", text: "#fff" },
  in_progress: { bg: "linear-gradient(90deg, #7c3aed, #9333ea)", text: "#fff" },
  overdue:     { bg: "linear-gradient(90deg, #ea580c, #ef4444)", text: "#fff" },
  pending:     { bg: "linear-gradient(90deg, #c084fc, #d8b4fe)", text: "#fff" },
};

const statusDisplay: Record<TaskBarStatus, { label: string; color: string; bg: string }> = {
  completed:   { label: "Done",       color: "#7c3aed", bg: "#f3e8ff" },
  in_progress: { label: "InProgress", color: "#9333ea", bg: "#f5f3ff" },
  overdue:     { label: "Overdue",    color: "#dc2626", bg: "#fee2e2" },
  pending:     { label: "Not Yet",    color: "#6b7280", bg: "#f3f4f6" },
};

function getTaskBarStatus(task: taskList): TaskBarStatus {
  const s = (task.status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done") return "completed";
  if (task.end_time) {
    const end = new Date(task.end_time);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today && s !== "completed" && s !== "done") return "overdue";
  }
  if (s === "in_progress") return "in_progress";
  return "pending";
}

function getTaskProgress(task: taskList): number {
  if (task.progress !== undefined) return task.progress;
  const s = (task.status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done") return 100;
  if (s === "review") return 90;
  if (s === "in_progress") return 50;
  return 0;
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatShortDate(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function getAssigneeName(task: taskList, getUserName: (id: any) => string): string {
  if (task.dailyLog?.assignedUser?.fullName) return task.dailyLog.assignedUser.fullName;
  if (task.assigned_to) return getUserName(task.assigned_to);
  return "Unassigned";
}

// Generate all days between two dates (inclusive)
interface DayInfo {
  date: Date;
  day: number;
  month: number;
  year: number;
  dow: number;
  isWeekend: boolean;
  isToday: boolean;
  isFirstOfMonth: boolean;
  label: string; // "FEB 01"
  dowLabel: string; // "Mon"
  monthYear: string; // "February 2026"
}

function generateDayRange(start: Date, end: Date): DayInfo[] {
  const days: DayInfo[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);

  while (cur <= endD) {
    const dow = cur.getDay();
    const d = cur.getDate();
    const m = cur.getMonth();
    const y = cur.getFullYear();
    days.push({
      date: new Date(cur),
      day: d,
      month: m,
      year: y,
      dow,
      isWeekend: dow === 0 || dow === 6,
      isToday: cur.getTime() === today.getTime(),
      isFirstOfMonth: d === 1,
      label: `${monthAbbr[m]} ${String(d).padStart(2, "0")}`,
      dowLabel: dayNames[dow],
      monthYear: `${monthNames[m]} ${y}`,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// Compute day index (0-based) of a date within the range
function dayIndex(date: Date, rangeStart: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const s = new Date(rangeStart);
  s.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - s.getTime()) / 86400000);
}

// ─── Grouped task row ────────────────────────────────────────────
interface GroupedTaskRow {
  description: string;
  projectName: string;
  projectColor: (typeof PROJECT_COLORS)[0];
  tasks: taskList[];
  assignees: { name: string; status: TaskBarStatus; userId: string | number | null | undefined }[];
  startIdx: number;
  endIdx: number;
  statusCounts: Record<TaskBarStatus, number>;
  overallStatus: TaskBarStatus;
  progress: number;
  earliestStart: string | null;
  latestEnd: string | null;
}

interface TaskGanttChartProps {
  tasks: taskList[];
  users: formUserData[];
  projects: any[];
  projectColorMap: Record<string, (typeof PROJECT_COLORS)[0]>;
  getUserName: (id: string | number | null | undefined) => string;
  loading?: boolean;
  onTaskClick?: (task: taskList) => void;
  hideLeftPanel?: boolean;
}

const BASE_COL_WIDTH = 50;
const LEFT_PANEL_WIDTH = 380;
const ROW_HEIGHT = 72;

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
  const [rangeOffset, setRangeOffset] = useState(0); // shift range by months
  const timelineRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: extra months before/after the computed range
  const [extraBefore, setExtraBefore] = useState(1);
  const [extraAfter, setExtraAfter] = useState(1);
  const isExtendingRef = useRef(false);
  const scrollAdjustRef = useRef(0);

  const colWidth = BASE_COL_WIDTH * zoomLevel;

  // ─── Compute date range from tasks ─────────────────────────────
  const { rangeStart, rangeDays, rangeLabel } = useMemo(() => {
    let earliest: Date | null = null;
    let latest: Date | null = null;

    for (const task of tasks) {
      const s = task.start_time || task.created_at || null;
      const e = task.end_time || null;
      if (s) {
        const d = new Date(s);
        d.setHours(0, 0, 0, 0);
        if (!earliest || d < earliest) earliest = d;
      }
      if (e) {
        const d = new Date(e);
        d.setHours(0, 0, 0, 0);
        if (!latest || d > latest) latest = d;
      }
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (!earliest && !latest) {
      // No tasks with dates — show current month
      earliest = new Date(now.getFullYear(), now.getMonth(), 1);
      latest = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (!earliest) {
      earliest = new Date(latest!);
      earliest.setDate(earliest.getDate() - 14);
    } else if (!latest) {
      latest = new Date(earliest);
      latest.setDate(latest.getDate() + 14);
    }

    // Expand to start of earliest month and end of latest month
    const rStart = new Date(earliest!.getFullYear(), earliest!.getMonth(), 1);
    const rEnd = new Date(latest!.getFullYear(), latest!.getMonth() + 1, 0);

    // Apply range offset (month shift)
    if (rangeOffset !== 0) {
      rStart.setMonth(rStart.getMonth() + rangeOffset);
      rEnd.setMonth(rEnd.getMonth() + rangeOffset);
    }

    // Apply extra months for infinite scroll
    rStart.setMonth(rStart.getMonth() - extraBefore);
    const targetEndMonth = rEnd.getMonth() + extraAfter;
    rEnd.setTime(new Date(rEnd.getFullYear(), targetEndMonth + 1, 0).getTime());

    const days = generateDayRange(rStart, rEnd);

    // Build label: "February 2026" or "February – March 2026"
    const startMonth = `${monthNames[rStart.getMonth()]} ${rStart.getFullYear()}`;
    const endMonth = `${monthNames[rEnd.getMonth()]} ${rEnd.getFullYear()}`;
    const label = startMonth === endMonth ? startMonth : `${monthNames[rStart.getMonth()]} – ${endMonth}`;

    return { rangeStart: rStart, rangeEnd: rEnd, rangeDays: days, rangeLabel: label };
  }, [tasks, rangeOffset, extraBefore, extraAfter]);

  const totalDays = rangeDays.length;

  // ─── Group tasks by description + project ──────────────────────
  const groupedRows: GroupedTaskRow[] = useMemo(() => {
    const groupMap = new Map<string, taskList[]>();

    for (const task of tasks) {
      const projName = typeof task.project === "object" && task.project !== null
        ? (task.project as any).name : (task.project || "");
      const projId = task.project_id || (typeof task.project === "object" && task.project !== null
        ? (task.project as any).id : "");
      const desc = (task.description || "").trim();
      const proj = projId ? String(projId) : String(projName).trim();
      const key = `${desc}|||${proj}`;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(task);
    }

    const rows: GroupedTaskRow[] = [];

    for (const [, groupTasks] of groupMap) {
      const first = groupTasks[0];
      const projName = typeof first.project === "object" && first.project !== null
        ? (first.project as any).name : (first.project || "");

      let earliestStart: Date | null = null;
      let latestEnd: Date | null = null;

      for (const t of groupTasks) {
        const s = t.start_time || t.created_at || null;
        const e = t.end_time || null;
        if (s) {
          const sd = new Date(s);
          if (!earliestStart || sd < earliestStart) earliestStart = sd;
        }
        if (e) {
          const ed = new Date(e);
          if (!latestEnd || ed > latestEnd) latestEnd = ed;
        }
      }

      if (!earliestStart && !latestEnd) continue;

      let startIdx = 0;
      let endIdx = totalDays - 1;

      if (earliestStart) {
        startIdx = Math.max(0, dayIndex(earliestStart, rangeStart));
      }
      if (latestEnd) {
        endIdx = Math.min(totalDays - 1, dayIndex(latestEnd, rangeStart));
      }

      if (!earliestStart && latestEnd) startIdx = Math.max(0, endIdx - 2);
      if (earliestStart && !latestEnd) endIdx = Math.min(startIdx + 2, totalDays - 1);
      if (endIdx - startIdx < 2) endIdx = Math.min(startIdx + 2, totalDays - 1);

      // Clamp to visible range
      if (startIdx > totalDays - 1 || endIdx < 0) continue;
      startIdx = Math.max(0, startIdx);
      endIdx = Math.min(totalDays - 1, endIdx);

      const assignees = groupTasks.map(t => ({
        name: getAssigneeName(t, getUserName),
        status: getTaskBarStatus(t),
        userId: t.assigned_to,
      }));

      const statusCounts: Record<TaskBarStatus, number> = {
        completed: 0, in_progress: 0, overdue: 0, pending: 0,
      };
      for (const a of assignees) statusCounts[a.status]++;

      let overallStatus: TaskBarStatus = "pending";
      if (statusCounts.overdue > 0) overallStatus = "overdue";
      else if (statusCounts.in_progress > 0) overallStatus = "in_progress";
      else if (statusCounts.completed === assignees.length) overallStatus = "completed";
      else if (statusCounts.completed > 0) overallStatus = "in_progress";

      const totalProgress = groupTasks.reduce((sum, t) => sum + getTaskProgress(t), 0);
      const progress = Math.round(totalProgress / groupTasks.length);

      rows.push({
        description: first.description,
        projectName: projName,
        projectColor: projectColorMap[projName] || PROJECT_COLORS[0],
        tasks: groupTasks,
        assignees,
        startIdx,
        endIdx,
        statusCounts,
        overallStatus,
        progress,
        earliestStart: earliestStart?.toISOString() || null,
        latestEnd: latestEnd?.toISOString() || null,
      });
    }

    // Sort rows by earliest start date (first starting task appears first)
    rows.sort((a, b) => {
      const aDate = a.earliestStart ? new Date(a.earliestStart).getTime() : Infinity;
      const bDate = b.earliestStart ? new Date(b.earliestStart).getTime() : Infinity;
      return aDate - bDate;
    });

    return rows;
  }, [tasks, rangeStart, totalDays, projectColorMap, getUserName, users]);

  // ─── Month headers for the timeline ────────────────────────────
  const monthHeaders = useMemo(() => {
    const headers: { label: string; startIdx: number; span: number }[] = [];
    let curLabel = "";
    let curStart = 0;
    let curSpan = 0;

    for (let i = 0; i < rangeDays.length; i++) {
      const d = rangeDays[i];
      const label = d.monthYear;
      if (label !== curLabel) {
        if (curLabel) headers.push({ label: curLabel, startIdx: curStart, span: curSpan });
        curLabel = label;
        curStart = i;
        curSpan = 1;
      } else {
        curSpan++;
      }
    }
    if (curLabel) headers.push({ label: curLabel, startIdx: curStart, span: curSpan });
    return headers;
  }, [rangeDays]);

  // Auto-scroll to 1 day before the earliest task start date
  const hasInitialScrolled = useRef(false);
  useEffect(() => {
    if (!timelineRef.current || groupedRows.length === 0 || hasInitialScrolled.current) return;
    hasInitialScrolled.current = true;
    const firstStartIdx = Math.min(...groupedRows.map((r) => r.startIdx));
    // Scroll 1 column before the first task so it's clearly visible
    const scrollTo = Math.max(0, firstStartIdx - 1) * colWidth;
    timelineRef.current.scrollLeft = scrollTo;
  }, [groupedRows, colWidth]);

  /* Infinite scroll — extend range when reaching edges */
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const handleEdgeScroll = () => {
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
        if (rangeDays.length > 0) {
          const firstDay = rangeDays[0].date;
          const prevMonthEnd = new Date(firstDay.getFullYear(), firstDay.getMonth(), 0);
          scrollAdjustRef.current = prevMonthEnd.getDate() * colWidth;
        }
        setExtraBefore((prev) => prev + 1);
      }
    };

    el.addEventListener("scroll", handleEdgeScroll);
    return () => el.removeEventListener("scroll", handleEdgeScroll);
  }, [rangeDays, colWidth]);

  /* Preserve scroll position when months are prepended */
  useLayoutEffect(() => {
    if (scrollAdjustRef.current > 0 && timelineRef.current) {
      timelineRef.current.scrollLeft += scrollAdjustRef.current;
      scrollAdjustRef.current = 0;
      setTimeout(() => { isExtendingRef.current = false; }, 200);
    }
  }, [extraBefore]);

  // Sync vertical scroll
  const handleTimelineScroll = () => {
    if (timelineRef.current && leftPanelRef.current) {
      leftPanelRef.current.scrollTop = timelineRef.current.scrollTop;
    }
  };
  const handleLeftScroll = () => {
    if (leftPanelRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = leftPanelRef.current.scrollTop;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress size={28} sx={{ color: "#7c3aed" }} />
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      {/* Navigation Header */}
      <div
        className="d-flex align-items-center justify-content-between"
        style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0" }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => { setRangeOffset(o => o - 1); setExtraBefore(1); setExtraAfter(1); }}
            className="btn btn-sm p-1"
            style={{ border: "1px solid #e5e7eb", borderRadius: 10, lineHeight: 1 }}
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: 18, color: "#6b7280" }} />
          </button>
          <button
            className="btn btn-sm text-white d-flex align-items-center gap-1"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #9333ea)",
              borderRadius: 12,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
            }}
            onClick={() => { setRangeOffset(0); setExtraBefore(1); setExtraAfter(1); }}
          >
            <CalendarMonthIcon sx={{ fontSize: 16 }} />
            {rangeLabel}
          </button>
          <button
            onClick={() => { setRangeOffset(o => o + 1); setExtraBefore(1); setExtraAfter(1); }}
            className="btn btn-sm p-1"
            style={{ border: "1px solid #e5e7eb", borderRadius: 10, lineHeight: 1 }}
          >
            <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "#6b7280" }} />
          </button>
        </div>

        <div className="d-flex align-items-center gap-3">
          {projects.filter(p => (p.status || "").toLowerCase() === "active").slice(0, 4).map((p: any, i: number) => {
            const color = (projectColorMap[p.name] || PROJECT_COLORS[i % PROJECT_COLORS.length]).dot;
            return (
              <div key={p.id} className="d-flex align-items-center gap-1">
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Gantt Area */}
      <div style={{ display: "flex", maxHeight: 500, overflow: "hidden" }}>
        {/* Fixed Left Panel */}
        {!hideLeftPanel && <div
          ref={leftPanelRef}
          onScroll={handleLeftScroll}
          style={{
            width: LEFT_PANEL_WIDTH,
            minWidth: LEFT_PANEL_WIDTH,
            borderRight: "2px solid #e0d4f5",
            boxShadow: "4px 0 8px rgba(124,58,237,0.06)",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            backgroundColor: "#fff",
            zIndex: 3,
          }}
        >
          {/* Left Header — needs extra height for month header row */}
          <div
            style={{
              display: "flex",
              position: "sticky",
              top: 0,
              zIndex: 4,
              backgroundColor: "#fafafa",
              borderBottom: "1px solid #e5e7eb",
              minHeight: 68,
              alignItems: "flex-end",
            }}
          >
            <div style={{
              flex: 1,
              padding: "10px 16px",
              fontSize: 10,
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}>
              Task Details
            </div>
            <div style={{
              width: 100,
              padding: "10px 8px",
              fontSize: 10,
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: 1,
              textTransform: "uppercase",
              textAlign: "center",
            }}>
              Status
            </div>
          </div>

          {/* Left Task Rows */}
          {groupedRows.length > 0 ? groupedRows.map((row, idx) => {
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
                  height: ROW_HEIGHT,
                  borderBottom: "1px solid #f5f5f5",
                  background: hoveredIdx === idx ? "#faf8ff" : "#fff",
                  transition: "background 0.15s",
                  cursor: onTaskClick ? "pointer" : undefined,
                }}
              >
                <div style={{ flex: 1, padding: "6px 16px", overflow: "hidden" }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: row.overallStatus === "in_progress" ? "#2563eb" : "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 4,
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

                    {/* Assignee avatars */}
                    <div style={{ display: "flex", marginLeft: 2 }}>
                      {row.assignees.slice(0, 4).map((a, i) => {
                        const aIdx = users.findIndex(u => String(u.id) === String(a.userId));
                        const color = avatarColors[Math.max(0, aIdx) % avatarColors.length];
                        return (
                          <div
                            key={i}
                            title={`${a.name} - ${statusDisplay[a.status].label}`}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              backgroundColor: color,
                              color: "#fff",
                              fontSize: 8,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "2px solid #fff",
                              marginLeft: i > 0 ? -6 : 0,
                              zIndex: row.assignees.length - i,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(a.name)}
                          </div>
                        );
                      })}
                      {row.assignees.length > 4 && (
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          backgroundColor: "#e5e7eb", color: "#6b7280",
                          fontSize: 8, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: "2px solid #fff", marginLeft: -6, flexShrink: 0,
                        }}>
                          +{row.assignees.length - 4}
                        </div>
                      )}
                    </div>

                    {isMulti && (
                      <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>
                        {row.assignees.length} assigned
                      </span>
                    )}
                    {!isMulti && (
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>
                        {formatShortDate(row.latestEnd || row.earliestStart)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ width: 100, textAlign: "center", flexShrink: 0, padding: "0 4px" }}>
                  {isMulti ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                      {row.statusCounts.completed > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", backgroundColor: "#f3e8ff", padding: "1px 6px", borderRadius: 4 }}>
                          {row.statusCounts.completed} Done
                        </span>
                      )}
                      {row.statusCounts.in_progress > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#9333ea", backgroundColor: "#f5f3ff", padding: "1px 6px", borderRadius: 4 }}>
                          {row.statusCounts.in_progress} Active
                        </span>
                      )}
                      {row.statusCounts.pending > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", backgroundColor: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>
                          {row.statusCounts.pending} Pending
                        </span>
                      )}
                      {row.statusCounts.overdue > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", backgroundColor: "#fee2e2", padding: "1px 6px", borderRadius: 4 }}>
                          {row.statusCounts.overdue} Overdue
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: statusDisplay[row.overallStatus].color,
                      backgroundColor: statusDisplay[row.overallStatus].bg,
                      padding: "3px 8px", borderRadius: 6,
                    }}>
                      {statusDisplay[row.overallStatus].label}
                    </span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              No tasks found for this period
            </div>
          )}
        </div>}

        {/* Scrollable Right Panel (Timeline) */}
        <div
          ref={timelineRef}
          onScroll={handleTimelineScroll}
          className="gantt-scroll"
          style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}
        >
          <div style={{ minWidth: totalDays * colWidth }}>
            {/* Month Header Row */}
            <div
              style={{
                display: "flex",
                position: "sticky",
                top: 0,
                zIndex: 4,
                backgroundColor: "#f3f0ff",
                borderBottom: "1px solid #e5e7eb",
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

            {/* Day Column Headers */}
            <div
              style={{
                display: "flex",
                position: "sticky",
                top: 24,
                zIndex: 3,
                backgroundColor: "#fafafa",
                borderBottom: "1px solid #e5e7eb",
                minHeight: 44,
              }}
            >
              {rangeDays.map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: colWidth,
                    minWidth: colWidth,
                    textAlign: "center",
                    padding: "6px 0",
                    borderLeft: d.isFirstOfMonth ? "2px solid #d8b4fe" : "1px solid #f0f0f0",
                    backgroundColor: d.isToday ? "#f5f3ff" : d.isWeekend ? "#fafafa" : undefined,
                  }}
                >
                  <div style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: d.isToday ? "#7c3aed" : "#374151",
                    letterSpacing: 0.3,
                  }}>
                    {String(d.day).padStart(2, "0")}
                  </div>
                  <div style={{
                    fontSize: 8,
                    fontWeight: 500,
                    color: d.isToday ? "#7c3aed" : "#9ca3af",
                    letterSpacing: 0.5,
                  }}>
                    {d.dowLabel}
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Bar Rows */}
            {groupedRows.map((row, idx) => {
              const barColor = taskBarColors[row.overallStatus];
              const barWidthPx = Math.max((row.endIdx - row.startIdx + 1) * colWidth - 4, 20);
              const isMulti = row.assignees.length > 1;

              let barLabel: string;
              if (isMulti) {
                const doneCount = row.statusCounts.completed;
                barLabel = barWidthPx < 100
                  ? `${doneCount}/${row.assignees.length}`
                  : `${doneCount}/${row.assignees.length} Done`;
              } else {
                barLabel = barWidthPx < 120
                  ? (row.overallStatus === "completed" ? "DONE" : row.overallStatus === "overdue" ? "!" : row.overallStatus === "in_progress" ? "ACTIVE" : "NEW")
                  : (row.overallStatus === "completed" ? "COMPLETED" : row.overallStatus === "overdue" ? "OVERDUE" : row.overallStatus === "in_progress" ? "IN PROGRESS" : "PENDING");
              }

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => { setHoveredIdx(null); setTooltipPos(null); }}
                  style={{
                    position: "relative",
                    height: ROW_HEIGHT,
                    borderBottom: "1px solid #f5f5f5",
                    background: hoveredIdx === idx ? "#faf8ff" : "#fff",
                    transition: "background 0.15s",
                    overflow: "hidden",
                  }}
                >
                  {/* Grid lines */}
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

                  {/* Today marker */}
                  {rangeDays.map((d, i) =>
                    d.isToday ? (
                      <div
                        key="today"
                        style={{
                          position: "absolute",
                          left: i * colWidth + colWidth / 2,
                          top: 0,
                          bottom: 0,
                          width: 2,
                          backgroundColor: "#7c3aed",
                          opacity: 0.3,
                          zIndex: 2,
                        }}
                      />
                    ) : null
                  )}

                  {/* Task Bar */}
                  <div
                    style={{
                      position: "absolute",
                      left: row.startIdx * colWidth + 2,
                      width: barWidthPx,
                      top: isMulti ? 12 : 18,
                      height: isMulti ? 32 : 28,
                      borderRadius: 6,
                      background: barColor.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      paddingInline: 6,
                      zIndex: 3,
                      cursor: "pointer",
                      boxShadow: hoveredIdx === idx
                        ? "0 3px 12px rgba(0,0,0,0.18)"
                        : "0 1px 4px rgba(0,0,0,0.08)",
                      transition: "box-shadow 0.2s",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                    onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                    onClick={() => onTaskClick?.(row.tasks[0])}
                  >
                    {isMulti && barWidthPx >= 80 && (
                      <div style={{ display: "flex", marginRight: 2 }}>
                        {row.assignees.slice(0, 3).map((a, i) => (
                          <div
                            key={i}
                            style={{
                              width: 18, height: 18, borderRadius: "50%",
                              backgroundColor: "rgba(255,255,255,0.3)",
                              color: "#fff", fontSize: 7, fontWeight: 700,
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
                    <span style={{ fontSize: 10, fontWeight: 700, color: barColor.text }}>
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
                      top: 48,
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
            })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredIdx !== null && tooltipPos && groupedRows[hoveredIdx] && (() => {
        const row = groupedRows[hoveredIdx];
        const isMulti = row.assignees.length > 1;
        return (
          <div
            style={{
              position: "fixed",
              left: tooltipPos.x + 14,
              top: tooltipPos.y - (isMulti ? 120 : 80),
              background: "#fff",
              borderRadius: 12,
              padding: "14px 18px",
              fontSize: 12,
              zIndex: 9999,
              pointerEvents: "none",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              border: "1px solid #e5e7eb",
              minWidth: 240,
              maxWidth: 320,
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
                {row.description}
              </span>
            </div>
            <div style={{ color: "#6b7280", marginBottom: 6 }}>
              Project: <span style={{ fontWeight: 600, color: row.projectColor.text }}>{row.projectName}</span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
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
                      <span style={{ fontSize: 11, color: "#374151" }}>{a.name}</span>
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
            <div style={{ color: "#6b7280", marginBottom: 4 }}>
              {formatShortDate(row.earliestStart)} &rarr; {formatShortDate(row.latestEnd)}
            </div>
          </div>
        );
      })()}

      {/* Footer: Legend + Zoom */}
      <div
        className="d-flex align-items-center justify-content-between flex-wrap"
        style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}
      >
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#7c3aed", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>In Progress</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#9333ea", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Completed</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#c084fc", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Pending</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>
            Zoom
          </span>
          <button
            onClick={() => setZoomLevel(z => Math.max(0.5, +(z - 0.1).toFixed(1)))}
            style={{
              width: 22, height: 22, borderRadius: "50%", border: "1px solid #d1d5db",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#6b7280", background: "#fff", cursor: "pointer",
            }}
          >
            &minus;
          </button>
          <input
            type="range" min={0.5} max={2} step={0.1}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            style={{ width: 100, accentColor: "#7c3aed", cursor: "pointer" }}
          />
          <button
            onClick={() => setZoomLevel(z => Math.min(2, +(z + 0.1).toFixed(1)))}
            style={{
              width: 22, height: 22, borderRadius: "50%", border: "1px solid #d1d5db",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#6b7280", background: "#fff", cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
