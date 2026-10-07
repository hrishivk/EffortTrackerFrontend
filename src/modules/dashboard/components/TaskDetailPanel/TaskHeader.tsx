import CloseIcon from "@mui/icons-material/Close";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import LowPriorityRoundedIcon from "@mui/icons-material/LowPriorityRounded";

import type { taskList } from "../../../user/types";
import { isTaskRunning } from "../../../../shared/utils/taskTime";
import { initialsOf, statusFace } from "./tdpUtils";
import type { TeamMember } from "./useTaskSummary";

interface TaskHeaderProps {
  task: taskList;
  projName: string;
  done: number;
  total: number;
  team: TeamMember[];
  onClose: () => void;
}

export default function TaskHeader({
  task,
  projName,
  done,
  total,
  team,
  onClose,
}: TaskHeaderProps) {
  const face = statusFace(task.status);

  return (
    <div className="tdp__top">
      <span className="tdp__top-badge">
        <AccountTreeOutlinedIcon sx={{ fontSize: 21 }} />
      </span>

      <div className="tdp__top-text">
        <div className="tdp__top-title-row">
          <h3 className="tdp__top-title" title={task.description}>
            {task.description}
          </h3>
          <span className="tdp__chip" style={{ backgroundColor: face.bg, color: face.color }}>
            {isTaskRunning(task) && <span className="task-running-dot" />}
            {face.label}
          </span>
          {task.sequential && (
            <span
              className="tdp__chip tdp__chip--seq"
              title="Each subtask starts only once the one before it is completed"
            >
              <LowPriorityRoundedIcon sx={{ fontSize: 12 }} />
              In order
            </span>
          )}
        </div>
        <p className="tdp__top-sub">
          {[projName, `${done} of ${total} done`].filter(Boolean).join("  ·  ")}
        </p>
      </div>

      <div className="tdp__stack" title={team.map((m) => m.name).join(", ")}>
        {team.slice(0, 4).map((m) => (
          <span key={m.id} className="tdp__stack-avatar">
            {initialsOf(m.name)}
          </span>
        ))}
        {team.length > 4 && (
          <span className="tdp__stack-avatar tdp__stack-avatar--more">
            +{team.length - 4}
          </span>
        )}
      </div>

      <button type="button" className="tdp__icon-btn" onClick={onClose} title="Close">
        <CloseIcon sx={{ fontSize: 18 }} />
      </button>
    </div>
  );
}
