import type { project } from "../../../../../shared/types/Project";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const WORK_SCHEDULES = ["Full-Time (10 AM - 7 PM)", "Part-Time", "Flexible", "Remote"];

export const initialForm = {
  fullName: "",
  email: "",
  password: "",
  jobTitle: "",
  employeeId: "",
  contactNumber: "",
  dateOfBirth: "",
  bloodGroup: "",
  role: "",
  departments: [] as string[],
  workSchedule: "",
  joiningDate: "",
  manager_id: "",
  projects: [] as string[],
  sendWelcomeEmail: true,
  requirePasswordChange: true,
  is_shared: false,
  domains: [] as string[],
};

export type UserForm = typeof initialForm;

export type FieldErrors = Record<string, string>;

export type ChangeHandler = (field: string, value: string | boolean) => void;

export const normalize = (name: string) => name.trim().toLowerCase();

export const departmentOf = (p: project & { domain?: unknown; client_department?: string }) => {
  const d = p.domain as { name?: string } | string | undefined;
  const name =
    d && typeof d === "object" ? d.name : typeof d === "string" ? d : undefined;
  return String(name ?? p.client_department ?? "").trim().toLowerCase();
};

export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/** Fields checked by uservalidationSchema, shared by per-field validation and submit. */
export const buildValidationPayload = (form: UserForm): Record<string, any> => ({
  fullName: form.fullName,
  email: form.email,
  password: form.password,
  role: form.role,
  jobTitle: form.jobTitle,
  employeeId: form.employeeId,
  contactNumber: form.contactNumber,
  dateOfBirth: form.dateOfBirth,
  bloodGroup: form.bloodGroup,
  department: form.departments[0] ?? "",
  workSchedule: form.workSchedule,
  joiningDate: form.joiningDate,
});
