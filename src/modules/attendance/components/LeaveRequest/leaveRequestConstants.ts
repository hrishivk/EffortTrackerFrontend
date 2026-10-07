const inputSx = (
  backgroundColor: string,
  fieldset: Record<string, unknown>,
) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor,
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    ...fieldset,
  },
  "& .MuiInputBase-input": { padding: "8px 14px", fontSize: 13, color: "var(--text-primary)" },
});

export const selectSx = inputSx("var(--bg-surface)", {
  "& fieldset": { borderColor: "var(--border-light)" },
  "&.Mui-focused fieldset": {
    borderColor: "#7c3aed",
    boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
  },
});

export const errorSx = inputSx("#fef2f2", {
  "& fieldset": { borderColor: "#ef4444" },
  "&:hover fieldset": { borderColor: "#dc2626" },
  "&.Mui-focused fieldset": {
    borderColor: "#dc2626",
    boxShadow: "0 0 0 2px rgba(239,68,68,0.12)",
  },
});

export const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

export const leaveTypes = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Leave Without Pay",
  "Compensatory Off",
  "On Duty",
];

export const sessions = ["Full Day", "First Half", "Second Half"] as const;

export type BalanceItem = { label: string; days: number; color: string };

export const defaultBalance: BalanceItem[] = [
  { label: "Casual Leave", days: 8, color: "#14b8a6" },
  { label: "Sick Leave", days: 5, color: "#f97316" },
  { label: "Earned Leave", days: 12, color: "#7c3aed" },
];

export const balanceColorMap: Record<string, string> = {
  casual: "#14b8a6", sick: "#f97316", earned: "#7c3aed",
  "leave without pay": "#ef4444", "compensatory off": "#a855f7", "on duty": "#3b82f6",
};

export type LeaveForm = {
  leaveType: string;
  session: string;
  fromDate: string;
  toDate: string;
  contact: string;
  reason: string;
};

export const EMPTY_FORM: LeaveForm = {
  leaveType: "",
  session: "Full Day",
  fromDate: "",
  toDate: "",
  contact: "",
  reason: "",
};

export const toValidationPayload = (form: LeaveForm) => ({
  leaveType: form.leaveType,
  fromDate: form.fromDate,
  toDate: form.toDate || undefined,
  contact: form.contact || undefined,
  reason: form.reason,
});
