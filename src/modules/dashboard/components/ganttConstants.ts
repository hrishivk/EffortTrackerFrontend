import type { TaskBarStatus } from "../types";

export const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const monthAbbr = [
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC",
];

export const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export const PROJECT_COLORS = [
  { bg: "#dbeafe", text: "#2563eb", dot: "#2563eb" },
  { bg: "#dcfce7", text: "#16a34a", dot: "#16a34a" },
  { bg: "#fae8ff", text: "#a855f7", dot: "#a855f7" },
  { bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" },
  { bg: "#fef3c7", text: "#d97706", dot: "#d97706" },
  { bg: "#e0e7ff", text: "#4f46e5", dot: "#4f46e5" },
  { bg: "#ccfbf1", text: "#0d9488", dot: "#0d9488" },
  { bg: "#fce7f3", text: "#db2777", dot: "#db2777" },
];

export const avatarColors = [
  "#7c3aed","#2563eb","#16a34a","#dc2626",
  "#d97706","#db2777","#0d9488","#4f46e5",
];

export const taskBarColors: Record<TaskBarStatus, { bg: string; text: string }> = {
  completed:   { bg: "linear-gradient(90deg, #9333ea, #a855f7)", text: "#fff" },
  in_progress: { bg: "linear-gradient(90deg, #7c3aed, #9333ea)", text: "#fff" },
  overdue:     { bg: "linear-gradient(90deg, #ea580c, #ef4444)", text: "#fff" },
  pending:     { bg: "linear-gradient(90deg, #c084fc, #d8b4fe)", text: "#fff" },
};

export const statusDisplay: Record<TaskBarStatus, { label: string; color: string; bg: string }> = {
  completed:   { label: "Done",       color: "#7c3aed", bg: "#f3e8ff" },
  in_progress: { label: "InProgress", color: "#9333ea", bg: "#f5f3ff" },
  overdue:     { label: "Overdue",    color: "#dc2626", bg: "#fee2e2" },
  pending:     { label: "Not Yet",    color: "#6b7280", bg: "#f3f4f6" },
};

export const BASE_COL_WIDTH = 50;
export const LEFT_PANEL_WIDTH = 380;
export const ROW_HEIGHT = 72;
