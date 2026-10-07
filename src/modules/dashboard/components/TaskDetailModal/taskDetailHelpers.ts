import type { taskList } from "../../../user/types";
import { parseServerTime } from "../../../../shared/utils/serverTime";

export const PROJECT_COLORS = [
  { bg: "#dbeafe", text: "#2563eb" },
  { bg: "#dcfce7", text: "#16a34a" },
  { bg: "#fae8ff", text: "#a855f7" },
  { bg: "#fee2e2", text: "#dc2626" },
  { bg: "#fef3c7", text: "#d97706" },
  { bg: "#e0e7ff", text: "#4f46e5" },
];

export const priorityConfig: Record<string, { color: string; bg: string }> = {
  high:   { color: "#dc2626", bg: "#fef2f2" },
  medium: { color: "#d97706", bg: "#fffbeb" },
  low:    { color: "#7c3aed", bg: "#f5f3ff" },
};

export function normalizeStatus(status?: string) {
  return (status || "").toLowerCase().replace(/[\s_]+/g, "_");
}

export function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function getStatusInfo(status: string) {
  const s = normalizeStatus(status);
  if (s === "completed" || s === "done")
    return { label: "COMPLETED", color: "#16a34a", bg: "#dcfce7" };
  if (s === "in_progress")
    return { label: "IN PROGRESS", color: "#2563eb", bg: "#dbeafe" };
  if (s === "review")
    return { label: "REVIEW", color: "#d97706", bg: "#fef3c7" };
  return { label: "YET TO START", color: "#9333ea", bg: "#f5f3ff" };
}

export function formatDate(d?: string | null) {
  if (!d) return "-";
  const ms = parseServerTime(d);
  if (Number.isNaN(ms)) return "-";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function isOverdue(task: taskList) {
  if (!task.end_time) return false;
  const end = new Date(parseServerTime(task.end_time));
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = normalizeStatus(task.status);
  return end < today && s !== "completed" && s !== "done";
}
