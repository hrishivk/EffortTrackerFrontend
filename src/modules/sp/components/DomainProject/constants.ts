import type { TabItem } from "../../types";

export const allTabs: TabItem[] = [
  { key: "overview", label: "Overview" },
  { key: "Gantt chart", label: "Gantt chart" },
];

export const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiSelect-select": { padding: "6px 12px" },
  "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" },
};

export const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

export const TASK_PROJECT_COLORS = [
  { bg: "#fae8ff", text: "#a855f7", dot: "#a855f7" },
  { bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" },
  { bg: "#fef3c7", text: "#d97706", dot: "#d97706" },
  { bg: "#e0e7ff", text: "#4f46e5", dot: "#4f46e5" },
  { bg: "#ccfbf1", text: "#0d9488", dot: "#0d9488" },
  { bg: "#fce7f3", text: "#db2777", dot: "#db2777" },
];

export const pdAvatarColors = [
  "#7c3aed", "#2563eb", "#16a34a", "#dc2626",
  "#d97706", "#db2777", "#0d9488", "#4f46e5",
];

export const PROJECT_STATUS_OPTIONS = [
  { value: "active", label: "Active", desc: "Project is in progress", color: "#059669", bg: "#ecfdf5" },
  { value: "on_hold", label: "On Hold", desc: "Temporarily paused, awaiting input", color: "#ea580c", bg: "#fff7ed" },
  { value: "paused", label: "Paused", desc: "Work stopped, needs review", color: "#d97706", bg: "#fef3c7" },
  { value: "completed", label: "Completed", desc: "All tasks finished", color: "#16a34a", bg: "#f0fdf4" },
];
