import type { AxiosError } from "axios";

export const handleAuthError = (error: AxiosError) => {
  return Promise.reject(error);
};
