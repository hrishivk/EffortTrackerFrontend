import { useCallback, useEffect, useState } from "react";
import {
  fetchTeamReport,
  fetchUserReport,
  type ReportDay,
  type ReportPrevious,
  type ReportTotals,
  type TeamMemberRow,
} from "../../../../core/actions/reportAction";
import { toKey } from "../../data/reportMetrics";
import { EMPTY_PREVIOUS, EMPTY_TOTALS, type Scope } from "./constants";

type Options = {
  role: string | undefined;
  scope: Scope;
  canSeeOthers: boolean;
  memberId: string;
  projectId: string;
  groupId: string;
  from: Date;
  to: Date;
  showSnackbar: (opts: { message: string; severity: "warning" | "error" }) => void;
};

/** Loads the report figures for the current filters and reloads when they change. */
export const useReportData = ({
  role,
  scope,
  canSeeOthers,
  memberId,
  projectId,
  groupId,
  from,
  to,
  showSnackbar,
}: Options) => {
  const [totals, setTotals] = useState<ReportTotals>(EMPTY_TOTALS);
  const [previous, setPrevious] = useState<ReportPrevious>(EMPTY_PREVIOUS);
  const [daily, setDaily] = useState<ReportDay[]>([]);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const window = { from: toKey(from), to: toKey(to) };

      if (scope === "team") {
        const r = await fetchTeamReport(role, {
          ...window,
          project_id: projectId,
          group_id: groupId,
        });
        setTotals(r.totals);
        setPrevious(r.previous);
        setDaily(r.daily ?? []);
        setMembers(r.members ?? []);
        setMemberCount(r.member_count ?? r.members?.length ?? 0);
      } else {
        const r = await fetchUserReport(role, {
          ...window,
          ...(canSeeOthers ? { user_id: memberId } : {}),
          project_id: projectId,
          group_id: groupId,
        });
        setTotals(r.totals);
        setPrevious(r.previous);
        setDaily(r.daily ?? []);
        setMembers([]);
        setMemberCount(0);
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const message = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      showSnackbar({
        message:
          status === 403
            ? message || "You cannot read a report for that person"
            : message || "Could not generate the report",
        severity: status === 403 ? "warning" : "error",
      });
      setTotals(EMPTY_TOTALS);
      setPrevious(EMPTY_PREVIOUS);
      setDaily([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [canSeeOthers, from, groupId, memberId, projectId, role, scope, showSnackbar, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return { totals, previous, daily, members, memberCount, loading };
};
