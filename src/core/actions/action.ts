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

// ─── Board groups ─────────────────────────────────────────────────

export const fetchTaskGroups = async (assignedTo?: string) => {
  const response = await userServiceMethood.listTaskGroups("/task-groups", assignedTo);
  return response.data;
};

export const createTaskGroup = async (data: { name: string; color: string }) => {
  const response = await userServiceMethood.createTaskGroup("/task-groups", data);
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

