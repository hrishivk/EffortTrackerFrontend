import React from "react";
import {
  type SelectChangeEvent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  OutlinedInput,
  TextField,
} from "@mui/material";
import type { CreateTaskPayload } from "../types";
import type { project } from "../../../shared/types/Project";

type Props = {
  taskData: CreateTaskPayload;
  projects: project[];
  fieldErrors: { [key: string]: string };
  onChange: (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | SelectChangeEvent<string>
  ) => void;
};

const NewTaskRow: React.FC<Props> = ({
  taskData,
  projects,
  fieldErrors,
  onChange,
}) => (
  <tr className="animate-rowEnter !w-full transition-all duration-500 ease-in-out bg-[#EFD1FA]/90 backdrop-blur-lg rounded-xl border-t border-purple-300 group">
    <td className="px-6 py-4 !min-w-[200px]">
      <FormControl fullWidth size="small" error={Boolean(fieldErrors.project)}>
        <InputLabel id="project-select-label">Select Project</InputLabel>
        <Select
          labelId="project-select-label"
          name="project"
          value={(taskData.project as string) || ""}
          onChange={(e) => onChange(e as SelectChangeEvent<string>)}
          input={<OutlinedInput sx={{ borderRadius: "8px" }} />}
        >
          {projects.map((item) => (
            <MenuItem key={item.id} value={item.name}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
        {fieldErrors.project && (
          <FormHelperText>{fieldErrors.project}</FormHelperText>
        )}
      </FormControl>
    </td>

    <td className="px-6 py-4 !min-w-[250px]">
      <TextField
        fullWidth
        name="description"
        label="Task Description"
        placeholder="Enter task description"
        value={taskData.description}
        onChange={onChange}
        error={Boolean(fieldErrors.description)}
        helperText={fieldErrors.description ? "Description is required" : ""}
        variant="outlined"
        size="small"
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
      />
    </td>
    <td className="px-6 py-4 !min-w-[200px]">
      <FormControl fullWidth size="small" error={Boolean(fieldErrors.priority)}>
        <InputLabel id="priority-select-label">Select Priority</InputLabel>
        <Select
          labelId="priority-select-label"
          name="priority"
          value={taskData.priority || ""}
          onChange={onChange}
          input={
            <OutlinedInput label="Select Priority" sx={{ borderRadius: "8px" }} />
          }
        >
          <MenuItem value="">Select Priority</MenuItem>
          <MenuItem value="High">High</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="Low">Low</MenuItem>
        </Select>
        {fieldErrors.priority && (
          <FormHelperText>Priority is required</FormHelperText>
        )}
      </FormControl>
    </td>
    <td className=" py-4"></td>
    <td className=" py-4"></td>
    <td className=" py-4 text-sm" style={{ color: "var(--text-muted)" }}></td>

    <td className="px-4 py-4">
      <select
        className="status-badge px-3 py-2 rounded-full text-xs font-medium bg-[#FFA041] text-gray-700"
        disabled
      >
        <option>Yet to start</option>
      </select>
    </td>
  </tr>
);

export default NewTaskRow;
