export type taskList = {
  id?: number | string | undefined;
  created_by?: string | number | null | undefined;
  assigned_to?: string | number | null | undefined;
  project: string | { id: string; name: string };
  description: string;
  priority: string;
  status?: string;
  start_time?: string | null;
  end_time?: string | null;
  isLocked?: boolean;
  totalTime?: string | null;
  created_at?: string;
  progress?: number;
  daily_log_id?: string;
  project_id?: string;
  updated_at?: string;
  dailyLog?: {
    id: string;
    created_by: string;
    assigned_to: string;
    assignedUser: {
      id: string;
      fullName: string;
      email: string;
    };
    creator: {
      id: string;
      fullName: string;
      email: string;
    };
  };
};
