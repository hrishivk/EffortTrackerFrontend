import type { taskList } from "../../user/types";
import type { formUserData } from "../../../shared/types/User";
import type { PROJECT_COLORS } from "../components/ganttConstants";

export  interface RoleTitles {
  [key: string]: string;
}


export interface SpTeamPerformanceProps {
  page: number;
  setPage: (page: number) => void;
}
 export interface StaCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
}

export interface TaskStatusDistributionProps {
  completed: number;
  inProgress: number;
  yetToStart: number;
  totalTasks: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
}
export interface LegendItemProps {
  color: string;
  label: string;
  value: number;
  total: number;
}
export interface TeamPerformanceRow {
  id: number
  fullName: string
  avatar?: any
  projects: { name: string }[]
  yetToStart: number
  inProgress: number
  completed: number
  totalHours: number
  efficiency: number
  status: "Active" | "Inactive"
}

export type TaskBarStatus = "completed" | "in_progress" | "overdue" | "pending";

export interface DayInfo {
  date: Date;
  day: number;
  month: number;
  year: number;
  dow: number;
  isWeekend: boolean;
  isToday: boolean;
  isFirstOfMonth: boolean;
  label: string;
  dowLabel: string;
  monthYear: string;
}

export interface GroupedTaskRow {
  description: string;
  projectName: string;
  projectColor: (typeof PROJECT_COLORS)[0];
  tasks: taskList[];
  assignees: { name: string; status: TaskBarStatus; userId: string | number | null | undefined }[];
  startIdx: number;
  endIdx: number;
  statusCounts: Record<TaskBarStatus, number>;
  overallStatus: TaskBarStatus;
  progress: number;
  earliestStart: string | null;
  latestEnd: string | null;
}

export interface TaskGanttChartProps {
  tasks: taskList[];
  users: formUserData[];
  projects: any[];
  projectColorMap: Record<string, (typeof PROJECT_COLORS)[0]>;
  getUserName: (id: string | number | null | undefined) => string;
  loading?: boolean;
  onTaskClick?: (task: taskList) => void;
  hideLeftPanel?: boolean;
}
