import dayjs from "dayjs";
import type { ZodError } from "zod";

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

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export const ROLE_LABELS: Record<string, string> = {
  SP: "Super Admin",
  AM: "Manager",
  USER: "User",
  DEVLOPER: "Developer",
};

export const VISIBLE_CHIPS = 3;

export type Tab = "details" | "password";

export const emptyForm = {
  fullName: "",
  email: "",
  role: "",
  contactNumber: "",
  jobTitle: "",
  employeeId: "",
  dateOfBirth: "",
  bloodGroup: "",
  joiningDate: "",
  projects: [] as string[],
  is_shared: false,
  domains: [] as string[],
};

export type EditUserForm = typeof emptyForm;

export type FieldErrors = Record<string, string>;

export const emptyPasswords = { password: "", confirmPassword: "" };

export type Passwords = typeof emptyPasswords;

/** The fields both the list row and the full profile carry. */
export const baseFields = (src: {
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  contactNumber?: string | null;
  jobTitle?: string | null;
  projects?: { id: string | number }[] | null;
  is_shared?: boolean | null;
}) => ({
  fullName: src.fullName || "",
  email: src.email || "",
  role: (src.role || "").toUpperCase(),
  contactNumber: src.contactNumber || "",
  jobTitle: src.jobTitle || "",
  projects: (src.projects || []).map((p) => String(p.id)),
  is_shared: Boolean(src.is_shared),
});

export const toggleId = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

/** First message per field, as the form shows them. */
export const collectFieldErrors = (error: ZodError): FieldErrors => {
  const fieldErrors: FieldErrors = {};
  error.errors.forEach((err) => {
    const key = err.path[0] as string;
    if (!fieldErrors[key]) fieldErrors[key] = err.message;
  });
  return fieldErrors;
};

export const formatLastSeen = (value?: string | Date | null) => {
  if (!value) return "Active now";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY, h:mm A") : "No login activity";
};

export const formatCreatedOn = (value?: string | null) => {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY, h:mm A") : "—";
};

export const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};
