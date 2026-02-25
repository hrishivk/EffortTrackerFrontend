import type { AxiosError, InternalAxiosRequestConfig } from "axios";

export const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

export const handleAuthError = (error: AxiosError) => {
  const status = error.response?.status;

  const isLoginRequest = error.config?.url?.includes("/login");
  if (status === 401 && !isLoginRequest) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.hash = "#/";
    window.location.reload();
  }

  return Promise.reject(error);
};
