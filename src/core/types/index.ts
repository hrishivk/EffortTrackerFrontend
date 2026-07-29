

export interface UserData {
  id?:string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  projects: string;
  manager_id?: string | number | null;
  /** snake_case to match the API — see manager_id above. Omit to leave unchanged. */
  is_shared?: boolean;
}
