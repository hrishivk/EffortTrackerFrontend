import type { Dispatch, SetStateAction } from "react";
import { Checkbox, CircularProgress, FormControl, MenuItem, Select, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { selectSx, menuProps } from "../constants";
import { pdGetInitials } from "../utils";
import { PRIORITY_OPTIONS, type TaskFormState } from "./projectDetailsUtils";
import type { formUserData } from "../../../../../shared/types/User";

type Props = {
  taskForm: TaskFormState;
  setTaskForm: Dispatch<SetStateAction<TaskFormState>>;
  assignToSelf: boolean;
  setAssignToSelf: (value: boolean) => void;
  role?: string;
  currentUserName?: string;
  isUserOrDev: boolean;
  assignableUsers: formUserData[];
  getUserName: (id: string | number | null | undefined) => string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

const CreateTaskPanel = ({
  taskForm,
  setTaskForm,
  assignToSelf,
  setAssignToSelf,
  role,
  currentUserName,
  isUserOrDev,
  assignableUsers,
  getUserName,
  submitting,
  onCancel,
  onSubmit,
}: Props) => (
  <div className="pd-timeline-panel" style={{ padding: 24 }}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-gray-900" style={{ fontSize: 18 }}>Create New Task</h3>
        <p className="text-gray-400 mt-1" style={{ fontSize: 12 }}>Fill in the details to add a new task.</p>
      </div>
      <button onClick={onCancel}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8, display: "flex", alignItems: "center", color: "#9ca3af" }}>
        <CloseIcon sx={{ fontSize: 18 }} />
      </button>
    </div>
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Name</label>
      <TextField fullWidth size="small" placeholder="e.g., Update Patient Portal UI"
        value={taskForm.taskName} onChange={(e) => setTaskForm((f) => ({ ...f, taskName: e.target.value }))} sx={selectSx} />
    </div>
    {!isUserOrDev && (
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-sm font-semibold text-gray-700" style={{ lineHeight: 1 }}>Assignee</span>
          {role === "AM" && (
            <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => { const next = !assignToSelf; setAssignToSelf(next); if (next) setTaskForm((f) => ({ ...f, assignees: [] })); }} style={{ lineHeight: 1 }}>
              <input type="checkbox" checked={assignToSelf} readOnly style={{ accentColor: "#7c3aed", width: 15, height: 15, margin: 0, cursor: "pointer" }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#4b5563", cursor: "pointer" }}>Assign to myself</span>
            </div>
          )}
        </div>

        {assignToSelf ? (
          <div className="flex items-center gap-3 p-3" style={{ backgroundColor: "#f5f3ff", border: "1px solid #e0d6ff", borderRadius: 12 }}>
            <div className="flex items-center justify-center rounded-full text-white flex-shrink-0"
              style={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, backgroundColor: "#7c3aed" }}>
              {pdGetInitials(currentUserName || "Me")}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800" style={{ margin: 0 }}>{currentUserName || "Me"}</p>
              <p className="text-xs text-gray-500" style={{ margin: 0 }}>This task will be assigned to you</p>
            </div>
          </div>
        ) : assignableUsers.length === 0 ? (
          <div className="flex items-start gap-3 p-3" style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 12 }}>
            <span style={{ fontSize: 18, lineHeight: 1.2 }}>&#9888;</span>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">No members assigned to this project</p>
              <p className="text-xs text-gray-600 mb-0">Please assign members to this project first before creating a task.</p>
            </div>
          </div>
        ) : (
          <>
            <FormControl fullWidth size="small" sx={selectSx}>
              <Select multiple value={taskForm.assignees}
                onChange={(e) => {
                  const val = e.target.value;
                  setTaskForm((f) => ({ ...f, assignees: typeof val === "string" ? val.split(",") : val }));
                }}
                displayEmpty
                renderValue={(selected) =>
                  selected.length === 0
                    ? <span style={{ color: "#9ca3af" }}>Search team members...</span>
                    : <span style={{ fontSize: 13 }}>{selected.length} member{selected.length > 1 ? "s" : ""} selected</span>
                }
                MenuProps={menuProps}>
                {assignableUsers.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    <div className="flex items-center gap-2 w-full">
                      <Checkbox checked={taskForm.assignees.includes(String(u.id))} size="small" sx={{ "&.Mui-checked": { color: "#7c3aed" } }} />
                      <div className="flex items-center justify-center rounded-full text-white"
                        style={{ width: 24, height: 24, fontSize: 10, fontWeight: 700, backgroundColor: "#7c3aed" }}>
                        {pdGetInitials(u.fullName)}
                      </div>
                      <span style={{ fontSize: 13 }}>{u.fullName}</span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {taskForm.assignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {taskForm.assignees.map((id) => {
                  const name = getUserName(id);
                  return (
                    <div key={id} className="flex items-center gap-1.5 px-2 py-1" style={{ backgroundColor: "#f3f4f6", borderRadius: 12 }}>
                      <div className="flex items-center justify-center rounded-full text-white"
                        style={{ width: 20, height: 20, fontSize: 8, fontWeight: 700, backgroundColor: "#7c3aed" }}>
                        {pdGetInitials(name)}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{name}</span>
                      <button onClick={() => setTaskForm((f) => ({ ...f, assignees: f.assignees.filter((a) => a !== id) }))}
                        className="ml-0.5 text-gray-400 hover:text-gray-600" style={{ fontSize: 13, lineHeight: 1, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    )}

    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority Level</label>
      <div className="flex gap-2">
        {PRIORITY_OPTIONS.map((p) => (
          <button key={p.key} onClick={() => setTaskForm((f) => ({ ...f, priority: p.key }))}
            className="flex-1 flex flex-col items-center gap-1 py-3 border-2 transition-all"
            style={{ borderRadius: 12, borderColor: taskForm.priority === p.key ? p.color : "#e5e7eb", backgroundColor: taskForm.priority === p.key ? p.bg : "#fff" }}>
            <span style={{ fontSize: 18, color: p.color, fontWeight: 700 }}>{p.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.label}</span>
          </button>
        ))}
      </div>
    </div>

    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
      <TextField fullWidth size="small" type="date" value={taskForm.dueDate}
        onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
        sx={selectSx} slotProps={{ inputLabel: { shrink: true } }} />
    </div>

    <div className="flex gap-3">
      <button className="flex-1 btn border border-gray-300 text-gray-700 font-semibold"
        style={{ borderRadius: 12, fontSize: 13, padding: "10px 0" }}
        onClick={onCancel}>
        Cancel
      </button>
      <button className="flex-1 btn text-white font-semibold"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 12, fontSize: 13, padding: "10px 0", opacity: submitting ? 0.7 : 1 }}
        onClick={onSubmit} disabled={submitting}>
        {submitting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Create Task"}
      </button>
    </div>
  </div>
);

export default CreateTaskPanel;
