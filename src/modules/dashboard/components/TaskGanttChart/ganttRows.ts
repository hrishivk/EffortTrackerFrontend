import type { taskList } from "../../../user/types";
import type { GroupedTaskRow, TaskBarStatus, DayInfo, TaskGanttChartProps } from "../../types";
import { monthNames, PROJECT_COLORS } from "../ganttConstants";
import {
  getTaskBarStatus, getTaskProgress, getAssigneeName, generateDayRange, dayIndex,
} from "../ganttUtils";

export type MonthHeader = { label: string; startIdx: number; span: number };

const getProjectName = (task: taskList): string =>
  typeof task.project === "object" && task.project !== null ? task.project.name : (task.project || "");

const getProjectId = (task: taskList) =>
  task.project_id || (typeof task.project === "object" && task.project !== null ? task.project.id : "");

const startOfDay = (value: string) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

export function computeGanttRange(
  tasks: taskList[],
  rangeOffset: number,
  extraBefore: number,
  extraAfter: number,
) {
  let earliest: Date | null = null;
  let latest: Date | null = null;

  for (const task of tasks) {
    const s = task.start_time || task.created_at || null;
    const e = task.end_time || null;
    if (s) {
      const d = startOfDay(s);
      if (!earliest || d < earliest) earliest = d;
    }
    if (e) {
      const d = startOfDay(e);
      if (!latest || d > latest) latest = d;
    }
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (!earliest && !latest) {
    earliest = new Date(now.getFullYear(), now.getMonth(), 1);
    latest = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (!earliest) {
    earliest = new Date(latest!);
    earliest.setDate(earliest.getDate() - 14);
  } else if (!latest) {
    latest = new Date(earliest);
    latest.setDate(latest.getDate() + 14);
  }

  const rStart = new Date(earliest!.getFullYear(), earliest!.getMonth(), 1);
  const rEnd = new Date(latest!.getFullYear(), latest!.getMonth() + 1, 0);

  if (rangeOffset !== 0) {
    rStart.setMonth(rStart.getMonth() + rangeOffset);
    rEnd.setMonth(rEnd.getMonth() + rangeOffset);
  }

  rStart.setMonth(rStart.getMonth() - extraBefore);
  const targetEndMonth = rEnd.getMonth() + extraAfter;
  rEnd.setTime(new Date(rEnd.getFullYear(), targetEndMonth + 1, 0).getTime());

  const days = generateDayRange(rStart, rEnd);

  const startMonth = `${monthNames[rStart.getMonth()]} ${rStart.getFullYear()}`;
  const endMonth = `${monthNames[rEnd.getMonth()]} ${rEnd.getFullYear()}`;
  const label = startMonth === endMonth ? startMonth : `${monthNames[rStart.getMonth()]} – ${endMonth}`;

  return { rangeStart: rStart, rangeDays: days, rangeLabel: label };
}

export function groupGanttRows(
  tasks: taskList[],
  rangeStart: Date,
  totalDays: number,
  projectColorMap: TaskGanttChartProps["projectColorMap"],
  getUserName: TaskGanttChartProps["getUserName"],
): GroupedTaskRow[] {
  const groupMap = new Map<string, taskList[]>();

  for (const task of tasks) {
    const projId = getProjectId(task);
    const desc = (task.description || "").trim();
    const proj = projId ? String(projId) : String(getProjectName(task)).trim();
    const key = `${desc}|||${proj}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(task);
  }

  const rows: GroupedTaskRow[] = [];

  for (const [, groupTasks] of groupMap) {
    const first = groupTasks[0];
    const projName = getProjectName(first);

    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;

    for (const t of groupTasks) {
      const s = t.start_time || t.created_at || null;
      const e = t.end_time || null;
      if (s) {
        const sd = new Date(s);
        if (!earliestStart || sd < earliestStart) earliestStart = sd;
      }
      if (e) {
        const ed = new Date(e);
        if (!latestEnd || ed > latestEnd) latestEnd = ed;
      }
    }

    if (!earliestStart && !latestEnd) continue;

    let startIdx = 0;
    let endIdx = totalDays - 1;

    if (earliestStart) {
      startIdx = Math.max(0, dayIndex(earliestStart, rangeStart));
    }
    if (latestEnd) {
      endIdx = Math.min(totalDays - 1, dayIndex(latestEnd, rangeStart));
    }

    if (!earliestStart && latestEnd) startIdx = Math.max(0, endIdx - 2);
    if (earliestStart && !latestEnd) endIdx = Math.min(startIdx + 2, totalDays - 1);
    if (endIdx - startIdx < 2) endIdx = Math.min(startIdx + 2, totalDays - 1);

    if (startIdx > totalDays - 1 || endIdx < 0) continue;
    startIdx = Math.max(0, startIdx);
    endIdx = Math.min(totalDays - 1, endIdx);

    const assignees = groupTasks.map(t => ({
      name: getAssigneeName(t, getUserName),
      status: getTaskBarStatus(t),
      userId: t.assigned_to,
    }));

    const statusCounts: Record<TaskBarStatus, number> = {
      completed: 0, in_progress: 0, overdue: 0, pending: 0,
    };
    for (const a of assignees) statusCounts[a.status]++;

    let overallStatus: TaskBarStatus = "pending";
    if (statusCounts.overdue > 0) overallStatus = "overdue";
    else if (statusCounts.in_progress > 0) overallStatus = "in_progress";
    else if (statusCounts.completed === assignees.length) overallStatus = "completed";
    else if (statusCounts.completed > 0) overallStatus = "in_progress";

    const totalProgress = groupTasks.reduce((sum, t) => sum + getTaskProgress(t), 0);
    const progress = Math.round(totalProgress / groupTasks.length);

    rows.push({
      description: first.description,
      projectName: projName,
      projectColor: projectColorMap[projName] || PROJECT_COLORS[0],
      tasks: groupTasks,
      assignees,
      startIdx,
      endIdx,
      statusCounts,
      overallStatus,
      progress,
      earliestStart: earliestStart?.toISOString() || null,
      latestEnd: latestEnd?.toISOString() || null,
    });
  }

  rows.sort((a, b) => {
    const aDate = a.earliestStart ? new Date(a.earliestStart).getTime() : Infinity;
    const bDate = b.earliestStart ? new Date(b.earliestStart).getTime() : Infinity;
    return aDate - bDate;
  });

  return rows;
}

export function buildMonthHeaders(rangeDays: DayInfo[]): MonthHeader[] {
  const headers: MonthHeader[] = [];
  let curLabel = "";
  let curStart = 0;
  let curSpan = 0;

  for (let i = 0; i < rangeDays.length; i++) {
    const label = rangeDays[i].monthYear;
    if (label !== curLabel) {
      if (curLabel) headers.push({ label: curLabel, startIdx: curStart, span: curSpan });
      curLabel = label;
      curStart = i;
      curSpan = 1;
    } else {
      curSpan++;
    }
  }
  if (curLabel) headers.push({ label: curLabel, startIdx: curStart, span: curSpan });
  return headers;
}

const SHORT_BAR_LABEL: Record<TaskBarStatus, string> = {
  completed: "DONE", overdue: "!", in_progress: "ACTIVE", pending: "NEW",
};

const LONG_BAR_LABEL: Record<TaskBarStatus, string> = {
  completed: "COMPLETED", overdue: "OVERDUE", in_progress: "IN PROGRESS", pending: "PENDING",
};

export function getBarLabel(row: GroupedTaskRow, barWidthPx: number): string {
  if (row.assignees.length > 1) {
    const done = `${row.statusCounts.completed}/${row.assignees.length}`;
    return barWidthPx < 100 ? done : `${done} Done`;
  }
  return barWidthPx < 120 ? SHORT_BAR_LABEL[row.overallStatus] : LONG_BAR_LABEL[row.overallStatus];
}
