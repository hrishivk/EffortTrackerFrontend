

export interface UserData {
  id?:string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  projects: string;
  manager_id?: string | number | null;
}
