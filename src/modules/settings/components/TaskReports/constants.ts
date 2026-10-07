import { FiUser, FiUsers } from "react-icons/fi";
import type { ReportPrevious, ReportTotals } from "../../../../core/actions/reportAction";

export interface Proj {
  id: string;
  name: string;
}

export interface Person {
  id?: string | number;
  fullName?: string;
  email?: string;
  role?: string;
  projects?: Proj[];
}

export interface Group {
  id: string;
  name: string;
}

export type Scope = "user" | "team";

export const PEOPLE_PAGE = 10;

export const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "15", label: "Last 15 days", days: 15 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
];

export const CUSTOM = "custom";

export const SCREEN_ROWS = 8;
export const PRINT_ROWS = 15;

export const MAX_RANGE_DAYS = 366;

export const fmtRange = (a: Date, b: Date) => {
  const day = (d: Date) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  return `${day(a)} – ${day(b)}, ${b.getFullYear()}`;
};

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-surface)",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
    },
  },
  "& .MuiInputBase-input": { padding: "10px 14px", fontSize: 13, fontWeight: 600 },
  "& .MuiSelect-select": { padding: "10px 14px" },
};

export const valueSx = (filled: boolean) => ({
  color: filled ? "var(--text-primary)" : "var(--text-faint)",
});

export const TAB_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

export const SCOPES = [
  { key: "user" as const, label: "Individual", Icon: FiUser },
  { key: "team" as const, label: "Team", Icon: FiUsers },
];

export const AXIS = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 10, fill: "var(--text-faint)" },
} as const;

export const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid var(--border-light)",
  backgroundColor: "var(--bg-card)",
  fontSize: 12,
};

export const CHART_MARGIN = { top: 6, right: 6, bottom: 0, left: -18 };

export const EMPTY_TOTALS: ReportTotals = {
  tasks_worked: 0,
  completed: 0,
  in_progress: 0,
  pending: 0,
  completion_rate: 0,
  total_seconds: 0,
  avg_seconds_per_task: 0,
  active_rate: 0,
  today_seconds: 0,
};

export const EMPTY_PREVIOUS: ReportPrevious = { tasks_worked: 0, completed: 0, total_seconds: 0 };
