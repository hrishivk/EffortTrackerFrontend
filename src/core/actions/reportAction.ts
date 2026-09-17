import { amServiceMethood } from "../services/amService";
import { spserviceMethood } from "../services/spService";
import { userServiceMethood } from "../services/userService";

/**
 * Task reports.
 *
 * The same two routes exist under three prefixes, and which one a caller may
 * use is the whole scoping rule: `/role-sp` sees everyone, `/role-am` sees only
 * that manager's team, `/role-user` sees only the caller. The server enforces
 * it and answers `403` for anything outside — so the role is chosen here from
 * the signed-in user and never from a query param.
 */

export interface ReportRange {
  from: string;
  to: string;
}

/** Every figure the report shows. Seconds, not formatted strings. */
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

/** The same-length window immediately before this one. */
export interface ReportPrevious {
  tasks_worked: number;
  completed: number;
  total_seconds: number;
}

/** One row per day in the range, including the days with nothing on them. */
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

/**
 * One task row, for the workbook's Tasks sheet. Not shown on the page.
 *
 * `project` and `status` arrive as display names, not ids — a spreadsheet has
 * nothing to resolve an id against. Dates are `yyyy-mm-dd`, or null where the
 * task has not reached that point.
 */
export interface ReportTask {
  id: string;
  description: string;
  project: string | null;
  status: string | null;
  /**
   * The clock, not the plan.
   *
   * `start_date` is the manager-set planned date and is NULL on every task —
   * nothing writes it — so these two are what the List View actually shows and
   * what the export reads. Full ISO timestamps; null before the task starts or
   * while it is still running.
   */
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
  /** Only when the request asked for them; absent otherwise. */
  tasks?: ReportTask[];
  /** True when the API capped `tasks` and there were more rows behind it. */
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

/** Drops the keys the caller left empty, so no blank param reaches the API. */
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
    /**
     * A board group from `/task-groups/all`. Dropped by `clean()` when nothing
     * is picked, so the default request is byte-for-byte what it was before the
     * filter existed — the routes do not document `group_id` yet.
     */
    group_id?: string;
    /**
     * `"tasks"` asks for the rows behind the figures. Only the Excel export
     * wants them, and on a long window they outweigh everything else in the
     * response, so the page never sends this — the export does, on the click.
     */
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
    /** See the note on `fetchUserReport`. */
    group_id?: string;
    page?: number;
    limit?: number;
  }
): Promise<TeamReport> => {
  const res = await service(role).getJson("/reports/team", clean(params));
  return res.data.data;
};
