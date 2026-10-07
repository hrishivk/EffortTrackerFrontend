import type { ProjectStatus } from "../../../types/GanttChart";

export const statusConfig: Record<ProjectStatus, { color: string; bg: string }> = {
  "ON TRACK": { color: "#7c3aed", bg: "#f3e8ff" },
  COMPLETED: { color: "#9333ea", bg: "#f5f3ff" },
  DELAYED: { color: "#6d28d9", bg: "#ede9fe" },
};

// Every bar type currently shares one style; kept as a map so types can diverge.
const purpleBar = { bg: "linear-gradient(90deg, #9333ea, #7c3aed)", text: "#fff" };
export const barStyles: Record<string, { bg: string; text: string }> = {
  active: purpleBar,
  completed: purpleBar,
  delayed: purpleBar,
  green: purpleBar,
};

export const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: 13,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiSelect-select": { padding: "6px 12px", color: "var(--text-primary)" },
};

export const ROW_HEIGHT = 56;
