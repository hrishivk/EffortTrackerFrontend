import { useState } from "react";
import { motion } from "framer-motion";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

interface AttendanceRow {
  dayShort: string;
  date: number;
  isToday: boolean;
  isWeekend: boolean;
  status: "Office In" | "Weekend" | "Leave" | "Holiday" | "Absent";
  lateBy?: string;
  punchIn?: string;
  punchOut?: string;
  totalHrs: string;
}

const SHIFT_MINUTES = 9 * 60; 

const DAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];


function isWeekendDay(d: Date): boolean {
  const day = d.getDay();
  if (day === 0) return true;
  if (day === 6) {
    const nth = Math.ceil(d.getDate() / 7);
    return nth === 1 || nth === 3 || nth === 5;
  }
  return false;
}


function hrsToPercent(hrs: string): number {
  const [h, m] = hrs.split(":").map(Number);
  const mins = h * 60 + m;
  return Math.min(100, Math.round((mins / SHIFT_MINUTES) * 100));
}

type RawRow = {
  date: Date;
  isToday?: boolean;
  lateBy?: string;
  punchIn?: string;
  punchOut?: string;
  totalHrs: string;
};

const rawRows: RawRow[] = [
  { date: new Date(2026, 1, 8),  totalHrs: "00:00" },
  { date: new Date(2026, 1, 9),  lateBy: "00:03", punchIn: "10:03 AM", punchOut: "07:04 PM", totalHrs: "09:01" },
  { date: new Date(2026, 1, 10), punchIn: "09:47 AM", punchOut: "07:00 PM", totalHrs: "09:13" },
  { date: new Date(2026, 1, 11), punchIn: "09:49 AM", punchOut: "07:00 PM", totalHrs: "09:11" },
  { date: new Date(2026, 1, 12), lateBy: "00:04", punchIn: "10:04 AM", punchOut: "07:04 PM", totalHrs: "09:00" },
  { date: new Date(2026, 1, 13), punchIn: "09:58 AM", punchOut: "07:01 PM", totalHrs: "09:03" },
  { date: new Date(2026, 1, 14), isToday: true, punchIn: "09:55 AM", punchOut: "01:20 PM", totalHrs: "03:25" },
];

const dummyRows: AttendanceRow[] = rawRows.map((r) => {
  const weekend = isWeekendDay(r.date);
  return {
    dayShort: DAY_SHORT[r.date.getDay()],
    date: r.date.getDate(),
    isToday: !!r.isToday,
    isWeekend: weekend,
    status: weekend ? "Weekend" : "Office In",
    lateBy: weekend ? undefined : r.lateBy,
    punchIn: weekend ? undefined : r.punchIn,
    punchOut: weekend ? undefined : r.punchOut,
    totalHrs: weekend ? "00:00" : r.totalHrs,
  };
});
const weekendCount = dummyRows.filter((r) => r.isWeekend).length;
const presentCount = dummyRows.filter((r) => !r.isWeekend && r.punchIn).length;
const payableCount = dummyRows.length - weekendCount;

const summaryStats = [
  { label: "PAYABLE DAYS", value: String(payableCount), sub: payableCount === 1 ? "Day" : "Days" },
  { label: "PRESENT",      value: String(presentCount), sub: presentCount === 1 ? "Day" : "Days" },
  { label: "ON DUTY",      value: "0", sub: "Day" },
  { label: "PAID LEAVE",   value: "0", sub: "Day" },
  { label: "WEEKEND",      value: String(weekendCount), sub: weekendCount === 1 ? "Day" : "Days", highlight: true },
];

const thStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#000000",
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

