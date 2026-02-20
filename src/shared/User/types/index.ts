export interface formUserData {
  id?: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  projects: { id: string; name: string }[];
  profile: File | null;
  image?: string;
  isBlocked?: boolean;
  lastSeenAt: string | Date;
  manager_id?: string | number | null;
}

export interface UserModalProps {
  data?:any
  visible: boolean;
  onClose: () => void;
  onUpdate:()=>void
}