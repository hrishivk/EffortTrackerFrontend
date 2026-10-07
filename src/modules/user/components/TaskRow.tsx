import React from "react";
import type { taskList } from "../types";
import { formatDuration, formatTime, projectName } from "../utils/taskTime";

const PRIORITY_CLASS: Record<string, string> = {
  High: "bg-[#FF7779] text-white",
  Medium: "bg-[#FFC574] text-white",
  Low: "bg-[#6ACD79] text-white",
};

const STATUS_CLASS: Record<string, string> = {
  Completed: "bg-[#2BA912] text-white",
  "In Progress": "bg-[#3A96FF] text-white",
  "yet to start": "bg-[#FFA041] text-white",
};

type Props = {
  task: taskList;
  onStatusChange: (taskId: string | undefined, newStatus: string) => void;
};

const TaskRow: React.FC<Props> = ({ task, onStatusChange }) => (
  <tr className="hover:bg-gray-50" style={{ backgroundColor: "var(--bg-card)" }}>
    <td className="px-4 py-4">{projectName(task.project)}</td>
    <td className="px-4 py-4 text-purple-600">{task.description}</td>
    <td className="px-4 py-4">
      <select
        value={task.priority}
        className={`status-badge px-4 py-2 rounded-full text-xs font-medium ${
          PRIORITY_CLASS[task.priority] ?? ""
        }`}
        disabled
      >
        <option value={task.priority}>{task.priority}</option>
      </select>
    </td>
    <td className="px-4 py-4">
      <span>{formatTime(task.start_time, "Not Started")}</span>
    </td>
    <td className="px-4 py-4">
      <span>{formatTime(task.end_time, "Not Ended")}</span>
    </td>
    <td className="px-2 py-4">
      <span>{formatDuration(task.start_time, task.end_time)}</span>
    </td>
    <td className="px-4 py-4">
      <select
        value={task.status}
        className={`status-badge ${STATUS_CLASS[task.status ?? ""] ?? ""}`}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
      >
        <option value="yet to start">{task.status}</option>
        {task.status === "yet to start" && (
          <option value="In Progress">In Progress</option>
        )}
        {task.status === "In Progress" && (
          <option value="Completed">Completed</option>
        )}
      </select>
    </td>
  </tr>
);

export default TaskRow;
