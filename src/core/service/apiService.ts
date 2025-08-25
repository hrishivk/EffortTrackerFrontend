import axios from "axios";
import type { taskList } from "../../modules/user/types";
import type { UserData } from "../types";
import { API_URL } from "../../config/apiEndpoints";


const apiservice = axios.create({
  baseURL: API_URL.apiService,
  withCredentials: true, 
});
export const apiserviceMethood = {
  login: (url: string, data: { [key: string]: string | number }) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  createTask: (url: string, data:taskList) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },

  createUser: (url: string, data: UserData) => {
    return apiservice.post(url, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  logout: (url: string) => {
    return apiservice.post(url); 
  },
};
