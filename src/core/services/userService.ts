import axios from "axios";
import type { taskList } from "../../modules/user/types";
import { API_URL } from "../../config/apiEndpoints";
import { handleAuthError } from "./interceptors";

const apiservice = axios.create({
  baseURL: API_URL.userService,
  withCredentials: true,
});

apiservice.interceptors.response.use((res) => res, handleAuthError);
export const userServiceMethood = {

  createTask: (url: string, data:taskList) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
listTask: (url: string, date: Date, id: string, role: string, filters?: { assigned_to?: string; project?: string }, pagination?: { page?: number; limit?: number }) => {
  return apiservice.get(url, {
    params: {
      date: date.toISOString(),
      id: id,
      role: role,
      ...(filters?.assigned_to ? { assigned_to: filters.assigned_to } : {}),
      ...(filters?.project ? { project: filters.project } : {}),
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
  listProjects: (url: string, pagination?: { page?: number; limit?: number }) => {
    return apiservice.get(url, {
      params: {
        ...(pagination?.page ? { page: pagination.page } : {}),
        ...(pagination?.limit ? { limit: pagination.limit } : {}),
      },
      headers: { "Content-Type": "application/json" },
    });
  },
};
