export type ColumnHandlers = {
  onViewTasks: (id: string) => void;
  onEditUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  avatarSrc: string;
};

// ─── Domain & Project Types ─────────────────────────────────────
export interface Project {
  id: number;
  name: string;
  users: number;
  tasks: number;
}

export interface Domain {
  id: number;
  name: string;
  created: string;
  projects: Project[];
}

export type DomainTab = "overview" | "Gantt chart";

export interface TabItem {
  key: DomainTab;
  label: string;
}

// ─── Executive Project Table ────────────────────────────────────
export interface TeamMember {
  name: string;
  avatar: string;
}

export interface ProjectRow {
  id: number;
  name: string;
  dueDate: string;
  clientDepartment: string;
  status: "ACTIVE" | "ON HOLD" | "COMPLETED";
  progress: number;
  teamAssigned: TeamMember[];
}

export interface PhaseItem {
  label: string;
  count: number;
  color: string;
  max: number;
}

export interface CriticalUpdate {
  title: string;
  description: string;
  type: "warning" | "success";
}

// ─── Create Project ─────────────────────────────────────────────
export interface ProjectFormData {
  name: string;
  category: string;
  description: string;
  startDate: string;
  endDate: string;
  domainId: string;
  teamMembers: string[];
}

export interface AvailableMember {
  id: string;
  fullName: string;
  role: string;
  isOnLeave?: boolean;
}

// ─── Project Members ───────────────────────────────────────────
export interface ProjectMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
}