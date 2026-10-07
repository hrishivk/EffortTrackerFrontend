import type { taskList } from "../../../user/types";
import type { SubtaskAssignee, SubtaskDraft } from "../CreateTaskModal";

export interface MyTasksViewProps {
  viewUserId?: string;
  viewUserName?: string;
  viewProject?: string;
  viewTab?: string;
  lockedProject?: string;
  roomId?: string;
  roomMembers?: SubtaskAssignee[];
  focusTaskId?: string;
}

export type ViewMode = "list" | "board" | "gantt";

export type PanelTab = "details" | "subtasks" | "activity";

export type UserId = string | number | null | undefined;

export type ProjectColor = { bg: string; text: string; dot: string };

export type GroupedTask = {
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
  subtasks?: taskList[];
  subtask_count?: number;
  subtask_done_count?: number;
  extension_count?: number;
  status?: string;
  tasks: taskList[];
  assignees: { name: string; status: string; userId: string | number | null | undefined }[];
};

export type CreateForm = {
  taskName: string;
  project: string;
  assignees: string[];
  priority: string;
  startDate: string;
  dueDate: string;
  sequential: boolean;
  subtasks: SubtaskDraft[];
};
