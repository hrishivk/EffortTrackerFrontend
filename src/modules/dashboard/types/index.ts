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

export type BoardColumnKey =
  | "yet_to_start"
  | "in_progress"
  | "completed"
  | "blocked";

export interface BoardColumnDef {
  /** A built-in status or a custom group's slug. */
  key: string;
  label: string;
  /** Header text, count pill and card-drop highlight colour. */
  accent: string;
  /** Low-alpha wash layered over `var(--bg-card)` so it works in both themes. */
  tint: string;
  border: string;
  countBg: string;
  countText: string;
}

/**
 * Minimum shape a Board card needs. The grouped rows in `MyTasksView` satisfy
 * this, so the Board always shows exactly what the List view is showing.
 */
export interface BoardTask {
  key: string;
  description: string;
  project: string | { id: string; name: string };
  priority: string;
  start_time?: string | null;
  end_time?: string | null;
  /** Fallback date for a task that has neither started nor finished. */
  created_at?: string | null;
  /** Set when the task sits in a group rather than a status lane. */
  group_id?: string | null;
  /** The plan — the deadline lives here, not in `end_time`. */
  start_date?: string | null;
  due_date?: string | null;
  /** Accumulated tracked time, excluding any running segment. */
  total_seconds?: number;
  /** Child tasks nested by the API. */
  subtasks?: {
    id?: string;
    description?: string;
    status?: string | null;
    priority?: string | null;
    due_date?: string | null;
  }[];
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
  /** Open one of a card's child tasks. */
  onSubtaskClick?: (task: T, subtaskId: string) => void;
  /** Saved groups, in display order, as loaded from the API. */
  groups?: TaskGroup[];
  /**
   * Persist a drag. Resolve to commit the optimistic move, reject to roll it
   * back — the board keeps the card in its new column until this settles.
   *
   * `groupId` is set for any lane backed by a saved group, which is every lane
   * normally, and is what gets sent. `statusKey` is the status that lane stands
   * for, when it has one — the caller needs it for the client-side rules (one
   * task in progress at a time) even though the backend derives the status
   * itself from the group.
   */
  onTaskMove?: (
    task: T,
    target: { groupId?: string; statusKey?: string; label: string }
  ) => Promise<void>;
  /** Create / rename / delete a group. Each resolves once the API has saved it. */
  onGroupCreate?: (data: { name: string; color: string }) => Promise<void>;
  onGroupRename?: (groupId: string, name: string) => Promise<void>;
  onGroupDelete?: (groupId: string) => Promise<void>;
  /**
   * Why this card can't be dragged, or `null` when it can. The string is shown
   * as the drag handle's tooltip, so it doubles as the explanation.
   */
  dragBlockedReason?: (task: T) => string | null;
}

/** Card size on the Board. Compact roughly halves card height. */
export type BoardDensity = "comfortable" | "compact";

/**
 * One lane on the board: a status, plus whatever the user chose to call it.
 * Lanes are added and removed through "Add group", so the board only shows the
 * statuses someone actually wants to look at.
 */
/** A board group as the API stores it. */
export interface TaskGroup {
  id: string;
  name: string;
  color: string;
  position?: number;
  /**
   * The workflow status this group drives, when it is one of the system lanes.
   * Sent by the API if it has the column; otherwise derived from `name`.
   */
  status?: string;
}

export interface BoardLane {
  /** Lane identity: a built-in status, or `group:<id>` for a saved group. */
  key: string;
  label: string;
  /** Set on a saved group: its id, and the palette to draw the lane in. */
  groupId?: string;
  accent?: string;
  /**
   * The status this lane represents, for the system lanes. A drop here sets
   * `status`; tasks with no group link are bucketed here by their status.
   */
  statusKey?: string;
  /** The API's stored order, used to sequence the custom groups. */
  position?: number;
}
