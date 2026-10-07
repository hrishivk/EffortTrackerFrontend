import { useState } from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LowPriorityRoundedIcon from "@mui/icons-material/LowPriorityRounded";

import type { taskList, TaskEditFields, AddSubtaskInput } from "../../user/types";
import { PRIORITIES, PRIORITY_COLORS, miniSelectSx } from "./boardConstants";
import SubtaskEditor from "./SubtaskEditor";
import type { SubtaskAssignee, SubtaskDraft } from "./CreateTaskModal";


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
  task: taskList;
  isMain: boolean;
  saving: boolean;
  onCancel: () => void;
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
  const wasTags = task.tags ?? [];

  const [name, setName] = useState(task.description ?? "");
  const [priority, setPriority] = useState(wasPriority || "MEDIUM");
  const [tags, setTags] = useState<string[]>(wasTags);
  const [sequential, setSequential] = useState(!!task.sequential);
  const [touched, setTouched] = useState(false);

  const nameMissing = touched && !name.trim();

  const changes = (): TaskEditFields => {
    const fields: TaskEditFields = {};
    if (name.trim() !== wasName) fields.description = name.trim();
    if (priority !== wasPriority) fields.priority = priority;
    if (tags.length !== wasTags.length || tags.some((t, i) => t !== wasTags[i]))
      fields.tags = tags;
    if (isMain && sequential !== !!task.sequential) fields.sequential = sequential;
    return fields;
  };

  const submit = async () => {
    setTouched(true);
    if (!name.trim()) return;
    const fields = changes();
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

        <TagField tags={tags} onChange={setTags} />

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
        Dates move through Extend, which records the reason. Who a task is
        assigned to cannot be changed here yet.
      </p>
    </div>
  );
}

interface AddSubtasksFormProps {
  roomMembers?: SubtaskAssignee[];
  defaultStartDate?: string;
  defaultDueDate?: string;
  sequential: boolean;
  saving: boolean;
  onCancel: () => void;
  onAdd: (rows: AddSubtaskInput[], sequential: boolean) => Promise<number>;
}

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
