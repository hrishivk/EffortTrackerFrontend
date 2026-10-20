import { useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";

import { toDateInput } from "../../../shared/utils/taskStatus";
import { GENERAL_PROJECT } from "../../../shared/utils/projectName";
import { createTaskValidationSchema } from "../../../utils/validation/Validation";
import type { formUserData } from "../../../shared/types/User";
import { PRIORITIES, STATUS_ACCENT } from "./boardConstants";
import SubtaskEditor from "./SubtaskEditor";
import {
  adornment,
  fixedSelectSx,
  menuProps,
  placeholder,
  selectSx,
} from "./CreateTaskModal/ctmStyles";
import TagInput from "./CreateTaskModal/TagInput";
import AssigneeField from "./CreateTaskModal/AssigneeField";

export interface SubtaskDraft {
  name: string;
  assignee: string;
  priority: string;
  startDate: string;
  dueDate: string;
}

export interface CreateTaskFormData {
  taskName: string;
  project: string;
  priority: string;
  startDate: string;
  dueDate: string;
  assignees: string[];
  tags: string[];
  sequential: boolean;
  subtasks: SubtaskDraft[];
  /** The own group the task starts in; empty = Yet to Start. */
  groupId: string;
}

export interface SubtaskAssignee {
  id: string;
  name: string;
  role?: string;
}

// The Status option for the Yet to Start lane (no group).
const START = "start";

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
  groupId: "",
});

/** A Room select beside Project, for callers that place the task by project. */
export interface RoomPicker {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  /** The placeholder while no room is picked. */
  emptyLabel?: string;
  /** False when the task may go without a room (a General task). Default true. */
  required?: boolean;
}

interface CreateTaskModalProps {
  open: boolean;
  defaultStartDate?: string;
  onClose: () => void;
  projects: { id: string; name: string }[];
  assignableUsers: formUserData[];
  startLane?: { id: string; name: string; color: string };
  /** The user's own groups a new task can start in instead of the start lane. */
  followGroups?: { id: string; name: string; color: string }[];
  /** The group the Status starts on when the modal opens. */
  defaultGroupId?: string;
  fixedProject?: string;
  /** Project may be left empty: the task is then a General task (General page only). */
  projectOptional?: boolean;
  /** Told of every project pick, so the caller can look up where it goes. */
  onProjectChange?: (project: string) => void;
  /** Shown under Project, e.g. which room the task lands in. */
  projectHint?: string;
  roomPicker?: RoomPicker;
  defaultAssignee?: { id: string; name: string };
  isUserOrDev: boolean;
  currentUserName?: string;
  roomMembers?: SubtaskAssignee[];
  submitting: boolean;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
}

