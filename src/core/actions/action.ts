import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiserviceMethood } from "../services/apiService";
import { spserviceMethood } from "../services/spService";
import { userServiceMethood, type TaskListFilters } from "../services/userService";
import type {
  CreateTaskPayload,
  TaskEditFields,
  AddSubtaskInput,
  DeleteTaskResult,
} from "../../modules/user/types";

export const login = createAsyncThunk(
  "auth/login",
  async (data: any, { rejectWithValue }) => {
    try {
      const respnse = await apiserviceMethood.login("/login", data);
      return respnse;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        return rejectWithValue("Invalid credentials");
      }
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      if (error.code === "ERR_NETWORK") {
        return rejectWithValue("Unable to reach the server. Please try again.");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);
export const adduser = async (data: any) => {
  try {
    const response = await spserviceMethood.addUser("/add-user", data);
    return response.data;
  } catch (error) {
     throw error
  }
};

export const authLogout = async (id:string) => {
  try {
    const response = await apiserviceMethood.logout(`/logout?id=${id}`);
    return response.data;
  } catch (error) {
   throw error;
  }
};

export const addTask=async(data:CreateTaskPayload)=>{
  try {
    const response= await userServiceMethood.createTask("/task",data)
    return response.data
  } catch (error) {
    throw error
  }
}
export const fetchTask = async (date: Date | null, id: string, role: string, filters?: TaskListFilters, pagination?: { page?: number; limit?: number }) => {
  try {
    const response = await userServiceMethood.listTask('/task-list', date, id, role, filters, pagination);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const setTaskLock = createAsyncThunk(
  "task/setLock",
  async ({ date, id }: { date: Date; id: string }, {rejectWithValue}) => {
    try {
      console.log("Locking with date:", date);
      const response = await userServiceMethood.taskLock(`/task-lock?id=${id}`, date);
      return response.data;
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);

export const fetchTasksByProject = async (project: string, pagination?: { page?: number; limit?: number }) => {
  try {
    const response = await userServiceMethood.listTasksByProject('/task-list', project, pagination);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
/**
 * Move a task into a board lane.
 *
 * A built-in status lane sets `status` and clears any group link; a custom group
 * sets `group_id` and leaves the status alone, so `status` stays one of the
 * values the API validates.
 *
 * Resolves to the response wrapper. `data.parent` is the whole parent card,
 * recomputed — status rolled up and every child's `is_blocked` / `blocked_by`
 * re-evaluated — or null when the row updated was top-level. Moving a child
 * out of turn rejects with a `409` whose message is written to be shown as-is.
 */
export const updateTaskLane = async (
  taskId: string,
  lane: { status?: string; groupId?: string | null }
) => {
  const payload: Record<string, unknown> = {};
  if (lane.status !== undefined) payload.status = lane.status;
  if (lane.groupId !== undefined) payload.group_id = lane.groupId;
  const response = await userServiceMethood.patchTask(`/updateTask?id=${taskId}`, payload);
  return response.data;
};

/**
 * Edit a task that already exists.
 *
 * The same `PATCH /updateTask` a lane move uses — there is no separate "edit
 * task" endpoint; it simply takes the task's own fields as well now. It works
 * on a main task or on a subtask, and `status` / `group_id` still behave
 * exactly as they do through `updateTaskLane`.
 *
 * Only the keys present on `fields` are sent, because that is the contract: an
 * absent key leaves the column alone and `null` on a date clears it. An empty
 * body is a `400` ("Nothing to update: …"), so a form with nothing changed
 * should not call this at all.
 *
 * Editing a main task resolves to the whole card with its subtasks, in the same
 * shape `/task-list` returns, so the row can be swapped in without a refetch.
 * Bad input comes back as a `400` whose message is written to be shown as-is.
 */
export const updateTask = async (taskId: string, fields: TaskEditFields) => {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    // `null` is a real instruction here (clear the date); only `undefined`
    // means "leave it alone", so it is the one thing filtered out.
    if (value !== undefined) payload[key] = value;
  }
  const response = await userServiceMethood.patchTask(
    `/updateTask?id=${encodeURIComponent(taskId)}`,
    payload
  );
  return response.data;
};

/**
 * Add one child to a task that already exists.
 *
 * Only `parent_id` and `description` are required; everything else is the
 * child's own and optional. Nothing is sent for `project_id`, `room_id`,
 * `status` or `position` — the server derives the first three from the parent,
 * and an omitted position files the subtask last, which is where a new one
 * belongs.
 *
 * Resolves with the decorated parent (`data.subtasks` holds the new child), so
 * the expanded row is redrawn whole rather than patched.
 *
 * Errors: `404` parent not found, `423` the task is locked, `400` for the rest
 * — a bad assignee, a subtask of a subtask, an unparseable date. All carry a
 * message meant for the user.
 */
export const addSubtask = async (parentId: string, input: AddSubtaskInput) => {
  const payload: Record<string, unknown> = {
    parent_id: parentId,
    description: input.description,
  };
  if (input.assigned_to) payload.assigned_to = input.assigned_to;
  if (input.priority) payload.priority = input.priority;
  if (input.start_date) payload.start_date = input.start_date;
  if (input.due_date) payload.due_date = input.due_date;
  if (input.tags?.length) payload.tags = input.tags;

  const response = await userServiceMethood.createSubtask("/task/subtask", payload);
  return response.data;
};

/**
 * Push a task's deadline out, on the record.
 *
 * Not `PATCH /updateTask { due_date }` — that one moves the date and logs
 * nothing, which is the correction path for a date typed wrong and the exact
 * bug this endpoint exists to remove. Every extension made from the UI comes
 * through here, so the history is complete.
 *
 * `reason` is required and the new date must be *after* the current one; both
 * come back as a `400` whose message is meant to be shown. Also `403` when the
 * caller is neither the assignee, the creator, an AM over them nor SP, `404`
 * for an unknown task and `423` for a locked one.
 *
 * Resolves to the decorated task — and for a subtask, to its parent with the
 * subtask nested, which is the card the board actually draws.
 */
export const extendTask = async (
  taskId: string,
  input: { due_date: string; reason: string }
) => {
  const response = await userServiceMethood.extendTask("/task/extend", {
    task_id: taskId,
    due_date: input.due_date,
    reason: input.reason.trim(),
  });
  return response.data;
};

/**
 * Delete a task, or one subtask.
 *
 * Deleting a **main task** takes every subtask with it, including ones assigned
 * to other people. Deleting a **subtask** takes only that row; its parent and
 * siblings are left alone.
 *
 * Irreversible — there is no soft delete and no undo. The time banked on the
 * rows goes too, and the reports read the same table, so this rewrites
 * somebody's past numbers. Never call it without asking first.
 *
 * Who may is narrower than who may see: SP, the creator, the assignee, an AM
 * over that person's board, and for a subtask the parent's creator. Anyone else
 * gets a `403`. Other codes: `400` no id, `404` gone already, `423` locked.
 */
export const deleteTask = async (taskId: string): Promise<DeleteTaskResult> => {
  const response = await userServiceMethood.deleteTask(
    `/task?id=${encodeURIComponent(taskId)}`
  );
  // The result is the payload itself on this route, but every other write here
  // answers inside a `{ success, message, data }` wrapper — so take whichever
  // came back rather than depending on which one it turned out to be.
  const body = response.data;
  return (body?.data ?? body) as DeleteTaskResult;
};

// ─── Task comments ────────────────────────────────────────────────
//
// `taskId` is whatever the comment is on — the main task or one subtask. Both
// are rows in `tasks`, so a subtask thread needs nothing special.
//
// There is no read here on purpose: a task's comments arrive inside
// `/task-list`, so the list reload after a write is the read.

export const addTaskComment = async (taskId: string, body: string) => {
  const response = await userServiceMethood.createTaskComment("/task-comment", {
    task_id: taskId,
    body,
  });
  return response.data;
};

export const editTaskComment = async (
  taskId: string,
  commentId: string,
  body: string
) => {
  const response = await userServiceMethood.updateTaskComment("/task-comment", {
    task_id: taskId,
    comment_id: commentId,
    body,
  });
  return response.data;
};

export const removeTaskComment = async (taskId: string, commentId: string) => {
  const response = await userServiceMethood.deleteTaskComment(
    `/task-comment?task_id=${encodeURIComponent(taskId)}&comment_id=${encodeURIComponent(commentId)}`
  );
  return response.data;
};

// ─── Board groups ─────────────────────────────────────────────────

export const fetchTaskGroups = async (assignedTo?: string) => {
  const response = await userServiceMethood.listTaskGroups("/task-groups", assignedTo);
  return response.data;
};

/**
 * Every group the caller can see, as one flat array — not scoped to a single
 * board the way `/task-groups` is.
 *
 * `/task-groups` answers "what lanes does this person's board have", which is
 * what the board needs and the wrong question for a filter: a report that can
 * cover a whole team has to offer every group any of them might be in.
 */
export const fetchAllTaskGroups = async (): Promise<{ id: string; name: string }[]> => {
  const response = await userServiceMethood.getJson("/task-groups/all");
  return response.data?.data ?? [];
};

// `assignedTo` is the board the lane is being added to, and it has to be the
// same user the groups were fetched for: without it the API scopes the new row
// to the caller, so a manager adding a lane to someone else's board gets it on
// their own instead and the reload never shows it.
export const createTaskGroup = async (
  data: { name: string; color: string },
  assignedTo?: string
) => {
  const response = await userServiceMethood.createTaskGroup("/task-groups", {
    ...data,
    ...(assignedTo ? { assigned_to: assignedTo } : {}),
  });
  return response.data;
};

export const updateTaskGroup = async (
  groupId: string,
  data: { name?: string; color?: string; position?: number }
) => {
  const response = await userServiceMethood.updateTaskGroup(
    `/task-groups?id=${groupId}`,
    data
  );
  return response.data;
};

export const deleteTaskGroup = async (groupId: string) => {
  const response = await userServiceMethood.deleteTaskGroup(`/task-groups?id=${groupId}`);
  return response.data;
};

export const updateTaskStatus=async(taskId:string, newStatus:string)=>{
  try {
    const response= await userServiceMethood.editTask(`/updateTask?id=${taskId}`,newStatus,)
    return response.data
  } catch (error) {
    throw error
  }
}

