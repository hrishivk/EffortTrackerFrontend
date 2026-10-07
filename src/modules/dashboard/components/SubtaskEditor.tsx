import { useRef, useState, type DragEvent } from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LowPriorityRoundedIcon from "@mui/icons-material/LowPriority";

import { PRIORITIES, PRIORITY_COLORS, miniSelectSx } from "./boardConstants";
import MentionPicker from "../../../shared/components/User/MentionPicker";
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

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const shortDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
};

interface SubtaskEditorProps {
  subtasks: SubtaskDraft[];
  onChange: (next: SubtaskDraft[]) => void;
  sequential: boolean;
  onSequentialChange: (next: boolean) => void;
  roomMembers?: SubtaskAssignee[];
  defaultStartDate?: string;
  defaultDueDate?: string;
  compact?: boolean;
}

export default function SubtaskEditor({
  subtasks,
  onChange,
  sequential,
  onSequentialChange,
  roomMembers = [],
  defaultStartDate = "",
  defaultDueDate = "",
  compact = false,
}: SubtaskEditorProps) {
  const [draft, setDraft] = useState("");
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    onChange([
      ...subtasks,
      {
        name,
        assignee: "",
        priority: "MEDIUM",
        startDate: defaultStartDate,
        dueDate: defaultDueDate,
      },
    ]);
    setDraft("");
    inputRef.current?.focus();
  };

  const edit = (index: number, patch: Partial<SubtaskDraft>) =>
    onChange(subtasks.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const remove = (index: number) => {
    onChange(subtasks.filter((_, i) => i !== index));
    setOpenRow(null);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...subtasks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setOpenRow(null);
  };

  const endDrag = () => {
    setDragFrom(null);
    setDragOver(null);
  };

  return (
    <div className={`ste${compact ? " ste--compact" : ""}`}>
      <div className="ste__head">
        <AccountTreeOutlinedIcon sx={{ fontSize: 16, color: "#7c3aed" }} />
        <h4 className="ste__title">
          Subtasks
          {subtasks.length > 0 && <span className="ste__count">{subtasks.length}</span>}
        </h4>

        {subtasks.length > 1 && (
          <label className="ste__seq" title="Each subtask stays locked until the one above it is completed">
            <input
              type="checkbox"
              checked={sequential}
              onChange={(e) => onSequentialChange(e.target.checked)}
            />
            <LowPriorityRoundedIcon sx={{ fontSize: 14 }} />
            Run in order
          </label>
        )}
      </div>

      {subtasks.length === 0 ? (
        <p className="ste__empty">
          No subtasks yet — add one below to split this work up.
        </p>
      ) : (
        <ol className="ste__list">
          {subtasks.map((sub, i) => {
            const open = openRow === i;
            const member = roomMembers.find((m) => m.id === sub.assignee);
            const due = shortDate(sub.dueDate);
            const dragging = dragFrom === i;

            return (
              <li
                key={i}
                className={[
                  "ste__row",
                  open ? "ste__row--open" : "",
                  dragging ? "ste__row--dragging" : "",
                  dragOver === i && !dragging ? "ste__row--over" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={(e: DragEvent<HTMLLIElement>) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOver !== i) setDragOver(i);
                }}
                onDrop={(e: DragEvent<HTMLLIElement>) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  reorder(dragFrom, i);
                  endDrag();
                }}
              >
                <div className="ste__summary">
                  <span
                    className="ste__grip"
                    draggable
                    title="Drag to reorder"
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(i));
                      setDragFrom(i);
                    }}
                    onDragEnd={endDrag}
                  >
                    <DragIndicatorIcon sx={{ fontSize: 15 }} />
                  </span>

                  <span className="ste__index">{i + 1}</span>

                  <input
                    className="ste__name"
                    value={sub.name}
                    title={sub.name}
                    onChange={(e) => edit(i, { name: e.target.value })}
                  />

                  {member && (
                    <span className="ste__who" title={member.name}>
                      {initialsOf(member.name)}
                    </span>
                  )}

                  <span
                    className="ste__prio"
                    title={`${sub.priority} priority`}
                    style={{ backgroundColor: PRIORITY_COLORS[sub.priority] || "#9ca3af" }}
                  />

                  {due && <span className="ste__due">{due}</span>}

                  {sequential && i > 0 && (
                    <span
                      className="ste__waits"
                      title={`Starts once "${subtasks[i - 1].name}" is completed`}
                    >
                      ↑{i}
                    </span>
                  )}

                  <button
                    type="button"
                    className={`ste__icon${open ? " ste__icon--on" : ""}`}
                    title={open ? "Done" : "Assignee, priority and dates"}
                    onClick={() => setOpenRow(open ? null : i)}
                  >
                    <TuneRoundedIcon sx={{ fontSize: 14 }} />
                  </button>

                  <button
                    type="button"
                    className="ste__icon ste__icon--danger"
                    title="Remove subtask"
                    onClick={() => remove(i)}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </button>
                </div>

                {open && (
                  <div className="ste__detail">
                    {roomMembers.length > 0 && (
                      <div className="ste__field">
                        <span className="ste__label">Assignee</span>
                        <MentionPicker
                          people={roomMembers}
                          value={sub.assignee}
                          onChange={(id) => edit(i, { assignee: id })}
                          emptyLabel="Same as task owner"
                          placeholder="@ to search the room…"
                        />
                      </div>
                    )}

                    <label className="ste__field">
                      <span className="ste__label">Priority</span>
                      <FormControl fullWidth size="small" sx={miniSelectSx}>
                        <Select
                          value={sub.priority}
                          onChange={(e) => edit(i, { priority: e.target.value })}
                          MenuProps={menuProps}
                          startAdornment={
                            <InputAdornment position="start" sx={{ marginRight: 0.5 }}>
                              <FlagOutlinedIcon
                                sx={{
                                  fontSize: 13,
                                  color: PRIORITY_COLORS[sub.priority] || "var(--text-faint)",
                                }}
                              />
                            </InputAdornment>
                          }
                        >
                          {PRIORITIES.map((pr) => (
                            <MenuItem key={pr.value} value={pr.value}>
                              {pr.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </label>

                    <label className="ste__field">
                      <span className="ste__label">Starts</span>
                      <span className="ste__date">
                        <CalendarTodayOutlinedIcon />
                        <input
                          type="date"
                          value={sub.startDate}
                          max={sub.dueDate || undefined}
                          onChange={(e) => edit(i, { startDate: e.target.value })}
                        />
                      </span>
                    </label>

                    <label className="ste__field">
                      <span className="ste__label">Due</span>
                      <span className="ste__date">
                        <CalendarTodayOutlinedIcon />
                        <input
                          type="date"
                          value={sub.dueDate}
                          min={sub.startDate || undefined}
                          onChange={(e) => edit(i, { dueDate: e.target.value })}
                        />
                      </span>
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="ste__add">
        <AccountTreeOutlinedIcon sx={{ fontSize: 15, color: "var(--text-faint)" }} />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={
            subtasks.length ? `Add subtask ${subtasks.length + 1}…` : "Add a subtask…"
          }
        />
        <button type="button" onClick={add} disabled={!draft.trim()}>
          <AddIcon sx={{ fontSize: 15 }} /> Add
        </button>
      </div>

      <p className="ste__hint">
        Enter adds it and keeps going. Drag to reorder;{" "}
        <TuneRoundedIcon sx={{ fontSize: 11, verticalAlign: "-1px" }} /> sets who
        has it, its priority and its dates.
      </p>
    </div>
  );
}