export default function CreateTaskModal({
  open,
  defaultStartDate,
  onClose,
  projects,
  assignableUsers,
  startLane,
  followGroups = [],
  defaultGroupId = "",
  fixedProject,
  projectOptional = false,
  onProjectChange,
  projectHint,
  roomPicker,
  defaultAssignee,
  isUserOrDev,
  currentUserName,
  roomMembers = [],
  submitting,
  onSubmit,
}: CreateTaskModalProps) {
  const [form, setForm] = useState<CreateTaskFormData>(emptyForm);
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof CreateTaskFormData>(key: K, value: CreateTaskFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm(),
      project: fixedProject ?? "",
      startDate: defaultStartDate || toDateInput(new Date()),
      assignees: !isUserOrDev && defaultAssignee ? [defaultAssignee.id] : [],
      groupId: defaultGroupId,
    });
    setTouched(false);
  }, [open, fixedProject, defaultStartDate, defaultAssignee, isUserOrDev, defaultGroupId]);

  const lastSubtaskDue = form.subtasks.reduce(
    (latest, sub) => (sub.dueDate > latest ? sub.dueDate : latest),
    ""
  );
  const dueDate = lastSubtaskDue > form.dueDate ? lastSubtaskDue : form.dueDate;
  const dueMin = lastSubtaskDue > form.startDate ? lastSubtaskDue : form.startDate;

  const problems = useMemo(() => {
    const result = createTaskValidationSchema.safeParse({
      taskName: form.taskName,
      // No project is a valid choice where the task may be a General task.
      project: projectOptional ? form.project || GENERAL_PROJECT : form.project,
      startDate: form.startDate,
      dueDate,
    });
    if (result.success) return {} as Record<string, string>;
    return result.error.errors.reduce<Record<string, string>>((acc, err) => {
      const key = String(err.path[0] ?? "");
      if (key && !acc[key]) acc[key] = err.message;
      return acc;
    }, {});
  }, [form.taskName, form.project, form.startDate, dueDate, projectOptional]);

  // With own groups on the board a new task starts in the first of them
  // (defaultGroupId); otherwise in Yet to Start.
  const followedGroup = followGroups.find((g) => g.id === form.groupId);

  const nameMissing = touched && !!problems.taskName;
  const projectMissing = touched && !!problems.project;
  const dueMissing = touched && !!problems.dueDate;
  const startInvalid = touched && !!problems.startDate;
  const roomRequired = !!roomPicker && roomPicker.required !== false;
  const roomMissing = touched && roomRequired && !roomPicker?.value;

  const submit = async () => {
    setTouched(true);
    if (Object.keys(problems).length > 0 || (roomRequired && !roomPicker?.value)) return;
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
          <div className="ctm__row ctm__row--2">
            {/* With a Room to pick, the name takes the whole line and Project
                and Room share the next one. */}
            <div style={roomPicker ? { gridColumn: "1 / -1" } : undefined}>
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
                Project{!projectOptional && <span className="ctm__req">*</span>}
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
                  onChange={(e) => {
                    set("project", e.target.value);
                    onProjectChange?.(e.target.value);
                  }}
                  startAdornment={adornment(FolderOutlinedIcon)}
                  MenuProps={menuProps}
                  renderValue={(v) =>
                    v
                      ? String(v)
                      : placeholder(projectOptional ? "No project (General)" : "Select a project")
                  }
                >
                  {projectOptional && !fixedProject && (
                    <MenuItem value="">No project (General task)</MenuItem>
                  )}
                  {(fixedProject
                    ? projects.filter((p) => p.name === fixedProject)
                    : projects
                  ).map((p) => (
                    <MenuItem key={p.id} value={p.name}>
                      {p.name}
                    </MenuItem>
                  ))}
                  {fixedProject &&
                    !projects.some((p) => p.name === fixedProject) && (
                      <MenuItem value={fixedProject}>{fixedProject}</MenuItem>
                    )}
                </Select>
              </FormControl>
              {fixedProject && !projectHint && (
                <p className="ctm__hint">The workspace's project.</p>
              )}
              {projectHint && <p className="ctm__hint">{projectHint}</p>}
            </div>
            {roomPicker && (
              <div>
                <label className="ctm__label">
                  Room{roomRequired && <span className="ctm__req">*</span>}
                </label>
                <FormControl
                  fullWidth
                  size="small"
                  sx={roomPicker.disabled ? fixedSelectSx : selectSx}
                  error={roomMissing}
                >
                  <Select
                    displayEmpty
                    disabled={roomPicker.disabled}
                    value={roomPicker.value}
                    onChange={(e) => roomPicker.onChange(String(e.target.value))}
                    startAdornment={adornment(MeetingRoomOutlinedIcon)}
                    MenuProps={menuProps}
                    renderValue={(v) =>
                      (v && roomPicker.options.find((o) => o.id === v)?.name) ||
                      placeholder(roomPicker.emptyLabel ?? "Select a room")
                    }
                  >
                    {roomPicker.options.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {roomMissing && <p className="ctm__hint">Pick the room this task goes in.</p>}
              </div>
            )}
          </div>

          <div className="ctm__row ctm__row--3">
            <div>
              <label className="ctm__label">Status</label>
              <FormControl fullWidth size="small" sx={fixedSelectSx}>
                <Select
                  disabled
                  value={START}
                  MenuProps={menuProps}
                  startAdornment={adornment(
                    RadioButtonCheckedIcon,
                    followedGroup?.color ?? STATUS_ACCENT.yet_to_start
                  )}
                >
                  <MenuItem value={START}>
                    {followedGroup?.name || startLane?.name || "Yet to Start"}
                  </MenuItem>
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

            <AssigneeField
              isUserOrDev={isUserOrDev}
              currentUserName={currentUserName}
              assignableUsers={assignableUsers}
              defaultAssignee={defaultAssignee}
              assignees={form.assignees}
              onChange={(next) => set("assignees", next)}
            />
          </div>

          <div className="ctm__row ctm__row--2">
            <div>
              <label className="ctm__label">Start Date</label>
              <div className={`ctm__field${startInvalid ? " ctm__field--invalid" : ""}`}>
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
              <label className="ctm__label">
                Due Date<span className="ctm__req">*</span>
              </label>
              <div className={`ctm__field${dueMissing ? " ctm__field--invalid" : ""}`}>
                <CalendarTodayOutlinedIcon />
                <input
                  type="date"
                  value={dueDate}
                  min={dueMin || undefined}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </div>
              {dueMissing && <p className="ctm__hint">{problems.dueDate}</p>}
              {!dueMissing && lastSubtaskDue > form.dueDate && (
                <p className="ctm__hint">
                  Set by the subtask that runs longest.
                </p>
              )}
            </div>
          </div>

          </div>

          <div className="ctm__aside">
          <div className="ctm__row ctm__row--1">
            <TagInput tags={form.tags} onChange={(next) => set("tags", next)} />
          </div>

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
