import type { BoardColumnKey, BoardColumnDef } from "../types";


export const BOARD_COLUMNS: BoardColumnDef[] = [
  {
    key: "yet_to_start",
    label: "Yet to Start",
    accent: "#f59e0b",
    tint: "rgba(245, 158, 11, 0.05)",
    border: "rgba(245, 158, 11, 0.25)",
    countBg: "rgba(245, 158, 11, 0.14)",
    countText: "#d97706",
  },
  {
    key: "in_progress",
    label: "In Progress",
    accent: "#3b82f6",
    tint: "rgba(59, 130, 246, 0.05)",
    border: "rgba(59, 130, 246, 0.25)",
    countBg: "rgba(59, 130, 246, 0.12)",
    countText: "#2563eb",
  },
  {
    key: "completed",
    label: "Completed",
    accent: "#22c55e",
    tint: "rgba(34, 197, 94, 0.05)",
    border: "rgba(34, 197, 94, 0.25)",
    countBg: "rgba(34, 197, 94, 0.12)",
    countText: "#16a34a",
  },
  {
    key: "blocked",
    label: "Blocked",
    accent: "#64748b",
    tint: "rgba(100, 116, 139, 0.06)",
    border: "rgba(100, 116, 139, 0.28)",
    countBg: "rgba(100, 116, 139, 0.14)",
    countText: "#475569",
  },
];


export const DEFAULT_LANE_KEYS: string[] = [
  "yet_to_start",
  "in_progress",
  "completed",
];


export type LaneKind = "yet_to_start" | "in_progress" | "completed" | "group";

export const laneKind = (lane?: { statusKey?: string }): LaneKind => {
  const s = lane?.statusKey;
  return s === "yet_to_start" || s === "in_progress" || s === "completed" ? s : "group";
};


const ALLOWED_MOVES: Record<LaneKind, LaneKind[]> = {
  yet_to_start: ["in_progress"],
  in_progress: ["completed"],
  completed: ["group"],
  group: ["group"],
};


export const dropDenialReason = (from: LaneKind, to: LaneKind): string | null => {
  if (ALLOWED_MOVES[from].includes(to)) return null;
  if (from === "group") return "A task in a group cannot be moved back to a status";
  if (to === "group") return "A task must be completed before it can be moved to a group";
  if (from === "yet_to_start" && to === "completed")
    return "A task must be started before it can be completed";
  if (from === "in_progress" && to === "yet_to_start")
    return "A task in progress cannot go back to yet to start";
  if (from === "completed") return "A completed task cannot be reopened";
  return "That move is not allowed";
};


export const findGroupForStatus = <T extends { name: string; status?: string }>(
  groups: T[],
  status: string
): T | undefined =>
  groups.find((g) => (g.status || groupNameToStatus(g.name)) === status);


export const STATUS_LANE_ORDER = ["yet_to_start", "in_progress", "completed", "blocked"];

export const groupNameToStatus = (name: string): string | undefined => {
  const s = (name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (s === "to_do" || s === "todo" || s === "yet_to_start" || s === "not_started")
    return "yet_to_start";
  if (s === "in_progress" || s === "inprogress" || s === "doing") return "in_progress";
  if (s === "completed" || s === "complete" || s === "done") return "completed";
  if (s === "blocked") return "blocked";
  return undefined;
};


export const toBoardColumnKey = (status?: string | null): BoardColumnKey => {
  const s = (status || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "completed" || s === "complete" || s === "done") return "completed";

  if (
    s === "in_progress" ||
    s === "inprogress" ||
    s === "active" ||
    s === "review" ||
    s === "in_review"
  )
    return "in_progress";
  if (s === "blocked") return "blocked";
  return "yet_to_start";
};

export const slugifyGroup = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");


export const STATUS_ACCENT: Record<string, string> = {
  yet_to_start: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#22c55e",
  blocked: "#64748b",
};

/** Colours offered when naming a new group. */
export const GROUP_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#7c3aed",
  "#0ea5e9",
  "#ec4899",
  "#9ca3af",
];


export const GROUP_NAME_MAX = 40;

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};


export const paletteFromAccent = (accent: string) => ({
  accent,
  tint: hexToRgba(accent, 0.05),
  border: hexToRgba(accent, 0.25),
  countBg: hexToRgba(accent, 0.12),
  countText: accent,
});

export const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  HIGH: { color: "#dc2626", bg: "rgba(239, 68, 68, 0.12)" },
  MEDIUM: { color: "#d97706", bg: "rgba(245, 158, 11, 0.14)" },
  LOW: { color: "#2563eb", bg: "rgba(59, 130, 246, 0.12)" },
};


export const BOARD_COLUMN_MIN_WIDTH = 216;
export const BOARD_COLUMN_MIN_WIDTH_COMPACT = 186;


export const BOARD_AUTOSCROLL_EDGE = 72;
export const BOARD_AUTOSCROLL_STEP = 18;


export const AUTO_COMPACT_ABOVE = 24;


export const BOARD_DRAG_TYPE = "application/x-task-card";


export const BOARD_LANE_MIN_HEIGHT = 340;


export const BOARD_LANE_MAX_HEIGHT = "58vh";


export const GROUP_LANE_PREFIX = "group:";
export const groupLaneKey = (groupId: string) => `${GROUP_LANE_PREFIX}${groupId}`;
