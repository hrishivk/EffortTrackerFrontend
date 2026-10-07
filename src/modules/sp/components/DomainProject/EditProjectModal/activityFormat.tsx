import {
  FiActivity,
  FiCalendar,
  FiEdit2,
  FiFlag,
  FiPlusCircle,
  FiUserMinus,
  FiUserPlus,
} from "react-icons/fi";

import type { ProjectActivityEntry } from "../../../../../core/types";
import { showDay } from "./dateUtils";

const dayHeading = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" });
};

export const byDay = (entries: ProjectActivityEntry[]) => {
  const days: { key: string; heading: string; entries: ProjectActivityEntry[] }[] = [];
  for (const e of entries) {
    const d = new Date(e.created_at);
    const key = Number.isNaN(d.getTime())
      ? "unknown"
      : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = days[days.length - 1];
    if (last && last.key === key) last.entries.push(e);
    else days.push({ key, heading: dayHeading(e.created_at), entries: [e] });
  }
  return days;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  on_hold: "On hold",
  paused: "Paused",
  completed: "Completed",
};
const showStatus = (value?: string | null) =>
  value ? STATUS_LABEL[value] ?? value : "none";

const FIELD_LABEL: Record<string, string> = {
  description: "Description",
  domain_id: "Department",
  client_department: "Category",
  start_date: "Start date",
};

type Tone = "violet" | "amber" | "green" | "red" | "grey";

export const describe = (
  e: ProjectActivityEntry,
): { title: string; from?: string; to?: string; icon: React.ReactNode; tone: Tone } => {
  switch (e.action) {
    case "created":
      return { title: `Created “${e.new_value ?? "the project"}”`, icon: <FiPlusCircle size={12} />, tone: "green" };
    case "extended":
      return e.old_value
        ? {
            title: "Extended the due date",
            from: showDay(e.old_value),
            to: showDay(e.new_value),
            icon: <FiCalendar size={12} />,
            tone: "amber",
          }
        : { title: "Set the due date", to: showDay(e.new_value), icon: <FiCalendar size={12} />, tone: "amber" };
    case "due_date_changed":
      return {
        title: "Brought the due date forward",
        from: showDay(e.old_value),
        to: showDay(e.new_value),
        icon: <FiCalendar size={12} />,
        tone: "violet",
      };
    case "status_changed":
      return {
        title: "Changed the status",
        from: showStatus(e.old_value),
        to: showStatus(e.new_value),
        icon: <FiFlag size={12} />,
        tone: "violet",
      };
    case "renamed":
      return {
        title: "Renamed the project",
        from: e.old_value ?? "",
        to: e.new_value ?? "",
        icon: <FiEdit2 size={12} />,
        tone: "violet",
      };
    case "member_added":
      return { title: `Added ${e.new_value ?? "someone"} to the team`, icon: <FiUserPlus size={12} />, tone: "green" };
    case "member_removed":
      return { title: `Removed ${e.old_value ?? "someone"} from the team`, icon: <FiUserMinus size={12} />, tone: "red" };
    case "updated": {
      if (e.field === "domain_id") {
        return { title: "Moved to another department", icon: <FiEdit2 size={12} />, tone: "grey" };
      }
      const label = FIELD_LABEL[e.field ?? ""] ?? e.field ?? "a field";
      const fmt = e.field === "start_date" ? showDay : (v?: string | null) => v || "none";
      return {
        title: `Changed the ${label.toLowerCase()}`,
        from: fmt(e.old_value),
        to: fmt(e.new_value),
        icon: <FiEdit2 size={12} />,
        tone: "grey",
      };
    }
    default:
      return { title: "Updated the project", icon: <FiActivity size={12} />, tone: "grey" };
  }
};
