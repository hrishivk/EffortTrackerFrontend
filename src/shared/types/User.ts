export interface formUserData {
  id?: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  projects: { id: string; name: string }[];
  profile: File | null;
  image?: string;
  isBlocked?: boolean;
  lastSeenAt: string | Date;
  manager_id?: string | number | null;
  /** Visible to every manager, not just the one who created them. */
  is_shared?: boolean;
  /** Profile fields — only present once list-users returns them. */
  contactNumber?: string;
  jobTitle?: string;
}

/**
 * GET /role-sp/user-details?id= — the full record behind one list row.
 * Field names match PATCH /role-sp/edit-user, so the modal reads this and
 * PATCHes the same shape straight back.
 */
export interface UserDetails {
  id: string;
  fullName: string;
  email: string;
  role: string;

  isBlocked: boolean;
  is_shared: boolean;
  manager_id?: string | number | null;

  contactNumber?: string | null;
  jobTitle?: string | null;
  employeeId?: string | null;
  department?: string | null;
  /** Date-only, YYYY-MM-DD. */
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  workSchedule?: string | null;
  /** Date-only, YYYY-MM-DD. */
  joiningDate?: string | null;

  projects: { id: string; name: string }[];
  domains: { id: string; name: string }[];

  /** ISO 8601 with offset. */
  createdAt?: string | null;
  /** ISO 8601 with offset, or null — this endpoint never sends the sentinel string. */
  lastSeenAt?: string | null;
  image?: string | null;
}

export interface UserModalProps {
  data?:any
  visible: boolean;
  onClose: () => void;
  onUpdate:()=>void
}