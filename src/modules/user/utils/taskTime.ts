import type { ZodError } from "zod";
import { parseServerTime } from "../../../shared/utils/serverTime";

export const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const formatTime = (value: string | undefined, fallback: string) =>
  value
    ? new Date(parseServerTime(value)).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : fallback;

export const formatDuration = (start?: string, end?: string) => {
  if (!start || !end) return "";
  const diffMs = parseServerTime(end) - parseServerTime(start);
  if (isNaN(diffMs) || diffMs < 0) return "Invalid Time";
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const s = Math.floor((diffMs % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
};

export const collectZodErrors = (error: ZodError) => {
  const errorMessage: { [key: string]: string } = {};
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      errorMessage[err.path[0] as string] = err.message;
    }
  });
  return errorMessage;
};

export const projectName = (project: string | { id: string; name: string }) =>
  typeof project === "string" ? project : project?.name ?? "";
