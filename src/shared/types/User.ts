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
  is_shared?: boolean;
  contactNumber?: string;
  jobTitle?: string;
}

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
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  workSchedule?: string | null;
  joiningDate?: string | null;

  projects: { id: string; name: string }[];
  domains: { id: string; name: string }[];

  createdAt?: string | null;
  lastSeenAt?: string | null;
  image?: string | null;
}

export interface UserModalProps {
  data?:any
  visible: boolean;
  onClose: () => void;
  onUpdate:()=>void
}