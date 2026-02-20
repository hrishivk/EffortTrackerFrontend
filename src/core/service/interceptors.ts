import type { AxiosError } from "axios";

export const handleAuthError = (error: AxiosError) => {
  const status = error.response?.status;

  if (status === 401) {
    window.location.href = "/";
  }

 
  return Promise.reject(error);
};
