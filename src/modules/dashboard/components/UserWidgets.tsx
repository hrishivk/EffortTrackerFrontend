import { useCallback, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useAppSelector } from "../../../store/configureStore";
import { fetchTask } from "../../../core/actions/action";
import type { taskList } from "../../user/types";
import {
  CHART_OPTIONS,
  SERIES,
  getWeekDays,
  normalizeStatus,
  type DayCount,
} from "./UserWidgets/weeklyChartConfig";
import ActiveTaskItem from "./UserWidgets/ActiveTaskItem";

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
          tasks.forEach((t: taskList) => {
            const s = normalizeStatus(t.status);
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
    datasets: SERIES.map((series) => ({
      label: series.label,
      data: weekData.map((d) => d[series.key]),
      backgroundColor: series.color,
      borderRadius: 6,
      borderSkipped: false as const,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    })),
  };

  const statTiles = [
    { label: "Total Tasks", value: totalTasks, color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
    { label: "Completed", value: totalCompleted, color: "#9333ea", bg: "#faf5ff", border: "#f3e8ff" },
    { label: "In Progress", value: totalInProgress, color: "#a855f7", bg: "#faf5ff", border: "#f3e8ff" },
  ];

  const todayIdx = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weekDays.findIndex(
      (d) => d.date.getTime() === today.getTime()
    );
  })();

  return (
    <div className="rounded-2xl shadow-sm border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold" style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>
            Weekly Progress
          </h2>
          <p className="mb-0" style={{ fontSize: 12, color: "var(--text-faint)" }}>
            {weekDays[0].short} - {weekDays[6].short}
          </p>
        </div>
        <div className="d-flex align-items-center gap-4">
          {SERIES.map((series) => (
            <div key={series.key} className="d-flex align-items-center gap-1">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: series.color,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{series.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex gap-4 mb-4">
        {statTiles.map((tile) => (
          <div
            key={tile.label}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              backgroundColor: tile.bg,
              border: `1px solid ${tile.border}`,
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: tile.color, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {tile.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {loading ? "-" : tile.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ height: 220, position: "relative" }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <span style={{ color: "var(--text-faint)", fontSize: 13 }}>Loading...</span>
          </div>
        ) : (
          <Bar data={chartData} options={CHART_OPTIONS} />
        )}
      </div>

      <div className="d-flex justify-content-between mt-2" style={{ paddingInline: 20 }}>
        {weekDays.map((d, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: 10,
                color: i === todayIdx ? "#7c3aed" : "var(--text-faint)",
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
      const active = all.filter((t) => {
        const s = normalizeStatus(t.status);
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
    <div className="rounded-2xl shadow-sm border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>
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
          <span style={{ color: "var(--text-faint)", fontSize: 13 }}>Loading...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div
          className="d-flex flex-column align-items-center justify-content-center py-5"
          style={{ color: "var(--text-faint)" }}
        >
          <span style={{ fontSize: 32, marginBottom: 8 }}>&#10003;</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>No active tasks</span>
          <span style={{ fontSize: 12 }}>You're all caught up!</span>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {tasks.slice(0, 5).map((task, i) => (
            <ActiveTaskItem key={task.id || i} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
