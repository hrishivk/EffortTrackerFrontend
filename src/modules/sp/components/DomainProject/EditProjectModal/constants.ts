export const NAME_MAX = 100;

export const REASON_MAX = 500;

export const ROSTER_PAGE_SIZE = 20;

export const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-surface)",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
    },
  },
  "& .MuiInputBase-input": {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  "& .MuiSelect-select": { padding: "10px 14px", color: "var(--text-primary)" },
  "& .MuiSelect-icon": { color: "var(--text-muted)" },
};

export const errorSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    backgroundColor: "#fef2f2",
    "& fieldset": { borderColor: "#ef4444" },
    "&:hover fieldset": { borderColor: "#dc2626" },
    "&.Mui-focused fieldset": {
      borderColor: "#dc2626",
      boxShadow: "0 0 0 2px rgba(239,68,68,0.12)",
    },
  },
};
