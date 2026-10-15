import type { SubtaskBlocker, TaskUser, taskList } from "../../user/types";
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

export type BoardColumnKey =
  | "yet_to_start"
  | "in_progress"
  | "completed"
  | "blocked";

export interface BoardColumnDef {
  key: string;
  label: string;
  accent: string;
  tint: string;
  border: string;
  countBg: string;
  countText: string;
}

export interface BoardTask {
  key: string;
  description: string;
  project: string | { id: string; name: string };
  priority: string;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string | null;
  group_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  total_seconds?: number;
  subtasks?: {
    id?: string;
    description?: string;
    status?: string | null;
    priority?: string | null;
    due_date?: string | null;
    assigned_to?: string | number | null;
    assignedUser?: TaskUser | null;
    is_blocked?: boolean;
    blocked_by?: SubtaskBlocker | null;
  }[];
  subtask_count?: number;
  subtask_done_count?: number;
  status?: string;
  assignees: { name: string; status: string; userId: string | number | null | undefined }[];
}

export interface TaskBoardViewProps<T extends BoardTask> {
  tasks: T[];
  projectColorMap: Record<string, (typeof PROJECT_COLORS)[0]>;
  loading?: boolean;
  isCompact?: boolean;
  emptyMessage?: string;
  onTaskClick?: (task: T) => void;
  onSubtaskClick?: (task: T, subtaskId: string) => void;
  groups?: TaskGroup[];
  onTaskMove?: (
    task: T,
    target: { groupId?: string; statusKey?: string; label: string }
  ) => Promise<void>;
  onGroupCreate?: (data: NewGroupData) => Promise<void>;
  onGroupRename?: (groupId: string, name: string) => Promise<void>;
  onGroupDelete?: (groupId: string) => Promise<void>;
  /** The board has no groups yet — ask how the user wants to set it up. */
  needsSetup?: boolean;
  onUseDefaultFlow?: () => Promise<void>;
  /** Every group of the board, hidden ones too: names, and tasks parked in hidden groups. */
  allGroups?: TaskGroup[];
  /** Which set the board shows; absent when there is nothing to switch to. */
  laneSwitch?: BoardLaneSwitch;
  dragBlockedReason?: (task: T) => string | null;
}

export type BoardDensity = "comfortable" | "compact";

export interface TaskGroup {
  id: string;
  name: string;
  color: string;
  position?: number;
  status?: string;
  /** Hidden from this user's board; the group and its tasks are kept. */
  hidden?: boolean;
  /** A built-in lane drawn on every board (Yet to Start, In Progress, Completed, Production). */
  shared?: boolean;
  /** The status a task takes when moved into this group; unset = it keeps its own. */
  marksStatus?: MarkableStatus;
}

export interface BoardLaneSwitch {
  mode: "default" | "groups";
  myGroupCount: number;
  defaultLaneCount: number;
  onShowMyGroups: () => Promise<void>;
  onShowDefaultLanes: () => Promise<void>;
}

export type MarkableStatus = "in_progress" | "completed";

export interface NewGroupData {
  name: string;
  color: string;
  marks_status?: MarkableStatus | null;
}

export interface BoardLane {
  key: string;
  label: string;
  groupId?: string;
  accent?: string;
  statusKey?: string;
  position?: number;
  marksStatus?: MarkableStatus;
}
