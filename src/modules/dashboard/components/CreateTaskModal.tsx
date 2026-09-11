import { useEffect, useState } from "react";
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

import { toDateInput } from "../../../shared/utils/taskStatus";
import type { formUserData } from "../../../shared/types/User";
import { PRIORITIES, STATUS_ACCENT } from "./boardConstants";
import SubtaskEditor from "./SubtaskEditor";

/** A child task, with its own assignee, priority and dates. */
export interface SubtaskDraft {
  name: string;
  /**
   * The room member who owns this child. "" means it inherits the parent's
   * assignee, which is how a task outside a room still behaves.
   */
  assignee: string;
  priority: string;
  startDate: string;
  dueDate: string;
}

/** Everything the form collects. */
export interface CreateTaskFormData {
  taskName: string;
  project: string;
  priority: string;
  startDate: string;
  dueDate: string;
  assignees: string[];
  tags: string[];
  /** Subtasks run strictly in listed order — each waits for the one above. */
  sequential: boolean;
  subtasks: SubtaskDraft[];
}

/** Somebody a subtask can be handed to. */
export interface SubtaskAssignee {
  id: string;
  name: string;
  role?: string;
}

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
  sequential: false,
  subtasks: [],
});

interface CreateTaskModalProps {
  open: boolean;
  /**
   * The day the task starts unless changed, as `YYYY-MM-DD` — the day the
   * caller is looking at. Falls back to today, so the field is never blank:
   * a task with no start date has no place on the board's timeline.
   */
  defaultStartDate?: string;
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
  /**
   * The room's members, when this task is being raised inside one. Each subtask
   * can be handed to one of them, which is what turns a task into shared work:
   * three people on one task, each holding their own piece.
   *
   * Empty outside a room — the per-subtask assignee column is then hidden and
   * every child inherits the parent's assignee, as before.
   */
  roomMembers?: SubtaskAssignee[];
  submitting: boolean;
  /** Resolves once the task is saved. */
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
}

export default function CreateTaskModal({
  open,
  defaultStartDate,
  onClose,
  projects,
  assignableUsers,
  startLane,
  fixedProject,
  defaultAssignee,
  isUserOrDev,
  currentUserName,
  roomMembers = [],
  submitting,
  onSubmit,
}: CreateTaskModalProps) {
  const [form, setForm] = useState<CreateTaskFormData>(emptyForm);
  const [tagDraft, setTagDraft] = useState("");
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
      startDate: defaultStartDate || toDateInput(new Date()),
      assignees: !isUserOrDev && defaultAssignee ? [defaultAssignee.id] : [],
    });
    setTagDraft("");
    setTouched(false);
  }, [open, fixedProject, defaultStartDate, defaultAssignee, isUserOrDev]);

  /*
   * The task has to outlast its subtasks, so the last day any of them runs to
   * is the floor for its own due date: put a subtask three weeks out and the
   * task's deadline goes with it. `YYYY-MM-DD` compares correctly as a string,
   * and "" sorts below every real date, so an unset date never wins.
   */
  const lastSubtaskDue = form.subtasks.reduce(
    (latest, sub) => (sub.dueDate > latest ? sub.dueDate : latest),
    ""
  );
  /** What the Due Date field shows and what gets saved. */
  const dueDate = lastSubtaskDue > form.dueDate ? lastSubtaskDue : form.dueDate;
  /** A due date can be moved out past the subtasks, never back inside them. */
  const dueMin = lastSubtaskDue > form.startDate ? lastSubtaskDue : form.startDate;

  const nameMissing = touched && !form.taskName.trim();
  const projectMissing = touched && !form.project;

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || form.tags.includes(t)) return setTagDraft("");
    set("tags", [...form.tags, t]);
    setTagDraft("");
  };

  const submit = async () => {
    setTouched(true);
    if (!form.taskName.trim() || !form.project) return;
    // `dueDate` rather than `form.dueDate`: the subtasks may have pushed it out.
    await onSubmit({ ...form, dueDate });
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
                  max={dueDate || undefined}
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
                  value={dueDate}
                  min={dueMin || undefined}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </div>
              {/* Said out loud, because the field moved on its own. */}
              {lastSubtaskDue > form.dueDate && (
                <p className="ctm__hint">
                  Set by the subtask that runs longest.
                </p>
              )}
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

          {/*
           * Subtasks sit in the right column with the tags — the collections,
           * beside the task's own fields on the left.
           *
           * This only fits because a row is now one line. The previous version
           * showed every field on every row, three deep, and four children
           * filled the column; `compact` reflows the one row being edited to
           * two columns, which is what the half-width column has room for.
           */}
          <SubtaskEditor
            compact
            subtasks={form.subtasks}
            onChange={(next) => set("subtasks", next)}
            sequential={form.sequential}
            onSequentialChange={(next) => set("sequential", next)}
            roomMembers={roomMembers}
            defaultStartDate={form.startDate}
            defaultDueDate={dueDate}
          />
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
