import type React from "react";
import { motion } from "framer-motion";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";

import type { taskList, TaskEditFields } from "../../../user/types";
import { isTaskRunning } from "../../../../shared/utils/taskTime";
import { assigneeOf } from "../../../../shared/utils/subtasks";
import { STATUS_ACCENT, PRIORITY_STYLE } from "../boardConstants";
import TaskTimer from "../TaskTimer";
import TaskEditForm from "../TaskEditForm";
import RowAction, { type RowActionContext } from "./RowAction";
import { initialsOf, normalize, showShort, stagger, statusFace } from "./tdpUtils";

export interface TaskCardContext extends RowActionContext {
  openRows: Record<string, boolean>;
  toggleRow: (id: string, next: boolean) => void;
  openThreads: Record<string, boolean>;
  toggleThread: (id: string, next: boolean) => void;
  editingId: string | null;
  saving: boolean;
  canComment: boolean;
  canExtend: boolean;
  canRemove: (row: taskList) => boolean;
  mayEdit: (row: taskList) => boolean;
  startEdit: (id: string) => void;
  cancelEdit: () => void;
  saveEdit: (id: string, fields: TaskEditFields) => Promise<void>;
  startExtend: (row: taskList) => void;
  startDelete: (row: taskList) => void;
  commentBox: (row: taskList) => React.ReactNode;
}

const mark = (status?: string | null) => {
  const s = normalize(status);
  if (s === "completed" || s === "done")
    return <CheckCircleIcon sx={{ fontSize: 21, color: STATUS_ACCENT.completed }} />;
  if (s === "in_progress")
    return (
      <PlayCircleFilledRoundedIcon sx={{ fontSize: 21, color: STATUS_ACCENT.in_progress }} />
    );
  return <RadioButtonUncheckedIcon sx={{ fontSize: 21, color: "var(--text-faint)" }} />;
};

interface TaskCardProps {
  row: taskList;
  isMain?: boolean;
  ctx: TaskCardContext;
}

