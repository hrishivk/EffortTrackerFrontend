import axios, { type AxiosError } from "axios";
import { API_URL } from "../../config/apiEndpoints";
import store from "../../store/configureStore";
import { reset } from "../../store/authSlice";

let serverDownCallback: ((down: boolean) => void) | null = null;
let isLoggingOut = false;

export function setServerDownCallback(cb: (down: boolean) => void) {
  serverDownCallback = cb;
}

export const handleAuthError = async (error: AxiosError) => {
  if (!error.response && error.code === "ERR_NETWORK") {
    serverDownCallback?.(true);
  } else if (error.response?.status === 401 && !isLoggingOut) {
    isLoggingOut = true;
    try {
      const userId = store.getState()?.user?.user?.id;
      if (userId) {
        await axios.post(`${API_URL.apiService}/logout?id=${userId}`, null, {
          withCredentials: true,
        });
      }
    } catch {
      // silent — session already invalid
    } finally {
      store.dispatch(reset());
      isLoggingOut = false;
      window.location.href = "/login";
    }
  }
  return Promise.reject(error);
};

export const handleResponse = (res: any) => {
  serverDownCallback?.(false);
  return res;
};
