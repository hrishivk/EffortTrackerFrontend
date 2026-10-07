import type { taskList } from "../types";
import { formatDuration, formatTime, projectName } from "./taskTime";

const HEADERS = [
  "Project",
  "Task Description",
  "Priority",
  "Start Time",
  "End Time",
  "Total Spent",
  "Status",
];

export const exportTasksCsv = (tasks: taskList[], date: Date) => {
  if (!tasks || tasks.length === 0) return;

  const rows = tasks.map((task) => [
    projectName(task.project) || "",
    task.description || "",
    task.priority || "",
    formatTime(task.start_time, "Not Started"),
    formatTime(task.end_time, "Not Ended"),
    formatDuration(task.start_time, task.end_time) || "0",
    task.status || "",
  ]);

  const csvContent = [
    HEADERS.join(","),
    ...rows.map((r) =>
      r.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const BOM = "﻿";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `tasks_${date.toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
