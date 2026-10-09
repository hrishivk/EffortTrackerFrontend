import axios from "axios";
import type { CreateWorkspacePayload, CreateTaskPayload, BulkTaskItem } from "../../modules/user/types";
import { API_URL } from "../../config/apiEndpoints";
import { handleAuthError, handleResponse } from "./interceptors";
import { toStatusParam } from "../../shared/utils/taskStatus";

export type TaskListFilters = {
  assigned_to?: string;
  project?: string;
  status?: string | string[];
  min_extensions?: number;
  room_id?: string;
};

// The list is asked for a calendar day, but sent as an ISO (UTC) timestamp. Local
// midnight (what the date picker yields) lands on the previous UTC day east of
// Greenwich, e.g. 2 Sep 00:00 IST -> 1 Sep 18:30Z. Local noon keeps the same day.
const dayParam = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).toISOString();

const apiservice = axios.create({
  baseURL: API_URL.userService,
  withCredentials: true,
});

apiservice.interceptors.response.use(handleResponse, handleAuthError);

apiservice.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === "get") {
    config.params = { ...(config.params || {}), _t: Date.now() };
  }
  return config;
});

export const userServiceMethood = {

  createTask: (url: string, data: CreateTaskPayload) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  bulkCreateTasks: (url: string, tasks: BulkTaskItem[]) => {
    return apiservice.post(url, { tasks }, {
      headers: { "Content-Type": "application/json" },
    });
  },
listTask: (url: string, date: Date | null, _id: string, _role: string, filters?: TaskListFilters, pagination?: { page?: number; limit?: number }) => {
  const status = toStatusParam(filters?.status);
  return apiservice.get(url, {
    params: {
      ...(date ? { date: dayParam(date) } : {}),
      ...(filters?.assigned_to ? { assigned_to: filters.assigned_to } : {}),
      ...(filters?.project ? { project: filters.project } : {}),
      ...(status ? { status } : {}),
      ...(filters?.min_extensions ? { min_extensions: filters.min_extensions } : {}),
      ...(filters?.room_id ? { room_id: filters.room_id } : {}),
      ...(pagination?.page ? { page: pagination.page } : {}),
      ...(pagination?.limit ? { limit: pagination.limit } : {}),
      _t: Date.now(),
    },
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
  });
},

 taskLock: (url: string, date: Date) => {
  console.log("date", date);
  return apiservice.patch(url, {}, {
    params: { date: date.toISOString() },
    headers: { "Content-Type": "application/json" },
  });
}
,
 editTask: (url: string, newStatus: string) => {
    return apiservice.patch(url,{ status: newStatus },{
      headers: { "Content-Type": "application/json" },
    });
  },
  patchTask: (url: string, data: Record<string, unknown>) => {
    return apiservice.patch(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },

  extendTask: (url: string, data: { task_id: string; due_date: string; reason: string }) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },

  deleteTask: (url: string) => {
    return apiservice.delete(url, {
      headers: { "Content-Type": "application/json" },
    });
  },

  createSubtask: (url: string, data: Record<string, unknown>) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },


  createTaskComment: (url: string, data: { task_id: string; body: string }) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  updateTaskComment: (
    url: string,
    data: { task_id: string; comment_id: string; body: string }
  ) => {
    return apiservice.patch(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  deleteTaskComment: (url: string) => {
    return apiservice.delete(url, {
      headers: { "Content-Type": "application/json" },
    });
  },

  listTaskGroups: (url: string, assignedTo?: string) => {
    return apiservice.get(url, {
      params: { ...(assignedTo ? { assigned_to: assignedTo } : {}), _t: Date.now() },
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  },
  createTaskGroup: (
    url: string,
    data: { name: string; color: string; assigned_to?: string }
  ) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  updateTaskGroup: (
    url: string,
    data: { name?: string; color?: string; position?: number }
  ) => {
    return apiservice.patch(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  deleteTaskGroup: (url: string) => {
    return apiservice.delete(url, {
      headers: { "Content-Type": "application/json" },
    });
  },
  listTasksByProject: (url: string, project: string, pagination?: { page?: number; limit?: number }) => {
    return apiservice.get(url, {
      params: {
        project,
        ...(pagination?.page ? { page: pagination.page } : {}),
        ...(pagination?.limit ? { limit: pagination.limit } : {}),
      },
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  },
  listProjects: (url: string, pagination?: { page?: number; limit?: number }) => {
    return apiservice.get(url, {
      params: {
        ...(pagination?.page ? { page: pagination.page } : {}),
        ...(pagination?.limit ? { limit: pagination.limit } : {}),
      },
      headers: { "Content-Type": "application/json" },
    });
  },

  applyLeave: (url: string, data: any) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  getLeaves: (url: string, params?: Record<string, any>) => {
    return apiservice.get(url, {
      params: { ...params, _t: Date.now() },
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  },
  leaveAction: (url: string, data: any) => {
    return apiservice.patch(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },

  listNotifyTargets: (url: string) => {
    return apiservice.get(url, {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  },

  notifyWorkspaceCompleted: (
    url: string,
    data: { workspace_id: string; user_ids: string[] }
  ) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },

  assignWorkspaceManagers: (url: string, data: { id: string; user_ids: string[] }) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  removeWorkspaceManager: (url: string, data: { id: string; user_id: string }) => {
    return apiservice.delete(url, {
      data,
      headers: { "Content-Type": "application/json" },
    });
  },

  listWorkspaces: (url: string, pagination?: { page?: number; limit?: number }) => {
    return apiservice.get(url, {
      params: {
        ...(pagination?.page ? { page: pagination.page } : {}),
        ...(pagination?.limit ? { limit: pagination.limit } : {}),
      },
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  },
  createWorkspace: (url: string, data: CreateWorkspacePayload) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  patchWorkspace: (url: string, data: Record<string, unknown>) => {
    return apiservice.patch(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  deleteWorkspace: (url: string) => {
    return apiservice.delete(url, {
      headers: { "Content-Type": "application/json" },
    });
  },
  joinWorkspace: (url: string, data: { key: string; room_id?: string }) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  createRoom: (url: string, data: { workspace_id: string; name: string; position?: number }) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  patchRoom: (url: string, data: { name?: string; position?: number }) => {
    return apiservice.patch(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  deleteRoom: (url: string) => {
    return apiservice.delete(url, {
      headers: { "Content-Type": "application/json" },
    });
  },
  addRoomMember: (url: string, data: { room_id: string; user_id: string }) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  removeRoomMember: (url: string) => {
    return apiservice.delete(url, {
      headers: { "Content-Type": "application/json" },
    });
  },
  getJson: (url: string, params?: Record<string, unknown>) => {
    return apiservice.get(url, {
      params,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  },
};
