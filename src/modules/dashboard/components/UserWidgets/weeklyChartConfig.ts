import type { ChartOptions } from "chart.js";

export interface DayCount {
  completed: number;
  inProgress: number;
  yetToStart: number;
}

export const normalizeStatus = (status?: string) =>
  (status || "").toLowerCase().replace(/[\s_]+/g, "_");

export function getWeekDays(): { label: string; short: string; date: Date }[] {
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

export const SERIES: { key: keyof DayCount; label: string; color: string }[] = [
  { key: "completed", label: "Completed", color: "#9333ea" },
  { key: "inProgress", label: "In Progress", color: "#c084fc" },
  { key: "yetToStart", label: "Yet to Start", color: "#e9d5ff" },
];

export const CHART_OPTIONS: ChartOptions<"bar"> = {
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
        color: "var(--text-faint)",
      },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: "var(--border-light)" },
      ticks: {
        font: { size: 11 },
        color: "var(--text-faint)",
        stepSize: 1,
      },
      border: { display: false },
    },
  },
};
