
export interface formUserData {
  id?: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  Project: any;
  profile: File | null;
  image?: string;
  isBlocked?:boolean;
  lastSeenAt: string | Date;
  manager_id?: string | number | null;
}