export default function AttendanceSummary() {
  const [weekLabel] = useState("Feb 08 - Feb 14, 2026");

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
            Attendance Summary Report
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              className="w-8 h-8 flex items-center justify-center transition"
              style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)" }}
            >
              <KeyboardArrowLeftIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
            </button>
            <button
              className="flex items-center gap-1.5 text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 18px",
                whiteSpace: "nowrap",
                border: "none",
                cursor: "pointer",
              }}
            >
              <CalendarMonthIcon sx={{ fontSize: 14 }} />
              {weekLabel}
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center transition"
              style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)" }}
            >
              <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
            </button>
          </div>

          <button
            className="w-8 h-8 flex items-center justify-center transition"
            style={{ borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7c3aed, #a855f7)", cursor: "pointer" }}
          >
            <FilterListIcon sx={{ fontSize: 18, color: "#fff" }} />
          </button>

          <button
            className="w-8 h-8 flex items-center justify-center transition"
            style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)", cursor: "pointer" }}
          >
            <FileDownloadOutlinedIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Table header */}
        <div
          className="grid items-center px-6 py-3"
          style={{
            gridTemplateColumns: "80px 150px 1fr 180px 85px",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <span style={thStyle}>Date</span>
          <span style={thStyle}>Attendance Status</span>
          <span style={{ ...thStyle, textAlign: "center" }}>Work Timeline</span>
          <span style={{ ...thStyle, textAlign: "right" }}>Punch Times</span>
          <span style={{ ...thStyle, textAlign: "right" }}>Total Hrs</span>
        </div>

        <style>{`
          @keyframes today-pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(124,58,237,0.3); }
            50% { opacity: 0.85; box-shadow: 0 0 16px rgba(124,58,237,0.6); }
          }
          @keyframes today-shimmer {
            0% { left: -40%; }
            100% { left: 140%; }
          }
        `}</style>

        {/* Rows */}
        {dummyRows.map((row, i) => {
          const pct = hrsToPercent(row.totalHrs);

          return (
            <motion.div
              key={i}
              initial={row.isToday ? { opacity: 0, scale: 0.98 } : false}
              animate={row.isToday ? { opacity: 1, scale: 1 } : undefined}
              transition={row.isToday ? { duration: 0.5, delay: 0.3 } : undefined}
              className="grid items-center px-6"
              style={{
                gridTemplateColumns: "80px 150px 1fr 180px 85px",
                height: 68,
                borderBottom: i < dummyRows.length - 1 ? "1px solid var(--border-light)" : "none",
                backgroundColor: row.isToday ? "rgba(124,58,237,0.04)" : "transparent",
                borderLeft: row.isToday ? "3px solid #7c3aed" : "3px solid transparent",
              }}
            >
              {/* Date */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.5, display: "block", lineHeight: 1 }}>
                  {row.dayShort}
                </span>
                <div className="d-flex align-items-center gap-1" style={{ marginTop: 2 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                    {String(row.date).padStart(2, "0")}
                  </span>
                  {row.isToday && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.6 }}
                      style={{
                        fontSize: 7,
                        fontWeight: 700,
                        color: "#fff",
                        background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                      }}
                    >
                      Today
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                {row.isWeekend ? (
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>Weekend</span>
                ) : (
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#7c3aed",
                        backgroundColor: "#ede9fe",
                        padding: "3px 10px",
                        borderRadius: 6,
                        display: "inline-block",
                      }}
                    >
                      Office In
                    </span>
                    {row.lateBy && (
                      <span style={{ fontSize: 9, color: "#dc2626", fontWeight: 500, display: "block", marginTop: 2 }}>
                        Late by {row.lateBy}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Work Timeline — based on 9-hour shift */}
              <div style={{ padding: "0 16px" }}>
                <div
                  style={{
                    position: "relative",
                    height: row.isWeekend ? 4 : 8,
                    borderRadius: 4,
                    backgroundColor: row.isWeekend ? "#ede9fe" : "#e5e7eb",
                    overflow: row.isToday ? "visible" : "hidden",
                  }}
                >
                  {pct > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={
                        row.isToday
                          ? { duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }
                          : { duration: 0.8, delay: 0.15 + i * 0.07, ease: [0.33, 1, 0.68, 1] }
                      }
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        borderRadius: 4,
                        background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                        ...(row.isToday ? { animation: "today-pulse 2s ease-in-out infinite" } : {}),
                      }}
                    />
                  )}
                  {!row.isWeekend && pct > 0 && pct < 100 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: `${100 - pct}%`,
                        height: "100%",
                        borderRadius: "0 4px 4px 0",
                        backgroundColor: "#d1d5db",
                      }}
                    />
                  )}
                  {/* Shimmer sweep on today's bar */}
                  {row.isToday && pct > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${pct}%`,
                        height: "100%",
                        overflow: "hidden",
                        borderRadius: 4,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          width: "40%",
                          height: "100%",
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                          animation: "today-shimmer 2.5s ease-in-out infinite",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Punch Times */}
              <div style={{ textAlign: "right" }}>
                {row.punchIn ? (
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                    {row.punchIn} - {row.punchOut}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-faint)", fontStyle: "italic" }}>
                    No entry
                  </span>
                )}
              </div>

              {/* Total Hrs */}
              <div style={{ textAlign: "right" }}>
                {row.isToday ? (
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.4 }}
                    style={{ fontSize: 15, fontWeight: 700, color: "#14b8a6", display: "inline-block" }}
                  >
                    {row.totalHrs}
                  </motion.span>
                ) : (
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                    {row.totalHrs}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        <div
          className="grid px-6 py-4"
          style={{
            gridTemplateColumns: "repeat(5, 1fr)",
            borderTop: "1px solid var(--border-light)",
          }}
        >
          {summaryStats.map((stat, i) => (
            <div
              key={i}
              className="flex items-center"
              style={{
                borderLeft: i > 0 ? "2px solid var(--border-light)" : "none",
                paddingLeft: i > 0 ? 20 : 0,
              }}
            >
              <div>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                  {stat.label}
                </span>
                <div className="d-flex align-items-baseline gap-1">
                  <span style={{ fontSize: 20, fontWeight: 700, color: stat.highlight ? "#7c3aed" : "var(--text-primary)" }}>
                    {stat.value}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-faint)" }}>{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 flex-wrap py-2">
        <div className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#14b8a6", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>Worked Hours</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#d1d5db", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>Non-Working</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
          Shift Time: 10:00 AM - 07:00 PM
        </span>
      </div>
    </>
  );
}
