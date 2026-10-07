import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiChevronRight, FiDownload, FiFileText, FiSettings } from "react-icons/fi";

import SpinLoader from "../../../presentation/SpinLoader";
import { fetchUserReport, type ReportTask } from "../../../core/actions/reportAction";
import { fetchAllTaskGroups } from "../../../core/actions/action";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useAppSelector } from "../../../store/configureStore";
import { deltaPct, toKey } from "../data/reportMetrics";
import {
  CUSTOM,
  RANGES,
  startOfDay,
  type Group,
  type Proj,
  type Scope,
} from "./TaskReports/constants";
import { useReportPeople } from "./TaskReports/useReportPeople";
import { useReportData } from "./TaskReports/useReportData";
import ReportConfig from "./TaskReports/ReportConfig";
import { TaskProductivityCard, TimeEffortCard } from "./TaskReports/OverviewCards";
import { CompletedOverTimeCard, StatusBreakdownCard } from "./TaskReports/TrendCards";
import { MembersCard, RecentActivityCard } from "./TaskReports/ReportTables";

export default function TaskReports() {
  const { role } = useParams();
  const { showSnackbar } = useSnackbar();
  const { user } = useAppSelector((state) => state.user);

  const upperRole = String(role ?? "").toUpperCase();
  const canSeeOthers = upperRole === "SP" || upperRole === "AM";
  const isAM = upperRole === "AM";

  const [scope, setScope] = useState<Scope>(canSeeOthers ? "team" : "user");
  const peopleState = useReportPeople({ canSeeOthers, isAM, selfId: user?.id, showSnackbar });
  const { people } = peopleState;

  const [selectedPerson, setSelectedPerson] = useState<{
    id: string;
    name: string;
    role?: string;
  } | null>(null);
  const [memberId, setMemberId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [rangeKey, setRangeKey] = useState("15");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];
  const today = useMemo(() => startOfDay(new Date()), []);

  const customReady = rangeKey === CUSTOM && !!customFrom && !!customTo;

  const to = useMemo(
    () => (customReady ? startOfDay(customTo as Date) : today),
    [customReady, customTo, today]
  );
  const from = useMemo(() => {
    if (customReady) return startOfDay(customFrom as Date);
    const d = new Date(to);
    d.setDate(d.getDate() - (range.days - 1));
    return d;
  }, [customReady, customFrom, range.days, to]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const g = await fetchAllTaskGroups();
        if (!alive) return;
        setGroups(g || []);
        setMemberId((cur) => cur || (canSeeOthers ? "" : String(user?.id ?? "")));
      } catch {
        if (alive) {
          showSnackbar({ message: "Could not load the report filters", severity: "error" });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [canSeeOthers, showSnackbar, user?.id]);

  const { totals, previous, daily, members, memberCount, loading } = useReportData({
    role,
    scope,
    canSeeOthers,
    memberId,
    projectId,
    groupId,
    from,
    to,
    showSnackbar,
  });

  const projects = useMemo<Proj[]>(() => {
    const source =
      scope === "team"
        ? people
        : people.filter((p) => String(p.id) === memberId);
    const byId = new Map<string, Proj>();
    for (const person of source) {
      for (const proj of person.projects ?? []) {
        if (proj?.id) byId.set(proj.id, proj);
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [people, memberId, scope]);

  useEffect(() => {
    if (projectId && !projects.some((p) => p.id === projectId)) setProjectId("");
  }, [projects, projectId]);

  const memberName =
    people.find((p) => String(p.id) === memberId)?.fullName ||
    selectedPerson?.name ||
    "—";
  const projectName = projects.find((p) => p.id === projectId)?.name || "All Projects";

  const onExport = async () => {
    setExporting(true);
    try {
      let rows: ReportTask[] = [];
      let truncated = false;
      if (scope === "user") {
        try {
          const full = await fetchUserReport(role, {
            from: toKey(from),
            to: toKey(to),
            ...(canSeeOthers ? { user_id: memberId } : {}),
            project_id: projectId,
            group_id: groupId,
            include: "tasks",
          });
          rows = full.tasks ?? [];
          truncated = full.tasks_truncated === true;
        } catch {
          showSnackbar({
            message: "Task list unavailable — exporting the summary only",
            severity: "warning",
          });
        }
      }

      const { exportReportXlsx } = await import("../data/reportExport");
      await exportReportXlsx(
        {
          member: scope === "team" ? `Team (${memberCount} members)` : memberName,
          project: projectName,
          from,
          to,
        },
        totals,
        daily,
        members,
        rows,
        truncated
      );
      showSnackbar({ message: "Report exported", severity: "success" });
    } catch {
      showSnackbar({ message: "Could not export the report", severity: "error" });
    } finally {
      setExporting(false);
    }
  };

  const onPrint = () => {
    document.body.classList.add("printing-report");
    const clear = () => document.body.classList.remove("printing-report");
    window.addEventListener("afterprint", clear, { once: true });
    window.setTimeout(clear, 1000);
    window.print();
  };

  const exportActions = (
    <span className="tr-exports">
      <button
        type="button"
        className="tr-export"
        onClick={() => void onExport()}
        disabled={exporting || loading}
        title="Download the report as an .xlsx workbook"
      >
        <FiDownload size={13} />
        {exporting ? "Building…" : "Excel"}
      </button>
      <button
        type="button"
        className="tr-export"
        onClick={onPrint}
        disabled={loading}
        title="Opens your browser's print dialog — choose Save as PDF"
      >
        <FiFileText size={13} />
        PDF
      </button>
    </span>
  );

  return (
    <div className="tr-page">
      <SpinLoader
        isLoading={loading}
        label={scope === "team" ? "Loading team report" : "Loading report"}
      />

      <nav className="tr-crumb" aria-label="Breadcrumb">
        <FiSettings size={13} />
        <Link to={`/${role}/settings`}>Settings</Link>
        <FiChevronRight size={12} />
        <span aria-current="page">Task Reports</span>
      </nav>

      <header className="tr-head">
        <h1 className="tr-title">Task Reports</h1>

        <p className="tr-meta">
          <b>{scope === "team" ? `Team — ${memberCount} members` : memberName}</b>
          <span>
            {from.toLocaleDateString()} – {to.toLocaleDateString()}
          </span>
          <span>{projectName}</span>
          <span>{groups.find((g) => g.id === groupId)?.name || "All statuses"}</span>
          <span>Generated {new Date().toLocaleString()}</span>
        </p>
        <p className="tr-sub">
          {canSeeOthers
            ? "Generate detailed task and time reports for your team members."
            : "Your own task and time figures."}
        </p>
      </header>

      <ReportConfig
        canSeeOthers={canSeeOthers}
        scope={scope}
        onScopeChange={setScope}
        actions={exportActions}
        peopleState={peopleState}
        memberId={memberId}
        selectedPerson={selectedPerson}
        onMemberChange={(id, person) => {
          setMemberId(id);
          setSelectedPerson(person);
        }}
        dateRange={{
          rangeKey,
          onRangeKeyChange: setRangeKey,
          customFrom,
          customTo,
          onCustomChange: (start, end) => {
            setCustomFrom(start);
            setCustomTo(end);
          },
          customReady,
          today,
          onTooLong: (message) => showSnackbar({ message, severity: "warning" }),
        }}
        projects={projects}
        projectId={projectId}
        onProjectChange={setProjectId}
        groups={groups}
        groupId={groupId}
        onGroupChange={setGroupId}
      />

      <h2 className="tr-section">Report Overview</h2>

      <div className="tr-overview">
        <TaskProductivityCard
          totals={totals}
          daily={daily}
          delta={deltaPct(totals.completed, previous.completed)}
        />
        <TimeEffortCard
          totals={totals}
          daily={daily}
          delta={deltaPct(totals.total_seconds, previous.total_seconds)}
        />
      </div>

      <div className="tr-trend">
        <CompletedOverTimeCard daily={daily} />
        <StatusBreakdownCard totals={totals} />
      </div>

      {scope === "team" && <MembersCard members={members} memberCount={memberCount} />}

      <div className="tr-bottom">
        <RecentActivityCard daily={daily} />
      </div>
    </div>
  );
}
