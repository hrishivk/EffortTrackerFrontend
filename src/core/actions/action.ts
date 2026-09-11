import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiserviceMethood } from "../services/apiService";
import { spserviceMethood } from "../services/spService";
import { userServiceMethood, type TaskListFilters } from "../services/userService";
import type { CreateTaskPayload } from "../../modules/user/types";

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

