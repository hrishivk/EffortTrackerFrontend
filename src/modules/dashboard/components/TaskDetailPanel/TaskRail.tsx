import type React from "react";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import type { taskList } from "../../../user/types";
import { assigneeOf } from "../../../../shared/utils/subtasks";
import { PRIORITY_STYLE } from "../boardConstants";
import TaskTimer from "../TaskTimer";
import { showDate, statusFace } from "./tdpUtils";

interface TaskRailProps {
  task: taskList;
  projName: string;
  percent: number;
  action: React.ReactNode;
}

export default function TaskRail({ task, projName, percent, action }: TaskRailProps) {
  const face = statusFace(task.status);
  const prio = PRIORITY_STYLE[(task.priority || "").toUpperCase()];

  const facts: { icon: React.ElementType; label: string; value: React.ReactNode }[] = [
    { icon: CalendarTodayOutlinedIcon, label: "Due Date", value: showDate(task.due_date) },
    { icon: CalendarTodayOutlinedIcon, label: "Start Date", value: showDate(task.start_date) },
    {
      icon: FlagOutlinedIcon,
      label: "Priority",
      value: prio ? (
        <span className="tdp__chip" style={{ backgroundColor: prio.bg, color: prio.color }}>
          {(task.priority || "").toUpperCase()}
        </span>
      ) : (
        "--"
      ),
    },
    {
      icon: PersonOutlineIcon,
      label: "Assignee",
      value: assigneeOf(task)?.fullName ?? "Unassigned",
    },
    { icon: FolderOutlinedIcon, label: "Project", value: projName || "--" },
  ];

  if (task.tags?.length) {
    facts.push({
      icon: LocalOfferOutlinedIcon,
      label: "Labels",
      value: (
        <span className="tdp__fact-tags">
          {task.tags.map((t) => (
            <span key={t} className="tdp__chip tdp__chip--tag">
              {t}
            </span>
          ))}
        </span>
      ),
    });
  }

  return (
    <aside className="tdp__rail">
      <div className="tdp__idcard">
        <div className="tdp__idcard-head">
          <span className="tdp__idcard-badge">
            <AccountTreeOutlinedIcon sx={{ fontSize: 17 }} />
          </span>
          <span style={{ minWidth: 0 }}>
            <p className="tdp__idcard-name" title={task.description}>
              {task.description}
            </p>
            <span
              className="tdp__chip"
              style={{ backgroundColor: face.bg, color: face.color }}
            >
              {face.label}
            </span>
          </span>
        </div>

        <div className="tdp__idcard-progress">
          <span>Progress</span>
          <strong>{percent}%</strong>
        </div>
        <span className="tdp__bar">
          <span className="tdp__bar-fill" style={{ width: `${percent}%` }} />
        </span>
      </div>

      <div className="tdp__facts">
        {facts.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="tdp__fact">
              <span className="tdp__fact-icon">
                <Icon sx={{ fontSize: 16 }} />
              </span>
              <span style={{ minWidth: 0 }}>
                <p className="tdp__fact-label">{f.label}</p>
                <p className="tdp__fact-value">{f.value}</p>
              </span>
            </div>
          );
        })}
      </div>

      <div className="tdp__timer">
        <TimerOutlinedIcon sx={{ fontSize: 19, color: "#7c3aed" }} />
        <p className="tdp__timer-title">Time on this task</p>
        <p className="tdp__timer-note">
          Tracked on the main task alone — each subtask keeps its own.
        </p>
        <div className="tdp__timer-clock">
          <TaskTimer
            status={task.status}
            startTime={task.start_time}
            endTime={task.end_time}
            totalSeconds={task.total_seconds}
          />
        </div>
        <div className="tdp__timer-action">{action}</div>
      </div>
    </aside>
  );
}
