import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import type { formUserData } from "../../../../shared/types/User";
import { adornment, menuProps, placeholder, selectSx } from "./ctmStyles";

interface AssigneeFieldProps {
  isUserOrDev: boolean;
  currentUserName?: string;
  assignableUsers: formUserData[];
  defaultAssignee?: { id: string; name: string };
  assignees: string[];
  onChange: (assignees: string[]) => void;
}

export default function AssigneeField({
  isUserOrDev,
  currentUserName,
  assignableUsers,
  defaultAssignee,
  assignees,
  onChange,
}: AssigneeFieldProps) {
  return (
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
            value={assignees[0] ?? ""}
            onChange={(e) => onChange(e.target.value ? [String(e.target.value)] : [])}
            startAdornment={adornment(PersonOutlineIcon)}
            MenuProps={menuProps}
            renderValue={(v) => {
              if (!v) return placeholder("Unassigned");
              const known = assignableUsers.find(
                (u) => String(u.id) === String(v)
              )?.fullName;
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
            {defaultAssignee &&
              !assignableUsers.some((u) => String(u.id) === defaultAssignee.id) && (
                <MenuItem value={defaultAssignee.id}>{defaultAssignee.name}</MenuItem>
              )}
          </Select>
        </FormControl>
      )}
    </div>
  );
}
