export type TaskUser = {
  id: string;
  fullName: string;
  email?: string;
};

export type TaskComment = {
  id: string;
  user_id: string;
  user_name?: string | null;
  user?: TaskUser | null;
  body: string;
  created_at: string;
  updated_at?: string | null;
};

export type TaskExtension = {
  id: string;
  previous_due_date: string | null;
  new_due_date: string;
  reason: string;
  created_at: string;
  extended_by: string;
  extendedBy?: TaskUser | null;
};

export type SubtaskBlocker = {
  id: string;
  description: string;
  assignedUser?: TaskUser | null;
};

export type taskList = {
  id?: string;
  created_by?: string  | number | null;
  assigned_to?: string  | number | null ;
  assignedUser?: TaskUser | null;
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

  room_id?: string | null;
  position?: number;
  sequential?: boolean;
  is_blocked?: boolean;
  blocked_by?: SubtaskBlocker | null;
  comments?: TaskComment[];
  comment_count?: number;
  extensions?: TaskExtension[];
  extension_count?: number;
  subtask_count?: number;
  subtask_done_count?: number;
  parent?: taskList | null;
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
  assigned_to?: string;
  position?: number;
  priority?: string;
  start_date?: string;
  due_date?: string;
};


export type CreateTaskPayload = Omit<taskList, "subtasks"> & {
  subtasks?: SubtaskInput[];
};

export type BulkTaskItem = CreateTaskPayload & {
  row: number;
  /** YYYY-MM-DD day the task belongs to (start date, else due date, else today). */
  task_date: string;
};

export type BulkCreateTasksResult = {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
};

export type TaskEditFields = {
  description?: string;
  priority?: string;
  start_date?: string | null;
  due_date?: string | null;
  tags?: string[];
  sequential?: boolean;
};

export type DeleteTaskResult = {
  id: string;
  parent_id: string | null;
  deleted_subtask_ids: string[];
  deleted_subtasks: number;
  parent?: taskList | null;
};

export type AddSubtaskInput = {
  description: string;
  assigned_to?: string;
  priority?: string;
  start_date?: string;
  due_date?: string;
  tags?: string[];
};


export type WorkspaceStatus = "planning" | "active" | "on_hold" | "completed";

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
  description?: string | null;
  position: number;
  members: RoomMember[];
  task_count?: number;
  done_count?: number;
}
export type Workspace = {
  id: string;
  name: string;
  code: string | null;
  status: WorkspaceStatus;
  visibility?: WorkspaceVisibility;
  locked?: boolean;
  description: string | null;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string } | null;
  rooms?: WorkspaceRoom[];

  can_manage?: boolean;
  managers?: { id: string; fullName: string }[];
  isCreator?: boolean;
  can_assign_managers?: boolean;
  room_count?: number;
  member_count?: number;
  task_count?: number;
  done_count?: number;

  completed_at?: string | null;
  completed_by?: string | null;
  completedBy?: TaskUser | null;
  announced_at?: string | null;
  completion_notice?: unknown;
};
