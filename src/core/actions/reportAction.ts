import { amServiceMethood } from "../services/amService";
import { spserviceMethood } from "../services/spService";
import { userServiceMethood } from "../services/userService";


export interface ReportRange {
  from: string;
  to: string;
}

export interface ReportTotals {
  tasks_worked: number;
  completed: number;
  in_progress: number;
  pending: number;
  completion_rate: number;
  total_seconds: number;
  avg_seconds_per_task: number;
  active_rate: number;
  today_seconds: number;
}

export interface ReportPrevious {
  tasks_worked: number;
  completed: number;
  total_seconds: number;
}

export interface ReportDay {
  date: string;
  tasks_worked: number;
  completed: number;
  total_seconds: number;
  productivity: number;
}

export interface ReportPerson {
  id: string;
  fullName: string;
  email?: string;
}

export interface ReportTask {
  id: string;
  description: string;
  project: string | null;
  status: string | null;
  start_time?: string | null;
  end_time?: string | null;
  start_date: string | null;
  completed_at: string | null;
  due_date: string | null;
}

export interface UserReport {
  user: ReportPerson;
  range: ReportRange;
  totals: ReportTotals;
  previous: ReportPrevious;
  daily: ReportDay[];
  tasks?: ReportTask[];
  tasks_truncated?: boolean;
}

export interface TeamMemberRow {
  user: ReportPerson;
  tasks_worked: number;
  completed: number;
  in_progress: number;
  pending: number;
  completion_rate: number;
  total_seconds: number;
}

export interface TeamReport {
  range: ReportRange;
  member_count: number;
  totals: ReportTotals;
  previous: ReportPrevious;
  daily: ReportDay[];
  members: TeamMemberRow[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

type Params = Record<string, unknown>;

const clean = (params: Params): Params =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );

const service = (role?: string) => {
  const r = String(role ?? "").toUpperCase();
  if (r === "SP") return spserviceMethood;
  if (r === "AM") return amServiceMethood;
  return userServiceMethood;
};

export const fetchUserReport = async (
  role: string | undefined,
  params: {
    user_id?: string;
    from: string;
    to: string;
    project_id?: string;
    group_id?: string;
    include?: string;
  }
): Promise<UserReport> => {
  const res = await service(role).getJson("/reports/user", clean(params));
  return res.data.data;
};

export const fetchTeamReport = async (
  role: string | undefined,
  params: {
    from: string;
    to: string;
    project_id?: string;
    department_id?: string;
    group_id?: string;
    page?: number;
    limit?: number;
  }
): Promise<TeamReport> => {
  const res = await service(role).getJson("/reports/team", clean(params));
  return res.data.data;
};
