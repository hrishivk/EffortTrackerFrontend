export function pdGetInitials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function pdFormatDate(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export function pdGetTaskStatus(status: string) {
  const s = (status || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (s === "completed" || s === "done") return { label: "COMPLETED", color: "#16a34a", bg: "#dcfce7" };
  if (s === "in_progress") return { label: "IN PROGRESS", color: "#2563eb", bg: "#dbeafe" };
  if (s === "review") return { label: "REVIEW", color: "#d97706", bg: "#fef3c7" };
  if (s === "blocked") return { label: "BLOCKED", color: "#dc2626", bg: "#fee2e2" };
  return { label: "YET TO START", color: "#9333ea", bg: "#f5f3ff" };
}

export function pdGetDaysLeft(endTime?: string | null) {
  if (!endTime) return null;
  const end = new Date(endTime);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due today";
  return `${diff} Day${diff > 1 ? "s" : ""} left`;
}

export function pdGetProjectStatusBadge(status: string) {
  const s = (status || "").toLowerCase().replace(/\s+/g, "_");
  if (s === "active") return { label: "ACTIVE", color: "#059669", bg: "#ecfdf5" };
  if (s === "on_hold") return { label: "ON HOLD", color: "#ea580c", bg: "#fff7ed" };
  if (s === "paused") return { label: "PAUSED", color: "#d97706", bg: "#fef3c7" };
  if (s === "completed") return { label: "COMPLETED", color: "#16a34a", bg: "#f0fdf4" };
  return { label: status.toUpperCase(), color: "#7c3aed", bg: "#f5f3ff" };
}

export function isUserInProject(user: { projects?: { id: string }[] }, projectId: any): boolean {
  const pid = String(projectId);
  if (!user.projects || !Array.isArray(user.projects)) return false;
  return user.projects.some((p) => String(p.id) === pid);
}
