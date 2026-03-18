export type ColumnHandlers = {
  onViewTasks: (id: string) => void;
  onDeleteUser: (id: string) => void;
};


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
  department?: string;
  isOnLeave?: boolean;
}


export interface ProjectMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
}


export interface ProjectDetailsViewProps {
  project: any;
  allProjects: any[];
  onBack: () => void;
}

export interface GroupedPdTask {
  key: string;
  description: string;
  project: string | { id: string; name: string };
  priority: string;
  status: string;
  start_time?: string | null;
  end_time?: string | null;
  tasks: import("../../user/types").taskList[];
  assignees: { name: string; status: string; userId: string | number | null | undefined }[];
}

export interface ProjectExpandedRowProps {
  row: ProjectRow;
  onRefresh?: () => void;
}