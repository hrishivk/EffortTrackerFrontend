import axios from "axios";
import type { UserData } from "../types";
import { API_URL } from "../../config/apiEndpoints";
import { handleAuthError } from "./interceptors";

const apiService = axios.create({
  baseURL: API_URL.apiService,
  withCredentials: true,
});
const spService = axios.create({
  baseURL: API_URL.spService,
  withCredentials: true,
});

apiService.interceptors.response.use((res) => res, handleAuthError);
spService.interceptors.response.use((res) => res, handleAuthError);
export const apiserviceMethood = {
  login: (url: string, data: { [key: string]: string | number }) => {
    return apiService.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
  createUser: (url: string, data: UserData) => {
    return spService.post(url, data, {
      headers: { "Content-Type": "application/json" },
    });
  },

  logout: (url: string) => {
    return apiService.post(url);
  },
};
