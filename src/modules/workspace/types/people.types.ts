export interface AssignablePerson {
  id: string;
  name: string;
  role: string;
  projectIds: string[];
  shared: boolean;
  managerId: string;
}

export interface UserRow {
  id?: string;
  fullName: string;
  role: string;
  projects?: { id: string; name: string }[];
  is_shared?: boolean;
  manager_id?: string | number | null;
}
