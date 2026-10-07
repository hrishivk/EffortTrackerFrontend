import type { StatusChoice } from "../../types";

export const ROOMS_PER_ROW = 4;

export const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

export const STATUS_CHOICES: StatusChoice[] = [
  { value: "planning", label: "Planning", note: "Members cannot open it yet" },
  { value: "active", label: "Active", note: "Open to everyone in its rooms" },
  { value: "on_hold", label: "On Hold", note: "Closed to members for now" },
  {
    value: "completed",
    label: "Completed",
    note: "Finished — still open to read",
  },
];
