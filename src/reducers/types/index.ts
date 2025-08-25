export interface UserInfo {
  id?: string | number | null;
  role: string;
  email: string;
  fullName: string;
  image: string;
  projectName?:string
}
export interface AuthState {
  user: UserInfo;
  isError: boolean;
  isLocked: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  message: string;
}