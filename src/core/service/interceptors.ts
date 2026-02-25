import type { AxiosError, InternalAxiosRequestConfig } from "axios";

export const getToken = (): string => {
  try {
    const persisted = localStorage.getItem("persist:root");
    if (persisted) {
      const parsed = JSON.parse(persisted);
      const userState = JSON.parse(parsed.user || "{}");
      return userState.token || "";
    }
  } catch {}
  return "";
};

export const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

export const handleAuthError = (error: AxiosError) => {
  const status = error.response?.status;

  if (status === 401) {
    window.location.href = "/";
  }

  return Promise.reject(error);
};
