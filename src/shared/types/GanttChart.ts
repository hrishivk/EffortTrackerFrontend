export type ProjectStatus = "ON TRACK" | "COMPLETED" | "DELAYED";
export type ViewMode = "Week" | "Month" | "Year";

export interface GanttBar {
  startDay: number;
  endDay: number;
  label: string;
  progress: number;
  type: "active" | "completed" | "delayed" | "green";
  overdueDays?: number;
  hasFlag?: boolean;
}

export interface GanttProject {
  id: number | string;
  name: string;
  status: ProjectStatus;
  bars: GanttBar[];
}

export interface GanttChartProps {
  projects: {
    id: number | string;
    name: string;
    start_date?: string;
    end_date?: string;
    status: string;
    progress: number;
  }[];
  onProjectClick?: (projectName: string, projectId: string | number) => void;
}
