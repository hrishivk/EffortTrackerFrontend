import InputAdornment from "@mui/material/InputAdornment";

export const TAG_COLORS = [
  { bg: "rgba(124, 58, 237, 0.12)", text: "#7c3aed" },
  { bg: "rgba(59, 130, 246, 0.12)", text: "#2563eb" },
  { bg: "rgba(239, 68, 68, 0.12)", text: "#dc2626" },
  { bg: "rgba(34, 197, 94, 0.12)", text: "#16a34a" },
  { bg: "rgba(245, 158, 11, 0.14)", text: "#d97706" },
];

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
  "& .MuiSelect-select": { display: "flex", alignItems: "center", paddingLeft: "4px" },
  "& .MuiSvgIcon-root": { color: "var(--text-faint)" },
};

export const fixedSelectSx = {
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

export const adornment = (Icon: React.ElementType, color = "var(--text-faint)") => (
  <InputAdornment position="start" sx={{ marginRight: 0.75 }}>
    <Icon sx={{ fontSize: 17, color }} />
  </InputAdornment>
);

export const placeholder = (text: string) => (
  <span style={{ color: "var(--text-faint)" }}>{text}</span>
);
