import { motion } from "framer-motion";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import type { taskList, TaskEditFields } from "../../../user/types";
import TaskEditForm from "../TaskEditForm";
import { showDate, showStamp, showTime, stagger } from "./tdpUtils";

interface DetailsTabProps {
  task: taskList;
  projName: string;
  projColor: { bg: string; text: string };
  editable: boolean;
  editing: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (fields: TaskEditFields) => void;
}

export default function DetailsTab({
  task,
  projName,
  projColor,
  editable,
  editing,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
}: DetailsTabProps) {
  const details = [
    { label: "Created", value: showStamp(task.created_at) },
    { label: "Created by", value: task.dailyLog?.creator?.fullName || "--" },
    { label: "Started", value: showTime(task.start_time) },
    { label: "Finished", value: showTime(task.end_time) },
    { label: "Start date", value: showDate(task.start_date) },
    { label: "Due date", value: showDate(task.due_date) },
    {
      label: "Subtask order",
      value: task.sequential
        ? "Sequential — each waits for the one before"
        : "Parallel — any of them can start",
    },
    {
      label: "Project",
      value: projName ? (
        <span
          className="tdp__chip"
          style={{
            backgroundColor: projColor.bg,
            color: projColor.text,
            fontWeight: 600,
          }}
        >
          {projName}
        </span>
      ) : (
        "--"
      ),
    },
  ];

  return (
    <div className="tdp__panel">
      <div className="tdp__panel-head">
        <ArticleOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
        <h4 className="tdp__panel-title">Details</h4>

        {editable && !editing && (
          <button type="button" className="tdp__head-btn" onClick={onStartEdit}>
            <EditOutlinedIcon sx={{ fontSize: 14 }} />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <TaskEditForm
          task={task}
          isMain
          saving={saving}
          onCancel={onCancelEdit}
          onSave={onSave}
        />
      ) : (
        <div className="tdp__detail-grid">
          {details.map((d, i) => (
            <motion.div key={d.label} className="tdp__detail" {...stagger(i)}>
              <p className="tdp__fact-label">{d.label}</p>
              <p className="tdp__fact-value">{d.value}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
