import { motion } from "framer-motion";
import {
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { formUserData } from "../../../../shared/types/User";
import SubtaskEditor from "../SubtaskEditor";
import type { SubtaskAssignee } from "../CreateTaskModal";
import AssigneePicker from "./AssigneePicker";
import { fixedSelectSx, menuProps, PRIMARY_GRADIENT, PRIORITY_CHOICES, selectSx } from "./constants";
import { CheckToggle, FieldLabel } from "./FormBits";
import type { CreateTaskFormState } from "./useCreateTaskForm";

type Props = {
  create: CreateTaskFormState;
  lockedProject?: string;
  formProjects: any[];
  isUserOrDev: boolean;
  role: string | undefined;
  viewUserId?: string;
  noMembersAssigned: boolean;
  assignableUsers: formUserData[];
  users: formUserData[];
  getUserName: (id: string) => string;
  currentUserName?: string;
  onGoToProjects: () => void;
  roomMembers: SubtaskAssignee[];
};

export default function CreateTaskPanel({
  create,
  lockedProject,
  formProjects,
  isUserOrDev,
  role,
  viewUserId,
  noMembersAssigned,
  assignableUsers,
  users,
  getUserName,
  currentUserName,
  onGoToProjects,
  roomMembers,
}: Props) {
  const {
    form,
    setForm,
    createStep,
    setCreateStep,
    wantSubtasks,
    setWantSubtasks,
    assignToSelf,
    setAssignToSelf,
    setShowCreateForm,
    submitting,
    panelLastSubtaskDue,
    panelDue,
    panelDueMin,
    goToSubtasks,
    handleCreateTask,
  } = create;
  const blocked = submitting || (!assignToSelf && noMembersAssigned);
  const toNextStep = createStep === 1 && wantSubtasks;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-shrink-0 overflow-hidden w-full lg:w-[380px]"
    >
      <div className="rounded-2xl shadow-sm p-4 sm:p-5 h-full" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold" style={{ fontSize: 18, color: "var(--text-primary)" }}>
              Create New Task
            </h3>
            <p className="mt-1" style={{ fontSize: 12, color: "var(--text-faint)" }}>
              {createStep === 1
                ? "Fill in the details to add a new task."
                : "Break the task down — as many subtasks as it needs."}
            </p>
          </div>
          <IconButton size="small" onClick={() => setShowCreateForm(false)}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </div>

        {createStep === 1 && (
          <>
            <div className="mb-4">
              <FieldLabel>Task Name</FieldLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., Update Patient Portal UI"
                value={form.taskName}
                onChange={(e) => setForm((f) => ({ ...f, taskName: e.target.value }))}
                sx={selectSx}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Project Selection</FieldLabel>
              <FormControl
                fullWidth
                size="small"
                sx={lockedProject ? fixedSelectSx : selectSx}
              >
                <Select
                  disabled={!!lockedProject}
                  value={form.project}
                  onChange={(e) => setForm((f) => ({ ...f, project: e.target.value, assignees: [] }))}
                  displayEmpty
                  renderValue={(val) =>
                    val
                      ? formProjects.find((p) => String(p.name) === val)?.name || val
                      : <span style={{ color: "#9ca3af" }}>Select a project</span>
                  }
                  MenuProps={menuProps}
                >
                  {(lockedProject
                    ? formProjects.filter((p) => p.name === lockedProject)
                    : formProjects
                  ).map((p) => (
                    <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                  ))}
                  {lockedProject &&
                    !formProjects.some((p) => p.name === lockedProject) && (
                      <MenuItem value={lockedProject}>{lockedProject}</MenuItem>
                    )}
                </Select>
              </FormControl>
            </div>

            {!isUserOrDev && (
              <AssigneePicker
                role={role}
                viewUserId={viewUserId}
                form={form}
                setForm={setForm}
                assignToSelf={assignToSelf}
                setAssignToSelf={setAssignToSelf}
                noMembersAssigned={noMembersAssigned}
                assignableUsers={assignableUsers}
                users={users}
                getUserName={getUserName}
                currentUserName={currentUserName}
                onGoToProjects={onGoToProjects}
              />
            )}

            <div className="mb-4">
              <FieldLabel>Priority Level</FieldLabel>
              <div className="flex gap-2">
                {PRIORITY_CHOICES.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setForm((f) => ({ ...f, priority: p.key }))}
                    className="flex-1 flex flex-col items-center gap-1 py-3 border-2 transition-all"
                    style={{
                      borderRadius: 12,
                      borderColor: form.priority === p.key ? p.color : "var(--border-light)",
                      backgroundColor: form.priority === p.key ? p.bg : "var(--bg-card)",
                    }}
                  >
                    <span style={{ fontSize: 18, color: p.color, fontWeight: 700 }}>
                      {p.icon}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: p.color }}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5 flex gap-3">
              <div className="flex-1 min-w-0">
                <FieldLabel>Start Date</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  sx={selectSx}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: panelDue ? { max: panelDue } : undefined,
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <FieldLabel>Due Date</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={panelDue}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  sx={selectSx}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: panelDueMin ? { min: panelDueMin } : undefined,
                  }}
                />
                {panelLastSubtaskDue > form.dueDate && (
                  <p className="ctm__hint">Set by the longest subtask.</p>
                )}
              </div>
            </div>
          </>
        )}

        {createStep === 2 && (
          <div className="mb-4">
            <SubtaskEditor
              compact
              subtasks={form.subtasks}
              onChange={(next) => setForm((f) => ({ ...f, subtasks: next }))}
              sequential={form.sequential}
              onSequentialChange={(next) =>
                setForm((f) => ({ ...f, sequential: next }))
              }
              roomMembers={roomMembers}
              defaultStartDate={form.startDate}
              defaultDueDate={panelDue}
            />
          </div>
        )}

        {createStep === 1 && (
          <CheckToggle
            className="mb-3"
            checked={wantSubtasks}
            label="Break this into subtasks"
            onToggle={() => {
              const next = !wantSubtasks;
              setWantSubtasks(next);
              if (!next) setForm((f) => ({ ...f, subtasks: [] }));
            }}
          />
        )}

        <div className="flex gap-2 sm:gap-3">
          <button
            className="flex-1 btn font-semibold"
            style={{ border: "1px solid var(--border-light)", color: "var(--text-secondary)", borderRadius: 12, fontSize: 13, padding: "10px 0" }}
            onClick={() =>
              createStep === 1 ? setShowCreateForm(false) : setCreateStep(1)
            }
          >
            {createStep === 1 ? "Cancel" : "Back"}
          </button>
          <button
            className="flex-1 btn text-white font-semibold"
            style={{
              background: PRIMARY_GRADIENT,
              borderRadius: 12,
              fontSize: 13,
              padding: "10px 0",
              opacity: blocked ? 0.7 : 1,
            }}
            onClick={toNextStep ? goToSubtasks : handleCreateTask}
            disabled={blocked}
          >
            {submitting ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : toNextStep ? (
              "Next"
            ) : (
              "Create Task"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
