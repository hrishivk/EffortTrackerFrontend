


export interface EditUserPayload {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  projects?: string;
  password?: string;
  manager_id?: string | number | null;
  is_shared?: boolean;
  /** Departments of a shared user; replaces the whole set, omit to leave it. */
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
  project_category?: string;
  end_date?: string;
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
