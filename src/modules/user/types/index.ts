export type taskList = {
  id?: string;
  created_by?: string  | number | null;
  assigned_to?: string  | number | null ;
  project: string | { id: string; name: string };
  description: string;
  priority: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  isLocked?: boolean;
  totalTime?: string ;
  created_at?: string;
  progress?: number;
  daily_log_id?: string;
  project_id?: string;
  total_time_label?: string;
  group_id?: string | null;
  group?: { id: string; name: string; color: string; position?: number } | null;
  start_date?: string | null;
  due_date?: string | null;
  total_seconds?: number;
  tags?: string[];
  parent_id?: string | null;
  subtasks?: taskList[];
  updated_at?: string;
  completed_at?: string;
  dailyLog?: {
    id: string;
    created_by: string;
    assigned_to: string;
    assignedUser: {
      id: string;
      fullName: string;
      email: string;
    };
    creator: {
      id: string;
      fullName: string;
      email: string;
    };
  };
};


export type SubtaskInput = {
  name: string;
  priority?: string;
  start_date?: string;
  due_date?: string;
};


export type CreateTaskPayload = Omit<taskList, "subtasks"> & {
  subtasks?: SubtaskInput[];
};


export type WorkspaceStatus = "planning" | "active" | "on_hold";

/**
 * Who can open the workspace. `private` means only its assigned users, and
 * they must present the workspace `code` — so a private workspace without a
 * code would shut everyone out, and the wizard requires one.
 */
export type WorkspaceVisibility = "private" | "public";

export type WorkspaceRoomInput = {
  name: string;
  position?: number;
  member_ids: string[];
};


export type CreateWorkspacePayload = {
  name: string;
  code?: string;
  status: WorkspaceStatus;
  visibility: WorkspaceVisibility;
  description?: string;
  project_id: string;
  rooms: WorkspaceRoomInput[];
};

export type RoomMember = {
  id: string;
  fullName: string;

  role: string;
};

export type WorkspaceRoom = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  name: string;
  position: number;
  members: RoomMember[];
}
export type Workspace = {
  id: string;
  name: string;
  code: string | null;
  status: WorkspaceStatus;
  visibility?: WorkspaceVisibility;
  /**
   * Set by the server when the caller has to present the workspace code
   * before it will hand anything over. The check is per request, against the
   * database — there is no client-side memory of an unlock, so revoking
   * access takes effect on the next page load.
   *
   * A locked response carries only enough to render the prompt: id, name,
   * visibility and this flag.
   */
  locked?: boolean;
  description: string | null;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string } | null;
  rooms?: WorkspaceRoom[];
};
