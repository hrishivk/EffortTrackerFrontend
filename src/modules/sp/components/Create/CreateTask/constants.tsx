import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import CodeIcon from "@mui/icons-material/Code";

export type TaskForm = {
  taskName: string;
  deadline: string;
  assignEmployee: string;
  project: string;
  priority: string;
};

export const INITIAL_FORM: TaskForm = {
  taskName: "",
  deadline: "",
  assignEmployee: "",
  project: "",
  priority: "HIGH",
};

export const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-surface)",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiInputBase-input": { padding: "10px 14px", fontSize: 13 },
};

export const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

export const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
  display: "block",
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  borderColor: "var(--border-light)",
};

export const priorityIcons: Record<string, React.ReactNode> = {
  HIGH: <AssignmentIcon sx={{ fontSize: 18, color: "#dc2626" }} />,
  MEDIUM: <EditIcon sx={{ fontSize: 18, color: "#f59e0b" }} />,
  LOW: <CodeIcon sx={{ fontSize: 18, color: "#7c3aed" }} />,
};

export const priorityColors: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "#fef2f2", text: "#dc2626" },
  MEDIUM: { bg: "#fffbeb", text: "#d97706" },
  LOW: { bg: "#f5f3ff", text: "#7c3aed" },
};
