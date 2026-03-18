import type { taskList } from "../../user/types";
import type { TaskBarStatus, DayInfo } from "../types";
import { monthAbbr, monthNames, dayNames } from "./ganttConstants";

export function getTaskBarStatus(task: taskList): TaskBarStatus {
  const s = (task.status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done") return "completed";
  if (task.end_time) {
    const end = new Date(task.end_time);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today && s !== "completed" && s !== "done") return "overdue";
  }
  if (s === "in_progress") return "in_progress";
  return "pending";
}

export function getTaskProgress(task: taskList): number {
  if (task.progress !== undefined) return task.progress;
  const s = (task.status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done") return 100;
  if (s === "review") return 90;
  if (s === "in_progress") return 50;
  return 0;
}

export function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function formatShortDate(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export function getAssigneeName(task: taskList, getUserName: (id: any) => string): string {
  if (task.dailyLog?.assignedUser?.fullName) return task.dailyLog.assignedUser.fullName;
  if (task.assigned_to) return getUserName(task.assigned_to);
  return "Unassigned";
}

export function generateDayRange(start: Date, end: Date): DayInfo[] {
  const days: DayInfo[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);

  while (cur <= endD) {
    const dow = cur.getDay();
    const d = cur.getDate();
    const m = cur.getMonth();
    const y = cur.getFullYear();
    days.push({
      date: new Date(cur),
      day: d,
      month: m,
      year: y,
      dow,
      isWeekend: dow === 0 || dow === 6,
      isToday: cur.getTime() === today.getTime(),
      isFirstOfMonth: d === 1,
      label: `${monthAbbr[m]} ${String(d).padStart(2, "0")}`,
      dowLabel: dayNames[dow],
      monthYear: `${monthNames[m]} ${y}`,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function dayIndex(date: Date, rangeStart: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const s = new Date(rangeStart);
  s.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - s.getTime()) / 86400000);
}
