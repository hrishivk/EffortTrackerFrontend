import { CircularProgress, FormControl, MenuItem, Select, TextField } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";

import type { formUserData } from "../../../../../shared/types/User";
import InitialsAvatar from "./InitialsAvatar";
import { cardStyle, labelStyle, menuProps, selectSx, type TaskForm } from "./constants";
import { deadlineHelperText, getProjectDates, type ProjectOption } from "./utils";

type Props = {
  form: TaskForm;
  projects: ProjectOption[];
  users: formUserData[];
  submitting: boolean;
  onChange: (field: keyof TaskForm, value: string) => void;
  onSubmit: () => void;
  getUserName: (id: string | number | null | undefined) => string;
};

const placeholder = (text: string) => <span style={{ color: "#9ca3af" }}>{text}</span>;

const AssignTaskForm = ({
  form,
  projects,
  users,
  submitting,
  onChange,
  onSubmit,
  getUserName,
}: Props) => {
  const selectedProject = projects.find((p) => String(p.id) === form.project);
  const { start: projectStartDate, end: projectEndDate } = getProjectDates(selectedProject);

  return (
    <div className="rounded-3 border p-4 mb-4" style={cardStyle}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AssignmentIcon sx={{ color: "#fff", fontSize: 16 }} />
        </div>
        <h5 className="fw-bold mb-0" style={{ fontSize: 16 }}>
          Assign New Task
        </h5>
      </div>

      <div className="mb-3">
        <label style={labelStyle}>Task Name</label>
        <TextField
          fullWidth
          size="small"
          placeholder="e.g., Design system documentation"
          value={form.taskName}
          onChange={(e) => onChange("taskName", e.target.value)}
          sx={selectSx}
        />
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label style={labelStyle}>Project</label>
          <FormControl fullWidth size="small" sx={selectSx}>
            <Select
              value={form.project}
              onChange={(e) => onChange("project", e.target.value)}
              displayEmpty
              renderValue={(val) =>
                val
                  ? projects.find((p) => String(p.id) === val)?.name || val
                  : placeholder("Select project")
              }
              MenuProps={menuProps}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="col-md-6">
          <label style={labelStyle}>Priority</label>
          <FormControl fullWidth size="small" sx={selectSx}>
            <Select
              value={form.priority}
              onChange={(e) => onChange("priority", e.target.value)}
              MenuProps={menuProps}
            >
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label style={labelStyle}>Deadline</label>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={form.deadline}
            onChange={(e) => onChange("deadline", e.target.value)}
            sx={selectSx}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: {
                ...(projectStartDate ? { min: projectStartDate } : {}),
                ...(projectEndDate ? { max: projectEndDate } : {}),
              },
            }}
            helperText={deadlineHelperText(projectStartDate, projectEndDate, form.deadline)}
          />
        </div>
        <div className="col-md-6">
          <label style={labelStyle}>Assign Employee</label>
          <FormControl fullWidth size="small" sx={selectSx}>
            <Select
              value={form.assignEmployee}
              onChange={(e) => onChange("assignEmployee", e.target.value)}
              displayEmpty
              renderValue={(val) =>
                val ? getUserName(val) : placeholder("Select team member")
              }
              MenuProps={menuProps}
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={String(u.id)}>
                  <div className="d-flex align-items-center gap-2">
                    <InitialsAvatar name={u.fullName} size={24} fontSize={10} />
                    <span style={{ fontSize: 13 }}>{u.fullName}</span>
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button
          className="btn text-white d-flex align-items-center gap-2"
          style={{
            backgroundColor: "#7c3aed",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 24px",
            opacity: submitting ? 0.7 : 1,
          }}
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <CircularProgress size={16} sx={{ color: "#fff" }} />
          ) : (
            <AssignmentIcon sx={{ fontSize: 16 }} />
          )}
          {submitting ? "Assigning..." : "Assign Task"}
        </button>
      </div>
    </div>
  );
};

export default AssignTaskForm;
