export type ProjectStatus = "ON TRACK" | "COMPLETED" | "DELAYED";
export type ViewMode = "Day" | "Week" | "Month";


export interface GanttProject {
  name: string;
  status: ProjectStatus;
  bars: {
    startDay: number;
    endDay: number;
    label: string;
    progress: number;
    type: "active" | "completed" | "delayed" | "green";
    overdueDays?: number;
    hasFlag?: boolean;
  }[];
}

