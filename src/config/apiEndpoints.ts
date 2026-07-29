
const DEV_FALLBACK = "http://localhost:7001";
const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
if (!configuredBase && import.meta.env.PROD) {
  console.error(
    "[config] VITE_API_BASE_URL is not set. This build will call " +
      `${DEV_FALLBACK}, which will not resolve in production.`,
  );
}

export const API_BASE_URL = (configuredBase || DEV_FALLBACK).replace(/\/+$/, "");

export const API_URL = {
  amService: `${API_BASE_URL}/role-am`,
  spService: `${API_BASE_URL}/role-sp`,
  apiService: `${API_BASE_URL}/auth`,
  userService: `${API_BASE_URL}/role-user`,
};
