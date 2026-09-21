import { useState } from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LowPriorityRoundedIcon from "@mui/icons-material/LowPriorityRounded";

import type { taskList, TaskEditFields, AddSubtaskInput } from "../../user/types";
import { toDateValue } from "../../../shared/utils/taskStatus";
import { PRIORITIES, PRIORITY_COLORS, miniSelectSx } from "./boardConstants";
import SubtaskEditor from "./SubtaskEditor";
import type { SubtaskAssignee, SubtaskDraft } from "./CreateTaskModal";

/**
 * Editing work that already exists, from inside the detail panel.
 *
 * Two forms, because they are two different jobs against two different
 * endpoints — changing a row (`PATCH /updateTask`) and adding children to it
 * (`POST /task/subtask`) — but they share a look, so they share a file.
 *
 * Neither owns any data. Each collects fields, hands them up and lets the panel
 * decide what to do with the answer; a rejected save leaves the form standing
 * with what was typed still in it.
 */

const menuProps = {
  PaperProps: {
    sx: {
      borderRadius: 2.5,
      marginTop: 0.5,
      backgroundColor: "var(--bg-card)",
      backgroundImage: "none",
      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
      "& .MuiMenuItem-root": { fontSize: 13, color: "var(--text-primary)" },
    },
  },
};

const TAG_COLORS = [
  { bg: "rgba(124, 58, 237, 0.12)", text: "#7c3aed" },
  { bg: "rgba(59, 130, 246, 0.12)", text: "#2563eb" },
  { bg: "rgba(239, 68, 68, 0.12)", text: "#dc2626" },
  { bg: "rgba(34, 197, 94, 0.12)", text: "#16a34a" },
  { bg: "rgba(245, 158, 11, 0.14)", text: "#d97706" },
];

/** The chips, with the same add-on-Enter box both create forms use. */
function TagField({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const t = draft.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
  };

  return (
    <div className="tdp__edit-field tdp__edit-field--wide">
      <span className="tdp__edit-label">Tags</span>
      <span className="tdp__edit-box">
        <LocalOfferOutlinedIcon sx={{ fontSize: 13 }} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a tag…"
        />
      </span>
      {tags.length > 0 && (
        <span className="tdp__edit-tags">
          {tags.map((t, i) => {
            const c = TAG_COLORS[i % TAG_COLORS.length];
            return (
              <span
                key={t}
                className="tdp__chip tdp__chip--tag"
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                {t}
                <button
                  type="button"
                  className="tdp__edit-tag-x"
                  title={`Remove ${t}`}
                  onClick={() => onChange(tags.filter((x) => x !== t))}
                >
                  <CloseIcon sx={{ fontSize: 11 }} />
                </button>
              </span>
            );
          })}
        </span>
      )}
    </div>
  );
}

interface TaskEditFormProps {
  /** The row being edited — a main task or one subtask. */
  task: taskList;
  /** `sequential` orders a parent's children, so only a main task offers it. */
  isMain: boolean;
  saving: boolean;
  onCancel: () => void;
  /** Never rejects: the panel reports a refusal and keeps the form open. */
  onSave: (fields: TaskEditFields) => void | Promise<void>;
}

