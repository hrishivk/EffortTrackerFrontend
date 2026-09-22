


export interface EditUserPayload {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  projects?: string;
  password?: string;
  manager_id?: string | number | null;
  is_shared?: boolean;
  /**
   * Which departments a shared user belongs to. Only meaningful with
   * `is_shared`, and the same shape `add-user` takes.
   */
  domain_ids?: string[];
  contactNumber?: string;
  jobTitle?: string;
  employeeId?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  joiningDate?: string;
}

/**
 * What the write takes. The names are the API's own, and the edit form fills
 * them straight from `editValues` on the project read — `client_department` is
 * the column, and there is no `project_category` one despite the field the
 * form labels "category".
 */
export interface EditProjectPayload {
  name?: string;
  domain_id?: string | number;
  client_department?: string;
  end_date?: string;
  description?: string;
  start_date?: string;
  /** Stored casing (`active`, `on_hold`), never the table's display twin. */
  status?: string;
}

/** Somebody on a project, straight off the join. SP accounts are excluded. */
export interface ProjectMember {
  id: string;
  fullName: string;
  email?: string;
  role?: string;
}

/**
 * One project, read by id.
 *
 * Two versions of the same record live on this response and they are not
 * interchangeable. The top level is for display — `dueDate`, `startDate`, and a
 * shouty `status: "ACTIVE"` — while `editValues` is the write body, field for
 * field, in the casing the columns actually store. A form that fills itself
 * from the display twins posts "ON HOLD" into a column that takes `on_hold`,
 * so the form reads `editValues` and nothing else.
 */
export interface ProjectDetail {
  id: string;
  name: string;
  editValues: EditProjectPayload & { id: string };
  /** Current members, for the picker. Replaces scanning every user's projects[]. */
  members?: ProjectMember[];
  /** The table's avatar strip. Not a substitute for `members` — no ids. */
  teamAssigned?: { id: string; name: string; avatar?: string }[];
  /** Computed on every read, not stored. */
  progress?: number;
  totalTasks?: number;
  completedTasks?: number;
  created_by?: string;
  created_at?: string;
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
