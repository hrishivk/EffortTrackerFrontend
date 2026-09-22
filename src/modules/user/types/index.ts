/** A person as every task payload now carries them, flat and on `dailyLog`. */
export type TaskUser = {
  id: string;
  fullName: string;
  email?: string;
};

/**
 * One comment on a task or a subtask. Both are rows in `tasks`, so a subtask
 * thread is the same shape read off the subtask itself.
 *
 * `user` is resolved live on read, so a rename shows through; it is null for a
 * deleted account, and `user_name` is the snapshot taken when the comment was
 * written. Render `user.fullName` and fall back to `user_name`.
 */
export type TaskComment = {
  id: string;
  user_id: string;
  user_name?: string | null;
  user?: TaskUser | null;
  body: string;
  created_at: string;
  /** Null until edited — non-null is what marks a comment "edited". */
  updated_at?: string | null;
};

/**
 * What a blocked subtask is waiting on: always the *earliest* thing still
 * outstanding, not the one immediately before it.
 */
export type SubtaskBlocker = {
  id: string;
  description: string;
  assignedUser?: TaskUser | null;
};

export type taskList = {
  id?: string;
  created_by?: string  | number | null;
  assigned_to?: string  | number | null ;
  /** The assignee, sent flat on every task and subtask. */
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

  // ─── Room shared tasks ────────────────────────────────────────────
  /** The room this task belongs to. What makes it readable by the room. */
  room_id?: string | null;
  /** A child's order inside its parent. Meaningless without a `parent_id`. */
  position?: number;
  /** On the parent: its children run strictly in `position` order. */
  sequential?: boolean;
  /**
   * Computed by the API, not stored: this child cannot be started yet. Already
   * false for anything in progress or completed, so it answers exactly "can
   * Start be pressed".
   */
  is_blocked?: boolean;
  blocked_by?: SubtaskBlocker | null;
  /** The newest 50, oldest first. `comment_count` is the true total. */
  comments?: TaskComment[];
  comment_count?: number;
  /** The tally the API keeps, so nobody counts `subtasks[]` by hand. */
  subtask_count?: number;
  subtask_done_count?: number;
  /**
   * The recomputed parent, returned by `PATCH /updateTask` after a child moves.
   * Null when the row updated was top-level.
   */
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
  /**
   * The room member this child belongs to. Omitted, it inherits the parent's
   * assignee — which is the old single-owner behaviour.
   */
  assigned_to?: string;
  /**
   * 1-based order. Two children on the same number are peers and do not block
   * each other, so these are always sent distinct.
   */
  position?: number;
  priority?: string;
  start_date?: string;
  due_date?: string;
};


export type CreateTaskPayload = Omit<taskList, "subtasks"> & {
  subtasks?: SubtaskInput[];
};

/**
 * What `PATCH /updateTask` will change on a task that already exists. Works on
 * a main task or on one of its subtasks.
 *
 * Only the keys actually edited are sent, and the distinction matters: an
 * absent key leaves the column alone, while `null` on a date *clears* it. So an
 * edit form has to tell "not touched" from "emptied", which is why the dates
 * are `string | null | undefined` rather than just `string`.
 *
 * `sequential` orders a parent's children, so the API only takes it on a main
 * task. `assigned_to` is not editable through this yet — reassigning is still
 * out of reach from the edit form.
 */
export type TaskEditFields = {
  /** The task's name. Cannot be blank. */
  description?: string;
  /** Low / Medium / High — the API does not care about the case. */
  priority?: string;
  start_date?: string | null;
  due_date?: string | null;
  tags?: string[];
  sequential?: boolean;
};

/**
 * What came back from `DELETE /task?id=`.
 *
 * Deleting a main task takes its subtasks with it — including ones assigned to
 * other people — so the count is worth reporting rather than swallowing.
 */
export type DeleteTaskResult = {
  id: string;
  parent_id: string | null;
  /** Gone along with it. `[]` when a subtask was deleted. */
  deleted_subtask_ids: string[];
  deleted_subtasks: number;
  /**
   * The recomputed parent, when a subtask was deleted — its siblings'
   * `is_blocked` / `blocked_by` shift when one disappears. Null for a main task.
   */
  parent?: taskList | null;
};

/**
 * A child added to a task that already exists, via `POST /task/subtask`.
 *
 * `project_id`, `room_id` and `status` are deliberately absent: the server
 * takes all three from the parent and ignores anything sent for them. So is
 * `position` — left out, the new child goes last, which is where a just-added
 * one belongs; sending it wrong files the subtask above the existing ones.
 */
export type AddSubtaskInput = {
  description: string;
  /** A room member. Omitted, the child inherits the parent's assignee. */
  assigned_to?: string;
  priority?: string;
  start_date?: string;
  due_date?: string;
  tags?: string[];
};


/**
 * Where a workspace is in its life.
 *
 * `completed` is the end of it — the work is finished. Unlike `planning` and
 * `on_hold`, which close a workspace because it is not ready or not running, a
 * completed one stays **open to its members**: the record of what was done is
 * the point of finishing it.
 */
export type WorkspaceStatus = "planning" | "active" | "on_hold" | "completed";

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

/**
 * A room inside a workspace.
 *
 * `GET /workspaces` now nests these, but lightly: a room from the **list** has
 * its name, its position and its two tallies and nothing else — `workspace_id`,
 * `project_id` and `members` are filled only by the single-workspace read
 * (`?id=`). Read members off a workspace you fetched by id, never off one that
 * came out of the list.
 */
export type WorkspaceRoom = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  name: string;
  description?: string | null;
  position: number;
  members: RoomMember[];
  /** Work filed in this room, and how much of it is finished. */
  task_count?: number;
  done_count?: number;
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

  // ─── Tallies and flags the list carries ───────────────────────────
  /**
   * Whether this caller may manage this workspace — rename it, add rooms, move
   * people. Answered per row by the server, which is the only thing that knows;
   * the local `canManageWorkspace` guess (SP, or the creator) predates it.
   */
  can_manage?: boolean;
  room_count?: number;
  /** Distinct people across all of its rooms, not the sum of the rooms. */
  member_count?: number;
  /** Every task in the workspace, and how many are finished. */
  task_count?: number;
  done_count?: number;

  // ─── Finishing ────────────────────────────────────────────────────
  completed_at?: string | null;
  completed_by?: string | null;
  completedBy?: TaskUser | null;
  /** When its managers were told it was finished. Null until announced. */
  announced_at?: string | null;
  /** The announcement itself, when there is one. Shape not relied on here. */
  completion_notice?: unknown;
};