export default function TaskCard({ row, isMain = false, ctx }: TaskCardProps) {
  const id = String(row.id);
  const kids = row.subtasks ?? [];
  const expanded = ctx.openRows[id] !== false;
  const rowFace = statusFace(row.status);
  const rowPrio = PRIORITY_STYLE[(row.priority || "").toUpperCase()];
  const who = assigneeOf(row);
  const threadOpen = !!ctx.openThreads[id];
  const threadCount = row.comment_count ?? row.comments?.length ?? 0;
  const extCount = row.extension_count ?? row.extensions?.length;
  const from = showShort(row.start_date ?? row.start_time);
  const to = showShort(row.due_date ?? row.end_time);
  const running = isTaskRunning(row);
  const editable = ctx.mayEdit(row);
  const cardClass = `tdp__card${isMain ? " tdp__card--main" : ""}`;

  if (ctx.editingId === id) {
    return (
      <div className={cardClass}>
        <TaskEditForm
          task={row}
          isMain={isMain}
          saving={ctx.saving}
          onCancel={ctx.cancelEdit}
          onSave={(fields) => ctx.saveEdit(id, fields)}
        />

        {expanded && kids.length > 0 && (
          <div className="tdp__card-kids">
            {kids.map((kid) => (
              <TaskCard key={String(kid.id)} row={kid} ctx={ctx} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="tdp__card-main">
        {kids.length > 0 ? (
          <button
            type="button"
            className="tdp__twisty"
            title={expanded ? `Collapse ${kids.length} subtasks` : `Expand ${kids.length} subtasks`}
            onClick={() => ctx.toggleRow(id, !expanded)}
          >
            {expanded ? (
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            )}
          </button>
        ) : (
          <span className="tdp__twisty tdp__twisty--gap" />
        )}

        <span className="tdp__mark">{mark(row.status)}</span>

        <div className="tdp__card-body">
          <div className="tdp__card-title-row">
            {isMain && <span className="tdp__main-tag">Main task</span>}
            <span className="tdp__card-title" title={row.description}>
              {row.description}
            </span>
          </div>

          <div className="tdp__card-chips">
            {rowPrio && (
              <span
                className="tdp__chip"
                style={{ backgroundColor: rowPrio.bg, color: rowPrio.color }}
              >
                {(row.priority || "").toUpperCase()}
              </span>
            )}
            {(row.tags ?? []).slice(0, 2).map((t) => (
              <span key={t} className="tdp__chip tdp__chip--tag">
                {t}
              </span>
            ))}

            {(extCount ?? 0) > 0 && (
              <span
                className="tdp__slip"
                title={`The deadline has been pushed ${extCount} time(s) — the reasons are in Activity`}
              >
                <EventRepeatOutlinedIcon sx={{ fontSize: 10 }} />
                {extCount}
              </span>
            )}
          </div>
        </div>

        <div className="tdp__card-right">
          {who ? (
            <span className="tdp__who-avatar" title={who.fullName}>
              {initialsOf(who.fullName)}
            </span>
          ) : (
            <span className="tdp__who-avatar tdp__who-avatar--none" title="Unassigned">
              <PersonOutlineIcon sx={{ fontSize: 13 }} />
            </span>
          )}

          <span
            className="tdp__chip"
            style={{ backgroundColor: rowFace.bg, color: rowFace.color }}
          >
            {running && <span className="task-running-dot" />}
            {rowFace.label}
          </span>

          {ctx.canComment && (
            <button
              type="button"
              className={`tdp__comment-btn${threadOpen ? " tdp__comment-btn--on" : ""}`}
              title={
                threadCount
                  ? `${threadCount} comment${threadCount === 1 ? "" : "s"}`
                  : "Comment on this"
              }
              onClick={() => ctx.toggleThread(id, !threadOpen)}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 12 }} />
              {threadCount > 0 && threadCount}
            </button>
          )}

          {editable && (
            <button
              type="button"
              className="tdp__comment-btn"
              title={isMain ? "Edit this task" : "Edit this subtask"}
              onClick={() => ctx.startEdit(id)}
            >
              <EditOutlinedIcon sx={{ fontSize: 12 }} />
            </button>
          )}

          {ctx.canExtend && editable && normalize(row.status) !== "completed" && (
            <button
              type="button"
              className="tdp__comment-btn"
              title={row.due_date ? "Extend this deadline" : "Set a deadline for this"}
              onClick={() => ctx.startExtend(row)}
            >
              <EventRepeatOutlinedIcon sx={{ fontSize: 12 }} />
            </button>
          )}

          {ctx.canRemove(row) && (
            <button
              type="button"
              className="tdp__comment-btn tdp__comment-btn--danger"
              title={isMain ? "Delete this task" : "Delete this subtask"}
              onClick={() => ctx.startDelete(row)}
            >
              <DeleteOutlineIcon sx={{ fontSize: 12 }} />
            </button>
          )}

          <RowAction row={row} isMain={isMain} {...ctx} />
        </div>
      </div>

      <div className="tdp__card-meta">
        {from && (
          <span title="Start date">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 12 }} />
            {from}
          </span>
        )}
        {to && (
          <span title="Due date">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 12 }} />
            {to}
          </span>
        )}
        <span className="tdp__card-clock">
          <TaskTimer
            dense
            status={row.status}
            startTime={row.start_time}
            endTime={row.end_time}
            totalSeconds={row.total_seconds}
          />
        </span>
      </div>

      {ctx.canComment && threadOpen && (
        <div className="tdp__card-thread">{ctx.commentBox(row)}</div>
      )}

      {expanded && kids.length > 0 && (
        <div className="tdp__card-kids">
          {kids.map((kid, i) => (
            <motion.div key={String(kid.id)} {...stagger(i)} style={{ minWidth: 0 }}>
              <TaskCard row={kid} ctx={ctx} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
