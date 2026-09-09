import { useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import type { formUserData } from "../../../shared/types/User";
import { STATUS_ACCENT } from "./boardConstants";

/** A child task, with its own priority and dates. */
export interface SubtaskDraft {
  name: string;
  priority: string;
  startDate: string;
  dueDate: string;
}

/** Everything the form collects. Fields the API cannot store yet are marked. */
export interface CreateTaskFormData {
  taskName: string;
  project: string;
  priority: string;
  startDate: string;
  dueDate: string;
  assignees: string[];
  /** No column yet — see docs/create-task-fields.md */
  tags: string[];
  subtasks: SubtaskDraft[];
}

const PRIORITIES = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "#dc2626",
  MEDIUM: "#d97706",
  LOW: "#2563eb",
};

const TAG_COLORS = [
  { bg: "rgba(124, 58, 237, 0.12)", text: "#7c3aed" },
  { bg: "rgba(59, 130, 246, 0.12)", text: "#2563eb" },
  { bg: "rgba(239, 68, 68, 0.12)", text: "#dc2626" },
  { bg: "rgba(34, 197, 94, 0.12)", text: "#16a34a" },
  { bg: "rgba(245, 158, 11, 0.14)", text: "#d97706" },
];

/** One look for every MUI Select in here, matching the plain fields beside them. */
const selectSx = {
  "& .MuiOutlinedInput-root": {
    height: 44,
    borderRadius: "10px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      borderWidth: 1,
      boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.12)",
    },
  },
  "& .MuiSelect-select": { display: "flex", alignItems: "center", paddingLeft: "4px" },
  "& .MuiSvgIcon-root": { color: "var(--text-faint)" },
};

/**
 * A select that shows its value but cannot be changed. MUI's disabled styling
 * dims the text to near-unreadable, so the colour is restored: the point is
 * "this is fixed", not "this is unavailable".
 */
const fixedSelectSx = {
  ...selectSx,
  "& .MuiOutlinedInput-root": {
    ...selectSx["& .MuiOutlinedInput-root"],
    backgroundColor: "var(--bg-hover)",
    "&.Mui-disabled": {
      "& fieldset": { borderColor: "var(--border-light)" },
      "& .MuiSelect-select": {
        WebkitTextFillColor: "var(--text-secondary)",
        cursor: "default",
      },
    },
  },
  "& .MuiSelect-icon": { display: "none" },
};

/** The same select, two thirds the height, for a subtask row. */
const miniSelectSx = {
  "& .MuiOutlinedInput-root": {
    height: 32,
    borderRadius: "8px",
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: 11.5,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": { borderColor: "#7c3aed", borderWidth: 1 },
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    paddingLeft: "2px",
  },
  "& .MuiSvgIcon-root": { color: "var(--text-faint)" },
};

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

const adornment = (Icon: React.ElementType) => (
  <InputAdornment position="start" sx={{ marginRight: 0.75 }}>
    <Icon sx={{ fontSize: 17, color: "var(--text-faint)" }} />
  </InputAdornment>
);

const placeholder = (text: string) => (
  <span style={{ color: "var(--text-faint)" }}>{text}</span>
);

const emptyForm = (): CreateTaskFormData => ({
  taskName: "",
  project: "",
  priority: "MEDIUM",
  startDate: "",
  dueDate: "",
  assignees: [],
  tags: [],
  subtasks: [],
});

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projects: { id: string; name: string }[];
  assignableUsers: formUserData[];
  /**
   * The lane every new task starts in, already resolved by the caller. Shown as
   * a fixed field rather than a choice — the board's only path begins here.
   */
  startLane?: { id: string; name: string; color: string };
  /**
   * The project every task from this caller belongs to, shown but not
   * changeable. Set when the modal is opened somewhere that already decides
   * the project — a workspace room, where the workspace owns exactly one.
   */
  fixedProject?: string;
  /**
   * Who the task is for unless changed — the person whose tasks are open.
   * Carries the name as well as the id: they may not be in `assignableUsers`
   * (that list is filtered by role and project), and without a name to fall
   * back on the field would render the raw id.
   * Ignored for USER / DEVLOPER, who always self-assign.
   */
  defaultAssignee?: { id: string; name: string };
  /** USER / DEVLOPER self-assign, so the Assignee field is theirs and fixed. */
  isUserOrDev: boolean;
  currentUserName?: string;
  submitting: boolean;
  /** Resolves once the task is saved. */
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
}

