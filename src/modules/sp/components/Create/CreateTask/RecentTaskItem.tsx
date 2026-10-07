import { IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import type { taskList } from "../../../../user/types";
import InitialsAvatar from "./InitialsAvatar";
import { cardStyle, priorityColors, priorityIcons } from "./constants";
import { formatTaskDeadline } from "./utils";

type Props = {
  task: taskList;
  assignedName: string;
  onMenuOpen: (anchor: HTMLElement, taskId: string) => void;
};

const RecentTaskItem = ({ task, assignedName, onMenuOpen }: Props) => {
  const priority = (task.priority || "LOW").toUpperCase();
  const pColor = priorityColors[priority] || priorityColors.LOW;
  const pIcon = priorityIcons[priority] || priorityIcons.LOW;

  return (
    <div
      className="rounded-3 border d-flex align-items-center justify-content-between px-4 py-3"
      style={cardStyle}
    >
      <div className="d-flex align-items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: pColor.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {pIcon}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            {task.description}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase" }}>
            Priority: {priority}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-4">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Assigned to:</span>
          <InitialsAvatar name={assignedName} size={26} fontSize={9} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            {assignedName}
          </span>
        </div>

        <div className="text-end">
          <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", fontWeight: 600 }}>
            Deadline
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            {formatTaskDeadline(task.end_time)}
          </div>
        </div>

        <IconButton size="small" onClick={(e) => onMenuOpen(e.currentTarget, String(task.id))}>
          <MoreVertIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
        </IconButton>
      </div>
    </div>
  );
};

export default RecentTaskItem;
