import axios, { type AxiosError } from "axios";
import { API_URL } from "../../config/apiEndpoints";
import store from "../../store/configureStore";
import { reset } from "../../store/authSlice";

let isLoggingOut = false;

// A 401 from these endpoints means "bad credentials", not "session expired",
// so it must not trigger the logout + redirect flow — the caller shows the error.
const AUTH_ENDPOINTS = ["/login", "/logout"];

const isAuthEndpoint = (url?: string) =>
  !!url && AUTH_ENDPOINTS.some((path) => url.startsWith(path));

export const handleAuthError = async (error: AxiosError) => {
  if (
    error.response?.status === 401 &&
    !isLoggingOut &&
    !isAuthEndpoint(error.config?.url)
  ) {
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
      // HashRouter: the login route is the empty hash, not a "/login" path.
      window.location.href = "/#/";
    }
  }
  return Promise.reject(error);
};

export const handleResponse = (res: any) => res;