export default function CreateTaskModal({
  open,
  onClose,
  projects,
  assignableUsers,
  startLane,
  fixedProject,
  defaultAssignee,
  isUserOrDev,
  currentUserName,
  submitting,
  onSubmit,
}: CreateTaskModalProps) {
  const [form, setForm] = useState<CreateTaskFormData>(emptyForm);
  const [tagDraft, setTagDraft] = useState("");
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const subtaskRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof CreateTaskFormData>(key: K, value: CreateTaskFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // A fresh form each time the dialog opens. A new task always starts in
  // Yet to Start — the caller resolves that lane — so there is nothing to pick.
  useEffect(() => {
    if (!open) return;
    // A fixed project is filled in up front — it is the one value the caller
    // has already decided, and the field cannot be used to change it. The
    // default assignee is a starting point the user may still change.
    setForm({
      ...emptyForm(),
      project: fixedProject ?? "",
      assignees: !isUserOrDev && defaultAssignee ? [defaultAssignee.id] : [],
    });
    setTagDraft("");
    setSubtaskDraft("");
    setTouched(false);
  }, [open, fixedProject, defaultAssignee, isUserOrDev]);

  const nameMissing = touched && !form.taskName.trim();
  const projectMissing = touched && !form.project;

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || form.tags.includes(t)) return setTagDraft("");
    set("tags", [...form.tags, t]);
    setTagDraft("");
  };

  /**
   * Append a subtask and stay in the box. A task usually has several, so the
   * field keeps focus and clears rather than sending you hunting for it again.
   */
  const addSubtask = () => {
    const t = subtaskDraft.trim();
    if (!t) return;
    set("subtasks", [
      ...form.subtasks,
      // Inherit the parent's dates as a starting point — a subtask nearly always
      // sits inside its parent's window, and it stays editable either way.
      {
        name: t,
        priority: "MEDIUM",
        startDate: form.startDate,
        dueDate: form.dueDate,
      },
    ]);
    setSubtaskDraft("");
    subtaskRef.current?.focus();
  };

  const editSubtask = (index: number, patch: Partial<SubtaskDraft>) =>
    set(
      "subtasks",
      form.subtasks.map((sub, i) => (i === index ? { ...sub, ...patch } : sub))
    );

  const submit = async () => {
    setTouched(true);
    if (!form.taskName.trim() || !form.project) return;
    await onSubmit({ ...form });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)",
          },
        },
      }}
    >
      <div className="ctm">
        {/* Header */}
        <div className="ctm__head">
          <span className="ctm__badge">
            <AddIcon sx={{ fontSize: 21 }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 className="ctm__title">Create New Task</h3>
            <p className="ctm__subtitle">
              Add a task and all the details to keep your work organized.
            </p>
          </div>
          <button type="button" className="ctm__close" onClick={onClose} title="Close">
            <CloseIcon sx={{ fontSize: 19 }} />
          </button>
        </div>

        <div className="ctm__split">
          <div>
          {/* Task name + Project */}
          <div className="ctm__row ctm__row--2">
            <div>
              <label className="ctm__label">
                Task Name<span className="ctm__req">*</span>
              </label>
              <div className={`ctm__field${nameMissing ? " ctm__field--invalid" : ""}`}>
                <FormatListBulletedIcon />
                <input
                  autoFocus
                  value={form.taskName}
                  onChange={(e) => set("taskName", e.target.value)}
                  placeholder="e.g., Design landing page UI"
                />
              </div>
            </div>
            <div>
              <label className="ctm__label">
                Project<span className="ctm__req">*</span>
              </label>
              <FormControl
                fullWidth
                size="small"
                sx={fixedProject ? fixedSelectSx : selectSx}
                error={!fixedProject && projectMissing}
              >
                <Select
                  displayEmpty
                  disabled={!!fixedProject}
                  value={form.project}
                  onChange={(e) => set("project", e.target.value)}
                  startAdornment={adornment(FolderOutlinedIcon)}
                  MenuProps={menuProps}
                  renderValue={(v) => (v ? String(v) : placeholder("Select a project"))}
                >
                  {(fixedProject
                    ? projects.filter((p) => p.name === fixedProject)
                    : projects
                  ).map((p) => (
                    <MenuItem key={p.id} value={p.name}>
                      {p.name}
                    </MenuItem>
                  ))}
                  {/* Keeps the value renderable if the list has not arrived. */}
                  {fixedProject &&
                    !projects.some((p) => p.name === fixedProject) && (
                      <MenuItem value={fixedProject}>{fixedProject}</MenuItem>
                    )}
                </Select>
              </FormControl>
              {fixedProject && (
                <p className="ctm__hint">The workspace's project.</p>
              )}
            </div>
          </div>

          {/* Status + Priority + Assignee. Status is shown but fixed. */}
          <div className="ctm__row ctm__row--3">
            <div>
              <label className="ctm__label">Status</label>
              <FormControl fullWidth size="small" sx={fixedSelectSx}>
                <Select
                  disabled
                  value="start"
                  MenuProps={menuProps}
                  startAdornment={
                    <InputAdornment position="start" sx={{ marginRight: 0.75 }}>
                      <RadioButtonCheckedIcon
                        sx={{ fontSize: 17, color: STATUS_ACCENT.yet_to_start }}
                      />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="start">{startLane?.name || "Yet to Start"}</MenuItem>
                </Select>
              </FormControl>
              <p className="ctm__hint">New tasks always start here.</p>
            </div>
            <div>
              <label className="ctm__label">Priority</label>
              <FormControl fullWidth size="small" sx={selectSx}>
                <Select
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value)}
                  startAdornment={adornment(FlagOutlinedIcon)}
                  MenuProps={menuProps}
                >
                  {PRIORITIES.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div>
              <label className="ctm__label">Assignee</label>
              {isUserOrDev ? (
                <div className="ctm__field">
                  <PersonOutlineIcon />
                  <input value={currentUserName || "Me"} readOnly />
                </div>
              ) : (
                <FormControl fullWidth size="small" sx={selectSx}>
                  <Select
                    displayEmpty
                    value={form.assignees[0] ?? ""}
                    onChange={(e) =>
                      set("assignees", e.target.value ? [String(e.target.value)] : [])
                    }
                    startAdornment={adornment(PersonOutlineIcon)}
                    MenuProps={menuProps}
                    renderValue={(v) => {
                      if (!v) return placeholder("Unassigned");
                      const known = assignableUsers.find(
                        (u) => String(u.id) === String(v)
                      )?.fullName;
                      // Never fall through to the id — show the name we were
                      // given, or say it plainly.
                      return (
                        known ??
                        (String(v) === defaultAssignee?.id
                          ? defaultAssignee.name
                          : placeholder("Unknown user"))
                      );
                    }}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {assignableUsers.map((u) => (
                      <MenuItem key={u.id} value={String(u.id)}>
                        {u.fullName}
                      </MenuItem>
                    ))}
                    {/* The viewed member, when the role-filtered list omits them. */}
                    {defaultAssignee &&
                      !assignableUsers.some(
                        (u) => String(u.id) === defaultAssignee.id
                      ) && (
                        <MenuItem value={defaultAssignee.id}>
                          {defaultAssignee.name}
                        </MenuItem>
                      )}
                  </Select>
                </FormControl>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="ctm__row ctm__row--2">
            <div>
              <label className="ctm__label">Start Date</label>
              <div className="ctm__field">
                <CalendarTodayOutlinedIcon />
                <input
                  type="date"
                  value={form.startDate}
                  max={form.dueDate || undefined}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="ctm__label">Due Date</label>
              <div className="ctm__field">
                <CalendarTodayOutlinedIcon />
                <input
                  type="date"
                  value={form.dueDate}
                  min={form.startDate || undefined}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          </div>

          <div className="ctm__aside">
          {/* Tags */}
          <div className="ctm__row ctm__row--1">
            <div>
              <label className="ctm__label">Tags</label>
              <div className="ctm__field">
                <LocalOfferOutlinedIcon />
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tags..."
                />
              </div>
              {form.tags.length > 0 && (
                <div className="ctm__tags">
                  {form.tags.map((t, i) => {
                    const c = TAG_COLORS[i % TAG_COLORS.length];
                    return (
                      <span
                        key={t}
                        className="ctm__tag"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {t}
                        <button
                          type="button"
                          title={`Remove ${t}`}
                          onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                        >
                          <CloseIcon sx={{ fontSize: 12 }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div className="ctm__row ctm__row--1">
            <div>
              <label className="ctm__label">
                Subtasks
                {form.subtasks.length > 0 && (
                  <span className="ctm__label-count">{form.subtasks.length}</span>
                )}
              </label>
              {/* Existing subtasks first, so the input below always reads as
                  "add the next one" rather than "the subtask field". */}
              {form.subtasks.length > 0 && (
                <ol className="ctm__subtasks">
                  {form.subtasks.map((sub, i) => (
                    <li key={i} className="ctm__subtask">
                      <div className="ctm__subtask-top">
                        <DragIndicatorIcon
                          sx={{ fontSize: 15, color: "var(--text-faint)", flexShrink: 0 }}
                        />
                        <span className="ctm__subtask-index">{i + 1}</span>
                        <input
                          className="ctm__subtask-name"
                          value={sub.name}
                          onChange={(e) => editSubtask(i, { name: e.target.value })}
                          title={sub.name}
                        />
                        <button
                          type="button"
                          title="Remove subtask"
                          onClick={() => set("subtasks", form.subtasks.filter((_, j) => j !== i))}
                        >
                          <CloseIcon sx={{ fontSize: 13 }} />
                        </button>
                      </div>

                      <div className="ctm__subtask-meta">
                        <FormControl fullWidth size="small" sx={miniSelectSx}>
                          <Select
                            value={sub.priority}
                            onChange={(e) => editSubtask(i, { priority: e.target.value })}
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

                        <label className="ctm__mini" title="Subtask start date">
                          <CalendarTodayOutlinedIcon />
                          <input
                            type="date"
                            value={sub.startDate}
                            max={sub.dueDate || undefined}
                            onChange={(e) => editSubtask(i, { startDate: e.target.value })}
                          />
                        </label>

                        <label className="ctm__mini" title="Subtask due date">
                          <CalendarTodayOutlinedIcon />
                          <input
                            type="date"
                            value={sub.dueDate}
                            min={sub.startDate || undefined}
                            onChange={(e) => editSubtask(i, { dueDate: e.target.value })}
                          />
                        </label>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <div
                className="ctm__field"
                style={{ marginTop: form.subtasks.length ? 8 : 0 }}
              >
                <AccountTreeOutlinedIcon />
                <input
                  ref={subtaskRef}
                  value={subtaskDraft}
                  onChange={(e) => setSubtaskDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                  placeholder={
                    form.subtasks.length
                      ? `Add subtask ${form.subtasks.length + 1}...`
                      : "Add a subtask..."
                  }
                />
                <button
                  type="button"
                  className="ctm__inline-add"
                  onClick={addSubtask}
                  disabled={!subtaskDraft.trim()}
                >
                  <AddIcon sx={{ fontSize: 15 }} /> Add
                </button>
              </div>
              <p className="ctm__hint">
                Press Enter to add it and keep going — add as many as the task needs.
              </p>
            </div>
          </div>

          </div>
        </div>

        {/* Footer */}
        <div className="ctm__foot">
          <div className="ctm__actions">
            <button type="button" className="ctm__cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="ctm__submit"
              onClick={() => void submit()}
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={15} sx={{ color: "#fff" }} />
              ) : (
                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
              )}
              Create Task
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
