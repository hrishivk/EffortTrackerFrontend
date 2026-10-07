export const DASHBOARD_PATHS: Record<string, string> = {
  SP: "/sp/dashboard",
  AM: "/am/dashboard",
  USER: "/user/dashboard",
  DEVLOPER: "/user/dashboard",
};

export const dashboardPathFor = (role?: string | null) =>
  DASHBOARD_PATHS[role ?? ""] ?? "/";
