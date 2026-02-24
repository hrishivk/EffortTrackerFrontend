import { useCallback, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAppSelector } from "../../../store/configureStore";
import { fetchTask } from "../../../core/actions/action";
import type { taskList } from "../../user/types";

function getWeekDays(): { label: string; short: string; date: Date }[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day === 0 ? 7 : day) - 1));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      short: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      date: d,
    };
  });
}

interface DayCount {
  completed: number;
  inProgress: number;
  yetToStart: number;
}

export const WeeklyProgressChart = () => {
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const userId = user?.id;

  const [weekData, setWeekData] = useState<DayCount[]>(
    Array(7).fill({ completed: 0, inProgress: 0, yetToStart: 0 })
  );
  const [loading, setLoading] = useState(true);

  const weekDays = getWeekDays();

  const loadWeekData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const results: DayCount[] = [];
      for (const day of weekDays) {
        try {
          const res = await fetchTask(day.date, String(userId), role, {});
          const tasks = res?.data || [];
          let completed = 0;
          let inProgress = 0;
          let yetToStart = 0;
          tasks.forEach((t: any) => {
            const s = (t.status || "").toLowerCase().replace(/[\s_]+/g, "_");
            if (s === "completed" || s === "done") completed++;
            else if (s === "in_progress") inProgress++;
            else yetToStart++;
          });
          results.push({ completed, inProgress, yetToStart });
        } catch {
          results.push({ completed: 0, inProgress: 0, yetToStart: 0 });
        }
      }
      setWeekData(results);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  const totalCompleted = weekData.reduce((s, d) => s + d.completed, 0);
  const totalInProgress = weekData.reduce((s, d) => s + d.inProgress, 0);
  const totalTasks = weekData.reduce(
    (s, d) => s + d.completed + d.inProgress + d.yetToStart,
    0
  );

  const chartData = {
    labels: weekDays.map((d) => d.label),
    datasets: [
      {
        label: "Completed",
        data: weekData.map((d) => d.completed),
        backgroundColor: "#9333ea",
        borderRadius: 6,
        borderSkipped: false as const,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: "In Progress",
        data: weekData.map((d) => d.inProgress),
        backgroundColor: "#c084fc",
        borderRadius: 6,
        borderSkipped: false as const,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: "Yet to Start",
        data: weekData.map((d) => d.yetToStart),
        backgroundColor: "#e9d5ff",
        borderRadius: 6,
        borderSkipped: false as const,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, weight: "bold" },
          color: "#9ca3af",
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: {
          font: { size: 11 },
          color: "#9ca3af",
          stepSize: 1,
        },
        border: { display: false },
      },
    },
  };

  const todayIdx = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weekDays.findIndex(
      (d) => d.date.getTime() === today.getTime()
    );
  })();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold text-gray-800" style={{ fontSize: "1.25rem" }}>
            Weekly Progress
          </h2>
          <p className="text-gray-400 mb-0" style={{ fontSize: 12 }}>
            {weekDays[0].short} - {weekDays[6].short}
          </p>
        </div>
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                backgroundColor: "#9333ea",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Completed</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                backgroundColor: "#c084fc",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, color: "#6b7280" }}>In Progress</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                backgroundColor: "#e9d5ff",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Yet to Start</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="d-flex gap-4 mb-4">
        <div
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 12,
            backgroundColor: "#f5f3ff",
            border: "1px solid #ede9fe",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Total Tasks
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            {loading ? "-" : totalTasks}
          </p>
        </div>
        <div
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 12,
            backgroundColor: "#faf5ff",
            border: "1px solid #f3e8ff",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: "#9333ea", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Completed
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            {loading ? "-" : totalCompleted}
          </p>
        </div>
        <div
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 12,
            backgroundColor: "#faf5ff",
            border: "1px solid #f3e8ff",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>
            In Progress
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            {loading ? "-" : totalInProgress}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220, position: "relative" }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <span style={{ color: "#9ca3af", fontSize: 13 }}>Loading...</span>
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Day labels with dates */}
      <div className="d-flex justify-content-between mt-2" style={{ paddingInline: 20 }}>
        {weekDays.map((d, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: 10,
                color: i === todayIdx ? "#7c3aed" : "#9ca3af",
                fontWeight: i === todayIdx ? 700 : 500,
              }}
            >
              {d.short}
            </span>
            {i === todayIdx && (
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  backgroundColor: "#7c3aed",
                  margin: "2px auto 0",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH:   { label: "HIGH PRIORITY", color: "#dc2626", bg: "#fef2f2" },
  MEDIUM: { label: "MEDIUM",        color: "#d97706", bg: "#fffbeb" },
  LOW:    { label: "LOW",           color: "#2563eb", bg: "#eff6ff" },
};

function formatDueLabel(dateStr?: string | null): string {
  if (!dateStr) return "";
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  const dayMs = 86400000;

  if (diff === 0) {
    const d = new Date(dateStr);
    return `Today, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diff === dayMs) return "Tomorrow";
  if (diff === -dayMs) return "Yesterday";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const MyActiveTasks = ({ onViewAll }: { onViewAll?: () => void }) => {
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const userId = user?.id;

  const [tasks, setTasks] = useState<taskList[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetchTask(new Date(), String(userId), role, {});
      const all: taskList[] = res?.data || [];
      // Only show active tasks (not completed)
      const active = all.filter((t) => {
        const s = (t.status || "").toLowerCase().replace(/[\s_]+/g, "_");
        return s !== "completed" && s !== "done";
      });
      setTasks(active);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-gray-800 mb-0" style={{ fontSize: "1.25rem" }}>
          My Active Tasks
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              background: "none",
              border: "none",
              color: "#7c3aed",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View All &rarr;
          </button>
        )}
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-4">
          <span style={{ color: "#9ca3af", fontSize: 13 }}>Loading...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div
          className="d-flex flex-column align-items-center justify-content-center py-5"
          style={{ color: "#9ca3af" }}
        >
          <span style={{ fontSize: 32, marginBottom: 8 }}>&#10003;</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>No active tasks</span>
          <span style={{ fontSize: 12 }}>You're all caught up!</span>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {tasks.slice(0, 5).map((task, i) => {
            const prio = PRIORITY_CONFIG[(task.priority || "").toUpperCase()] || PRIORITY_CONFIG.LOW;
            const projName =
              typeof task.project === "object" && task.project !== null
                ? (task.project as any).name
                : task.project || "";
            const dueLabel = formatDueLabel(task.end_time);
            const s = (task.status || "").toLowerCase().replace(/[\s_]+/g, "_");
            const isInProgress = s === "in_progress";

            return (
              <div
                key={task.id || i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: 14,
                  backgroundColor: "#fafafa",
                  border: "1px solid #f0f0f0",
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#f5f3ff";
                  (e.currentTarget as HTMLElement).style.borderColor = "#ede9fe";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#fafafa";
                  (e.currentTarget as HTMLElement).style.borderColor = "#f0f0f0";
                }}
              >
                <div className="d-flex align-items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                  {/* Status circle */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: isInProgress ? "3px solid #7c3aed" : "2px solid #d1d5db",
                      backgroundColor: isInProgress ? "#f5f3ff" : "#fff",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isInProgress && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "#7c3aed",
                        }}
                      />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111827",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {task.description}
                    </p>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: prio.color,
                          backgroundColor: prio.bg,
                          padding: "2px 8px",
                          borderRadius: 4,
                          letterSpacing: 0.3,
                        }}
                      >
                        {prio.label}
                      </span>
                      {projName && (
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
                          {projName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3 flex-shrink-0">
                  {dueLabel && (
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                      {dueLabel}
                    </span>
                  )}
                  <OpenInNewIcon sx={{ fontSize: 16, color: "#d1d5db" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
