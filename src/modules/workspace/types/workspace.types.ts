import type { WorkspaceStatus } from "../../user/types";

export interface ManagerOption {
  id: string;
  name: string;
  email?: string;
  isMine?: boolean;
}

export interface ManagerRef {
  id: string;
  fullName: string;
}

export interface StatusChoice {
  value: WorkspaceStatus;
  label: string;
  note: string;
}

export type ManagedWorkspace = { created_by?: string; can_manage?: boolean };