export default function TaskEditForm({
  task,
  isMain,
  saving,
  onCancel,
  onSave,
}: TaskEditFormProps) {
  const wasName = (task.description ?? "").trim();
  const wasPriority = (task.priority || "").toUpperCase();
  const wasStart = toDateValue(task.start_date);
  const wasDue = toDateValue(task.due_date);
  const wasTags = task.tags ?? [];

  const [name, setName] = useState(task.description ?? "");
  const [priority, setPriority] = useState(wasPriority || "MEDIUM");
  const [startDate, setStartDate] = useState(wasStart);
  const [dueDate, setDueDate] = useState(wasDue);
  const [tags, setTags] = useState<string[]>(wasTags);
  const [sequential, setSequential] = useState(!!task.sequential);
  const [touched, setTouched] = useState(false);

  const nameMissing = touched && !name.trim();

  /**
   * What actually moved, and nothing else.
   *
   * An untouched field must stay out of the body: sending a date back
   * unchanged is harmless, but sending every field would overwrite whatever
   * somebody else changed in the meantime. A date the user emptied is the one
   * place `null` is sent — that is the API's "clear it".
   */
  const changes = (): TaskEditFields => {
    const fields: TaskEditFields = {};
    if (name.trim() !== wasName) fields.description = name.trim();
    if (priority !== wasPriority) fields.priority = priority;
    if (startDate !== wasStart) fields.start_date = startDate || null;
    if (dueDate !== wasDue) fields.due_date = dueDate || null;
    if (tags.length !== wasTags.length || tags.some((t, i) => t !== wasTags[i]))
      fields.tags = tags;
    if (isMain && sequential !== !!task.sequential) fields.sequential = sequential;
    return fields;
  };

  const submit = async () => {
    setTouched(true);
    if (!name.trim()) return;
    const fields = changes();
    // Nothing moved. The API answers an empty body with a 400, and there is
    // nothing to save anyway — so this is a close, not a request.
    if (Object.keys(fields).length === 0) {
      onCancel();
      return;
    }
    await onSave(fields);
  };

  return (
    <div className="tdp__edit">
      <div className="tdp__edit-head">
        <span className="tdp__edit-kind">
          {isMain ? "Editing this task" : "Editing this subtask"}
        </span>
      </div>

      <div className="tdp__edit-grid">
        <div className="tdp__edit-field tdp__edit-field--wide">
          <span className="tdp__edit-label">Name</span>
          <span className={`tdp__edit-box${nameMissing ? " tdp__edit-box--bad" : ""}`}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What is this piece of work?"
            />
          </span>
          {nameMissing && <span className="tdp__edit-error">A task needs a name.</span>}
        </div>

        <label className="tdp__edit-field">
          <span className="tdp__edit-label">Priority</span>
          <FormControl fullWidth size="small" sx={miniSelectSx}>
            <Select
              value={priority}
              onChange={(e) => setPriority(String(e.target.value))}
              MenuProps={menuProps}
              startAdornment={
                <InputAdornment position="start" sx={{ marginRight: 0.5 }}>
                  <FlagOutlinedIcon
                    sx={{ fontSize: 13, color: PRIORITY_COLORS[priority] || "var(--text-faint)" }}
                  />
                </InputAdornment>
              }
            >
              {PRIORITIES.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </label>

        <label className="tdp__edit-field">
          <span className="tdp__edit-label">Starts</span>
          <span className="tdp__edit-box">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
            <input
              type="date"
              value={startDate}
              max={dueDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </span>
        </label>

        <label className="tdp__edit-field">
          <span className="tdp__edit-label">Due</span>
          <span className="tdp__edit-box">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
            <input
              type="date"
              value={dueDate}
              min={startDate || undefined}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </span>
        </label>

        <TagField tags={tags} onChange={setTags} />

        {/* A subtask has no children to order, and the API refuses the field
            on one — so it is not offered there. */}
        {isMain && (
          <label
            className="tdp__edit-seq"
            title="Each subtask stays locked until the one above it is completed"
          >
            <input
              type="checkbox"
              checked={sequential}
              onChange={(e) => setSequential(e.target.checked)}
            />
            <LowPriorityRoundedIcon sx={{ fontSize: 14 }} />
            Run subtasks in order
          </label>
        )}
      </div>

      <div className="tdp__edit-actions">
        <button type="button" className="tdp__btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className="tdp__btn tdp__btn--primary"
          onClick={() => void submit()}
          disabled={saving}
        >
          {saving ? <CircularProgress size={12} sx={{ color: "inherit" }} /> : null}
          Save changes
        </button>
      </div>

      <p className="tdp__edit-hint">
        Emptying a date clears it. Who a task is assigned to cannot be changed here yet.
      </p>
    </div>
  );
}

interface AddSubtasksFormProps {
  /** The room's roster. Empty outside a room, which hides the assignee field. */
  roomMembers?: SubtaskAssignee[];
  /** The parent's window, which a new child starts inside. */
  defaultStartDate?: string;
  defaultDueDate?: string;
  /** The parent's order flag, so the toggle starts where the task already is. */
  sequential: boolean;
  saving: boolean;
  onCancel: () => void;
  /**
   * Resolves with how many rows the API actually took.
   *
   * A count rather than nothing, because each subtask is its own request and so
   * partial success is a real outcome: four rows can leave two on the server and
   * two in the form. What was taken is dropped here and what was refused stays
   * put, ready to be fixed and sent again.
   */
  onAdd: (rows: AddSubtaskInput[], sequential: boolean) => Promise<number>;
}

/**
 * Children added to a task that already exists — several at a time.
 *
 * This is the same editor the create form drafts its subtasks in, which is the
 * point: breaking a task down is one job whether it happens while the task is
 * being raised or a week later, so it should be one control. Rows are named,
 * ordered by dragging and given their own assignee and dates here, then sent in
 * listed order.
 *
 * Order is the whole reason they go up one at a time rather than in a batch:
 * the endpoint appends, so the order they are sent in is the order they end up
 * in — and with "Run in order" on, that order *is* the plan.
 */
export function AddSubtasksForm({
  roomMembers = [],
  defaultStartDate = "",
  defaultDueDate = "",
  sequential,
  saving,
  onCancel,
  onAdd,
}: AddSubtasksFormProps) {
  const [rows, setRows] = useState<SubtaskDraft[]>([]);
  const [runInOrder, setRunInOrder] = useState(sequential);
  const [touched, setTouched] = useState(false);

  const blank = rows.some((r) => !r.name.trim());

  const submit = async () => {
    setTouched(true);
    // A blank name is a 400 the form can see coming.
    if (!rows.length || blank) return;

    const added = await onAdd(
      rows.map((r) => ({
        description: r.name.trim(),
        ...(r.assignee ? { assigned_to: r.assignee } : {}),
        ...(r.priority ? { priority: r.priority } : {}),
        ...(r.startDate ? { start_date: r.startDate } : {}),
        ...(r.dueDate ? { due_date: r.dueDate } : {}),
      })),
      runInOrder
    );

    // All of them landed and the panel has closed this form. Anything less and
    // the rows that failed are the ones still listed.
    if (added > 0 && added < rows.length) {
      setRows(rows.slice(added));
      setTouched(false);
    }
  };

  return (
    <div className="tdp__edit tdp__edit--add">
      <SubtaskEditor
        subtasks={rows}
        onChange={setRows}
        sequential={runInOrder}
        onSequentialChange={setRunInOrder}
        roomMembers={roomMembers}
        defaultStartDate={defaultStartDate}
        defaultDueDate={defaultDueDate}
      />

      {touched && blank && (
        <p className="tdp__edit-error">Every subtask needs a name.</p>
      )}

      <div className="tdp__edit-actions">
        <button type="button" className="tdp__btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className="tdp__btn tdp__btn--primary"
          onClick={() => void submit()}
          disabled={saving || rows.length === 0}
        >
          {saving ? (
            <CircularProgress size={12} sx={{ color: "inherit" }} />
          ) : (
            <AddIcon sx={{ fontSize: 14 }} />
          )}
          {rows.length > 1 ? `Add ${rows.length} subtasks` : "Add subtask"}
        </button>
      </div>

      <p className="tdp__edit-hint">
        They join the end of the list, in the order shown, and inherit the task's
        project and room.
      </p>
    </div>
  );
}
