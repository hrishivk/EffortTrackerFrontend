export type taskList = {
  id?: string;
  created_by?: string  | number | null;
  assigned_to?: string  | number | null ;
  project: string | { id: string; name: string };
  description: string;
  priority: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  isLocked?: boolean;
  totalTime?: string ;
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
