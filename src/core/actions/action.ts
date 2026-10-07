import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiserviceMethood } from "../services/apiService";
import { spserviceMethood } from "../services/spService";
import { userServiceMethood, type TaskListFilters } from "../services/userService";
import type {
  CreateTaskPayload,
  BulkTaskItem,
  BulkCreateTasksResult,
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
export const bulkCreateTasks = async (tasks: BulkTaskItem[]): Promise<BulkCreateTasksResult> => {
  try {
    const response = await userServiceMethood.bulkCreateTasks("/task/bulk", tasks)
    const data = response.data?.data ?? response.data ?? {}
    return {
      created: Number(data.created ?? tasks.length),
      failed: Number(data.failed ?? 0),
      errors: Array.isArray(data.errors) ? data.errors : [],
    }
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

export const updateTask = async (taskId: string, fields: TaskEditFields) => {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) payload[key] = value;
  }
  const response = await userServiceMethood.patchTask(
    `/updateTask?id=${encodeURIComponent(taskId)}`,
    payload
  );
  return response.data;
};

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

export const deleteTask = async (taskId: string): Promise<DeleteTaskResult> => {
  const response = await userServiceMethood.deleteTask(
    `/task?id=${encodeURIComponent(taskId)}`
  );
  const body = response.data;
  return (body?.data ?? body) as DeleteTaskResult;
};


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


export const fetchTaskGroups = async (assignedTo?: string) => {
  const response = await userServiceMethood.listTaskGroups("/task-groups", assignedTo);
  return response.data;
};

export const fetchAllTaskGroups = async (): Promise<{ id: string; name: string }[]> => {
  const response = await userServiceMethood.getJson("/task-groups/all");
  return response.data?.data ?? [];
};

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

