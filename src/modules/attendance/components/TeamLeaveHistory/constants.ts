import type React from "react";

export const PAGE_SIZE = 10;

export const leaveTypes = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Leave Without Pay",
  "Compensatory Off",
  "On Duty",
];

export const statusOptions: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "manager_approved", label: "Manager Approved" },
  { value: "manager_rejected", label: "Manager Rejected" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
  manager_approved: { label: "Manager Approved", color: "#2563eb", bg: "#dbeafe" },
  manager_rejected: { label: "Manager Rejected", color: "#dc2626", bg: "#fee2e2" },
  approved: { label: "Approved", color: "#16a34a", bg: "#dcfce7" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fee2e2" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },
};

export const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiInputBase-input": { padding: "8px 14px", fontSize: 13, color: "var(--text-primary)" },
};

export const menuProps = {
  PaperProps: { sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" } },
};

export const thStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#000",
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

export const GRID = "1.3fr 1fr 0.9fr 0.9fr 0.5fr 1.1fr 0.9fr";

export const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border-card)",
  boxShadow: "var(--shadow-card)",
};

export const formatDate = (d?: string) => {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};
