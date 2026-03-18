export interface ProfileData {
  id?: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  projects?: { id: string; name: string }[];
  image?: string;
  isBlocked?: boolean;
  lastSeenAt?: string | Date | null;

  employeeId?: string;
  jobTitle?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  contactNumber?: string;
  joiningDate?: string;
  workSchedule?: string;

  reportingManager?: {
    id?: string;
    fullName?: string;
    designation?: string;
    image?: string;
  } | null;

  departmentMembers?: {
    count: number;
    members: { id: string; fullName: string }[];
  };
}

export interface RoleMeta {
  label: string;
  bg: string;
  color: string;
  glow: string;
}
