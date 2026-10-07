import React from "react";
import { FormControl, MenuItem, Select, Switch, TextField, type TextFieldProps } from "@mui/material";

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
  "& .MuiInputBase-input": { padding: "10px 14px", fontSize: 13, fontWeight: 600 },
  "& .MuiSelect-select": { padding: "10px 14px" },
};

export const errorSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#fef2f2",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "#ef4444" },
    "&:hover fieldset": { borderColor: "#dc2626" },
    "&.Mui-focused fieldset": {
      borderColor: "#dc2626",
      boxShadow: "0 0 0 2px rgba(239,68,68,0.12)",
    },
  },
  "& .MuiInputBase-input": { padding: "10px 14px", fontSize: 13, fontWeight: 600 },
  "& .MuiSelect-select": { padding: "10px 14px" },
};

export const fieldSx = (error?: string) => (error ? errorSx : inputSx);

export const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "#7c3aed" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7c3aed" },
};

export const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 500, margin: "4px 0 0" }}>{message}</p>
  ) : null;

export const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
  <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
    {label}
    {required && <> <span style={{ color: "#ef4444" }}>*</span></>}
  </label>
);

export const SectionHeader = ({
  icon,
  title,
  className = "d-flex align-items-center gap-2 mb-3 mt-4",
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={className}>
    {icon}
    <h5 className="fw-bold mb-0" style={{ fontSize: 15 }}>{title}</h5>
    {children}
  </div>
);

type LabeledTextFieldProps = Omit<TextFieldProps, "onChange" | "error"> & {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
};

export const LabeledTextField = ({
  label,
  required,
  error,
  value,
  onValueChange,
  ...rest
}: LabeledTextFieldProps) => (
  <>
    <FieldLabel label={label} required={required} />
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      error={!!error}
      helperText={error}
      sx={fieldSx(error)}
      {...rest}
    />
  </>
);

type LabeledSelectProps = {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  placeholder: string;
  options: string[];
  onValueChange: (value: string) => void;
};

export const LabeledSelect = ({
  label,
  required,
  error,
  value,
  placeholder,
  options,
  onValueChange,
}: LabeledSelectProps) => (
  <>
    <FieldLabel label={label} required={required} />
    <FormControl fullWidth size="small" error={!!error} sx={fieldSx(error)}>
      <Select
        displayEmpty
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        renderValue={(val) => val || placeholder}
        sx={{ color: value ? "var(--text-primary)" : "var(--text-faint)" }}
      >
        {options.map((o) => (
          <MenuItem key={o} value={o}>{o}</MenuItem>
        ))}
      </Select>
    </FormControl>
    <ErrorText message={error} />
  </>
);

type ToggleCardProps = {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const ToggleCard = ({
  icon,
  title,
  description,
  checked,
  onToggle,
  className = "d-flex align-items-center justify-content-between p-3 rounded-3",
  style = { backgroundColor: "var(--bg-surface)" },
  children,
}: ToggleCardProps) => (
  <div className={className} style={style}>
    <div className="d-flex align-items-center gap-2">
      <span style={{ fontSize: 16, color: "#7c3aed" }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{description}</div>
        {children}
      </div>
    </div>
    <Switch checked={checked} onChange={(e) => onToggle(e.target.checked)} sx={switchSx} />
  </div>
);
