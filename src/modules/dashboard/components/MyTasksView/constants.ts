import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import type { ProjectColor } from "./types";

export const PROJECT_COLORS: ProjectColor[] = [
  { bg: "#dbeafe", text: "#2563eb", dot: "#2563eb" },
  { bg: "#dcfce7", text: "#16a34a", dot: "#16a34a" },
  { bg: "#fae8ff", text: "#a855f7", dot: "#a855f7" },
  { bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" },
  { bg: "#fef3c7", text: "#d97706", dot: "#d97706" },
  { bg: "#e0e7ff", text: "#4f46e5", dot: "#4f46e5" },
  { bg: "#ccfbf1", text: "#0d9488", dot: "#0d9488" },
  { bg: "#fce7f3", text: "#db2777", dot: "#db2777" },
];

export const TAB_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

export const VIEW_TABS = [
  { key: "list" as const,  label: "List View",   shortLabel: "List",  icon: FormatListBulletedIcon },
  { key: "board" as const, label: "Board View",  shortLabel: "Board", icon: ViewKanbanOutlinedIcon },
  { key: "gantt" as const, label: "Gantt Chart", shortLabel: "Gantt", icon: TimelineIcon },
];

export const PRIORITY_DOT: Record<string, string> = {
  HIGH: "#dc2626",
  High: "#dc2626",
  MEDIUM: "#f59e0b",
  Medium: "#f59e0b",
  LOW: "#2563eb",
  Low: "#2563eb",
};

export const PRIORITY_CHOICES = [
  { key: "HIGH", label: "HIGH", icon: "!", color: "#dc2626", bg: "#fef2f2" },
  { key: "MEDIUM", label: "MEDIUM", icon: "=", color: "#d97706", bg: "#fffbeb" },
  { key: "LOW", label: "LOW", icon: "⚡", color: "#7c3aed", bg: "#f5f3ff" },
];

export const SLIP_OPTIONS = [
  { value: "1", label: "Has been extended" },
  { value: "2", label: "Extended twice or more" },
  { value: "3", label: "Extended three times or more" },
];

export const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiInputBase-input": { padding: "8px 14px", fontSize: 13, color: "var(--text-primary)" },
};

export const fixedSelectSx = {
  ...selectSx,
  "& .MuiOutlinedInput-root": {
    ...selectSx["& .MuiOutlinedInput-root"],
    backgroundColor: "var(--bg-hover)",
    "&.Mui-disabled": {
      "& fieldset": { borderColor: "var(--border-light)" },
      "& .MuiSelect-select": {
        WebkitTextFillColor: "var(--text-secondary)",
        color: "var(--text-secondary)",
      },
    },
  },
  "& .MuiSvgIcon-root.Mui-disabled": { display: "none" },
};

export const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

export const ITEMS_PER_PAGE = 5;

export const BOARD_TASK_LIMIT = 200;

export const avatarColors = [
  "#7c3aed",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#db2777",
  "#0d9488",
  "#4f46e5",
];

export const PRIMARY_GRADIENT = "linear-gradient(135deg, #7c3aed, #a855f7)";
