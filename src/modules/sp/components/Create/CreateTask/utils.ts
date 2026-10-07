import { parseServerTime } from "../../../../../shared/utils/serverTime";

export type ProjectOption = {
  id: string | number;
  name: string;
  status?: string;
  [key: string]: any;
};

export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const getProjectDates = (project?: ProjectOption) => ({
  start: project?.start_date || project?.startDate || project?.start || "",
  end:
    project?.end_date ||
    project?.endDate ||
    project?.dueDate ||
    project?.end ||
    "",
});

export const filterActiveProjects = (all: ProjectOption[]) => {
  const activeProjects = all.filter((p) => {
    const status = (p.status || "").toLowerCase().replace(/\s+/g, "_");
    return !status || status === "active";
  });
  return activeProjects.length > 0 ? activeProjects : all;
};

const formatDay = (date: string, withYear: boolean) =>
  new Date(date + "T00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    ...(withYear ? { year: "numeric" } : {}),
  });

export const deadlineHelperText = (
  start: string,
  end: string,
  deadline: string
) => {
  if (!end) return "";
  if (!deadline) return `Defaults to project deadline: ${formatDay(end, true)}`;
  if (start) return `Range: ${formatDay(start, false)} – ${formatDay(end, true)}`;
  return "";
};

export const formatTaskDeadline = (endTime?: string) =>
  endTime
    ? new Date(parseServerTime(endTime)).toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      })
    : "-";
