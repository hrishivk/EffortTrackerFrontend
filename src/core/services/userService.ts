import axios from "axios";
import type { CreateWorkspacePayload, CreateTaskPayload } from "../../modules/user/types";
import { API_URL } from "../../config/apiEndpoints";
import { handleAuthError, handleResponse } from "./interceptors";
import { toStatusParam } from "../../shared/utils/taskStatus";

export type TaskListFilters = {
  assigned_to?: string;
  project?: string;
  status?: string | string[];
};

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
listTask: (url: string, date: Date | null, _id: string, _role: string, filters?: TaskListFilters, pagination?: { page?: number; limit?: number }) => {
  const status = toStatusParam(filters?.status);
  return apiservice.get(url, {
    params: {
      ...(date ? { date: date.toISOString() } : {}),
      ...(filters?.assigned_to ? { assigned_to: filters.assigned_to } : {}),
      ...(filters?.project ? { project: filters.project } : {}),
      ...(status ? { status } : {}),
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


  listTaskGroups: (url: string, assignedTo?: string) => {
    return apiservice.get(url, {
      params: { ...(assignedTo ? { assigned_to: assignedTo } : {}), _t: Date.now() },
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  },
  createTaskGroup: (url: string, data: { name: string; color: string }) => {
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

  // Leave Management
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

  // Workspaces, rooms and room members
  listWorkspaces: (url: string) => {
    return apiservice.get(url, {
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
};
