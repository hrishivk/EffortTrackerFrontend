import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";

export const selectSx = {
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
  "& .MuiSvgIcon-root": { color: "var(--text-faint)" },
};

export const menuProps = {
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

export const MAX = { name: 60, code: 20, description: 2000, room: 40 };

export const VISIBILITY = [
  {
    value: "private",
    label: "Private",
    caption: "Only its assigned users, signing in with the workspace code.",
    icon: LockOutlinedIcon,
  },
  {
    value: "public",
    label: "Public",
    caption: "Anyone in the organisation can open it.",
    icon: PublicOutlinedIcon,
  },
];

export const STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
];

export const STEPS = [
  { label: "Workspace Details", caption: "Name your workspace" },
  { label: "Projects & Rooms", caption: "Add projects and create rooms" },
  { label: "Assign Users", caption: "Add users to rooms" },
  { label: "Review & Create", caption: "Review settings & create" },
];

export const labelOf = (list: { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? "";
