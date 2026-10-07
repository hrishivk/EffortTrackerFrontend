


export interface EditUserPayload {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  projects?: string;
  password?: string;
  manager_id?: string | number | null;
  is_shared?: boolean;
  domain_ids?: string[];
  contactNumber?: string;
  jobTitle?: string;
  employeeId?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  joiningDate?: string;
}

export interface EditProjectPayload {
  name?: string;
  domain_id?: string | number;
  client_department?: string;
  end_date?: string;
  description?: string;
  start_date?: string;
  status?: string;
  extension_reason?: string;
}

export type ProjectActivityAction =
  | "created"
  | "extended"
  | "due_date_changed"
  | "status_changed"
  | "renamed"
  | "updated"
  | "member_added"
  | "member_removed";

export interface ProjectActivityEntry {
  id: string;
  action: ProjectActivityAction;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  fullName: string;
  email?: string;
  role?: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  editValues: EditProjectPayload & { id: string };
  members?: ProjectMember[];
  teamAssigned?: { id: string; name: string; avatar?: string }[];
  progress?: number;
  totalTasks?: number;
  completedTasks?: number;
  created_by?: string;
  created_at?: string;
  activity?: ProjectActivityEntry[];
  extension_count?: number;
  [key: string]: unknown;
}

export interface UserData {
  id?:string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  projects: string;
  manager_id?: string | number | null;
  is_shared?: boolean;
}
