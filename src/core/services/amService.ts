import axios from "axios";
import { API_URL } from "../../config/apiEndpoints";
import { handleAuthError, handleResponse } from "./interceptors";

const apiservice = axios.create({
  baseURL: API_URL.amService,
  headers: {
    "Content-Type":"application/json"
  }, withCredentials: true,
});

apiservice.interceptors.response.use(handleResponse, handleAuthError);

// Bust browser cache on every GET so screens reflect the latest data after mutations
apiservice.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === "get") {
    config.params = { ...(config.params || {}), _t: Date.now() };
  }
  return config;
});

export const amServiceMethood = {
    listAllUsers:(url:string)=>{return apiservice.get(url)},
    getProject:(url:string)=>{
      return apiservice.get(url, {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      });
    },
    listAllDomain:(url:string, pagination?: { page?: number; limit?: number })=>{
      return apiservice.get(url, {
        params: {
          ...(pagination?.page ? { page: pagination.page } : {}),
          ...(pagination?.limit ? { limit: pagination.limit } : {}),
        },
      });
    },
    addDomain:(url:string,data:{[key:string]:string|number|string[]|undefined})=>{return apiservice.post(url,data)},
    deleteDomain:(url:string)=>{return apiservice.delete(url)},
    getJson: (url: string, params?: Record<string, any>) => {
      return apiservice.get(url, {
        params: { ...params, _t: Date.now() },
        headers: { "Cache-Control": "no-cache" },
      });
    },
    getBlob: (url: string, params?: Record<string, any>) => {
      return apiservice.get(url, {
        params,
        responseType: "blob",
      });
    },
};
