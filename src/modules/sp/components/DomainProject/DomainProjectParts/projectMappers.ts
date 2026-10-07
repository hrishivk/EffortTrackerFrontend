import type { ProjectRow, PhaseItem, CriticalUpdate } from "../../../types";

export type ProjectStats = {
  projects: { total: number; active: number; on_hold: number; paused: number; completed: number };
  activeResources: number;
  totalCompletion: number;
};

export const mapProjectRow = (p: any): ProjectRow => ({
  id: p.id,
  name: p.name || "",
  dueDate: p.end_date || p.dueDate || "-",
  clientDepartment: p.client_department || p.clientDepartment || p.domain?.name || "-",
  status: (p.status || "ACTIVE").toUpperCase(),
  progress: p.progress ?? 0,
  extensionCount: p.extension_count ?? 0,
  teamAssigned: (p.teamAssigned || []).map((u: any) =>
    typeof u === "string"
      ? { name: u, avatar: "" }
      : { name: u.fullName || u.name || "", avatar: u.avatar || "" }
  ),
});

export const mapGanttProject = (p: any) => ({
  id: p.id,
  name: p.name || "",
  start_date: p.start_date || p.startDate,
  end_date: p.end_date || p.dueDate,
  status: p.status || "active",
  progress: p.progress ?? 0,
});

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "_");

const PHASES = [
  { label: "Active", key: "active", color: "#7c3aed" },
  { label: "On Hold", key: "on_hold", color: "#ea580c" },
  { label: "Paused", key: "paused", color: "#d97706" },
  { label: "Completed", key: "completed", color: "#16a34a" },
];

export const buildPhaseData = (projects: ProjectRow[]): PhaseItem[] => {
  const max = projects.length || 1;
  return PHASES.map((phase) => ({
    label: phase.label,
    count: projects.filter((p) => norm(p.status) === phase.key).length,
    color: phase.color,
    max,
  }));
};

export const buildCriticalUpdates = (projects: ProjectRow[]): CriticalUpdate[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return [
    ...projects
      .filter((p) => {
        if (p.status === "COMPLETED") return false;
        const end = p.dueDate && p.dueDate !== "-" ? new Date(p.dueDate) : null;
        return end && end < now;
      })
      .map((p) => ({
        title: p.name,
        description: `Overdue — was due ${p.dueDate}. Current progress: ${p.progress}%`,
        type: "warning" as const,
      })),
    ...projects
      .filter((p) => p.status === "COMPLETED" || p.progress >= 100)
      .map((p) => ({
        title: p.name,
        description: `Completed successfully. Final progress: ${p.progress}%`,
        type: "success" as const,
      })),
  ];
};
