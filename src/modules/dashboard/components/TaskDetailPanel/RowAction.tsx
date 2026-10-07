import CircularProgress from "@mui/material/CircularProgress";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import type { taskList } from "../../../user/types";
import { assigneeIdOf } from "../../../../shared/utils/subtasks";
import { normalize } from "./tdpUtils";

export interface RowActionContext {
  owns: boolean;
  currentUserId?: string | number | null;
  busy: Record<string, boolean>;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

interface RowActionProps extends RowActionContext {
  row: taskList;
  isMain: boolean;
}

export default function RowAction({
  row,
  isMain,
  owns,
  currentUserId,
  busy,
  onStart,
  onComplete,
}: RowActionProps) {
  const st = normalize(row.status);
  const id = String(row.id);
  const working = !!busy[id];
  const rowAssigneeId = assigneeIdOf(row);
  const rowOwns = rowAssigneeId ? rowAssigneeId === String(currentUserId ?? "") : owns;

  if (st === "completed" || st === "done") {
    return (
      <span className="tdp__done" title="Completed">
        <CheckRoundedIcon sx={{ fontSize: 15 }} />
      </span>
    );
  }

  if (!rowOwns) return null;

  if (st === "in_progress") {
    return (
      <button
        type="button"
        className="tdp__stop"
        title={isMain ? "Complete this task" : "Complete this subtask"}
        disabled={working}
        onClick={() => onComplete(id)}
      >
        {working ? (
          <CircularProgress size={11} sx={{ color: "inherit" }} />
        ) : (
          <StopRoundedIcon sx={{ fontSize: 15 }} />
        )}
        Complete
      </button>
    );
  }

  return (
    <button
      type="button"
      className="tdp__play"
      title={isMain ? "Start this task" : "Start this subtask"}
      disabled={working}
      onClick={() => onStart(id)}
    >
      {working ? (
        <CircularProgress size={12} sx={{ color: "inherit" }} />
      ) : (
        <PlayArrowRoundedIcon sx={{ fontSize: 17 }} />
      )}
    </button>
  );
}
