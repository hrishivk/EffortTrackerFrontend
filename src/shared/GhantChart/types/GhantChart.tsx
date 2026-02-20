import { useState } from "react";
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
import type { GanttProject, ProjectStatus, ViewMode } from ".";




const projects: GanttProject[] = [
  {
    name: "Mobile App Redesign",
    status: "ON TRACK",
    bars: [
      { startDay: 1, endDay: 7, label: "Phase 1", progress: 65, type: "active" },
    ],
  },
  {
    name: "Q4 Marketing Campaign",
    status: "COMPLETED",
    bars: [
      { startDay: 4, endDay: 10, label: "Done", progress: 100, type: "completed" },
    ],
  },
  {
    name: "API Integration Layer",
    status: "DELAYED",
    bars: [
      { startDay: 3, endDay: 9, label: "Development", progress: 40, type: "delayed", overdueDays: 3, hasFlag: true },
    ],
  },
  {
    name: "Cloud Infrastructure Migration",
    status: "ON TRACK",
    bars: [
      { startDay: 7, endDay: 16, label: "Infrastructure Set", progress: 20, type: "green" },
    ],
  },
  {
    name: "Customer Portal Update",
    status: "ON TRACK",
    bars: [
      { startDay: 10, endDay: 18, label: "UI Review", progress: 10, type: "green" },
    ],
  },
  {
    name: "E-commerce Backend",
    status: "DELAYED",
    bars: [
      { startDay: 5, endDay: 11, label: "Core Logic", progress: 80, type: "delayed", hasFlag: true },
    ],
  },
  {
    name: "Data Analytics Dashboard",
    status: "COMPLETED",
    bars: [
      { startDay: 4, endDay: 12, label: "Finalized", progress: 100, type: "completed" },
    ],
  },
  {
    name: "Legacy System Audit",
    status: "ON TRACK",
    bars: [
      { startDay: 16, endDay: 24, label: "Audit Cycle 1", progress: 45, type: "active" },
    ],
  },
  {
    name: "AI Search Implementation",
    status: "ON TRACK",
    bars: [
      { startDay: 18, endDay: 27, label: "Kickoff", progress: 5, type: "active" },
    ],
  },
  {
    name: "Security Hardening Ph2",
    status: "COMPLETED",
    bars: [
      { startDay: 3, endDay: 11, label: "Verified", progress: 100, type: "completed" },
    ],
  },
];


const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number) {
  return new Date(year, month, day).getDay();
}

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

export default function GanttChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(9);
  const [currentYear, setCurrentYear] = useState(2023);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("High");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("Day");

  const totalDays = getDaysInMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const filteredProjects =
    statusFilter === "All"
      ? projects
      : projects.filter((p) => p.status === statusFilter);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
    
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

          <FormControl size="small" sx={{ minWidth: 120, ...selectSx }}>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              renderValue={(val) => `Priority: ${val}`}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120, ...selectSx }}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              renderValue={(val) => `Category: ${val}`}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Development">Development</MenuItem>
              <MenuItem value="Design">Design</MenuItem>
              <MenuItem value="Marketing">Marketing</MenuItem>
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
            {(["Day", "Week", "Month"] as ViewMode[]).map((mode) => (
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
                  borderRight: mode !== "Month" ? "1px solid #e5e7eb" : "none",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>


        <div className="d-flex align-items-center gap-2">
          <button
            onClick={prevMonth}
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
            {monthNames[currentMonth]} {currentYear}
          </button>
          <button
            onClick={nextMonth}
            className="btn btn-sm p-1"
            style={{ border: "1px solid #e5e7eb", borderRadius: 8, lineHeight: 1 }}
          >
            <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "#6b7280" }} />
          </button>
        </div>
      </div>


      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 1100 }}>
    
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
              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const dow = getDayOfWeek(currentYear, currentMonth, day);
                return (
                  <div
                    key={day}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "6px 0",
                      borderLeft: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      {day}
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 500,
                        color: "#9ca3af",
                        letterSpacing: 0.5,
                      }}
                    >
                      {dayNames[dow]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

   
          {filteredProjects.map((p, idx) => {
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
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: 4,
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
                
                  {Array.from({ length: totalDays }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${(i / totalDays) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: "#f5f5f5",
                      }}
                    />
                  ))}

             
                  {p.bars.map((bar, bIdx) => {
                    const style = barStyles[bar.type];
                    const leftPct = ((bar.startDay - 1) / totalDays) * 100;
                    const widthPct =
                      ((bar.endDay - bar.startDay + 1) / totalDays) * 100;
                    const overdueWidthPct = bar.overdueDays
                      ? (bar.overdueDays / totalDays) * 100
                      : 0;

                    return (
                      <div key={bIdx}>
                   
                        <div
                          style={{
                            position: "absolute",
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            top: 5,
                            height: 26,
                            borderRadius: 6,
                            background: style.bg,
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
                              color: style.text,
                            }}
                          >
                            {bar.progress}% {bar.label}
                          </span>
                          {bar.type === "completed" && (
                            <CheckCircleOutlineIcon
                              sx={{ fontSize: 14, color: "#fff", opacity: 0.9 }}
                            />
                          )}
                        </div>

            
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
          })}
        </div>
      </div>

    
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
            Total Resources: <strong style={{ color: "#111827" }}>24 Full-time</strong>
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Average Completion: <strong style={{ color: "#111827" }}>64%</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
