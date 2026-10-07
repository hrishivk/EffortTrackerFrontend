import { useState } from "react";
import { Menu, MenuItem } from "@mui/material";

import SpinLoader from "../../../../../presentation/SpinLoader";
import type { taskList } from "../../../../user/types";
import RecentTaskItem from "./RecentTaskItem";
import { cardStyle } from "./constants";

type Props = {
  tasks: taskList[];
  loading: boolean;
  getUserName: (id: string | number | null | undefined) => string;
  onViewAll: () => void;
};

const RecentTasksList = ({ tasks, loading, getUserName, onViewAll }: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0" style={{ fontSize: 16 }}>
          Recently Created Tasks
        </h5>
        <span
          style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, cursor: "pointer" }}
          onClick={onViewAll}
        >
          View All Tasks
        </span>
      </div>

      {loading ? (
        <SpinLoader isLoading />
      ) : tasks.length === 0 ? (
        <div
          className="rounded-3 border p-4 text-center"
          style={{ ...cardStyle, color: "var(--text-faint)", fontSize: 13 }}
        >
          No tasks created yet. Use the form above to assign a new task.
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {tasks.slice(0, 5).map((task, i) => (
            <RecentTaskItem
              key={task.id || i}
              task={task}
              assignedName={getUserName(task.assigned_to)}
              onMenuOpen={(anchor, taskId) => {
                setAnchorEl(anchor);
                setMenuTaskId(taskId);
              }}
            />
          ))}
        </div>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => { setAnchorEl(null); setMenuTaskId(null); }}
        PaperProps={{ sx: { borderRadius: 2, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)", minWidth: 140 } }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            if (menuTaskId) onViewAll();
          }}
          sx={{ fontSize: 13 }}
        >
          View Details
        </MenuItem>
      </Menu>
    </div>
  );
};

export default RecentTasksList;
