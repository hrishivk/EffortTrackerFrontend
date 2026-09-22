import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FormControl, MenuItem, Select } from "@mui/material";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Sector,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheckSquare,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFileText,
  FiFolder,
  FiSettings,
  FiPieChart,
  FiSliders,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import SpinLoader from "../../../presentation/SpinLoader";
import {
  fetchTeamReport,
  fetchUserReport,
  type ReportDay,
  type ReportPrevious,
  type ReportTask,
  type ReportTotals,
  type TeamMemberRow,
} from "../../../core/actions/reportAction";
import { fetchAllTaskGroups } from "../../../core/actions/action";
import { fetchUsers } from "../../../core/actions/spAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useAppSelector } from "../../../store/configureStore";
import MentionPicker from "../../../shared/components/User/MentionPicker";
import { deltaPct, fmtDay, fmtDayLong, fmtDuration, toKey } from "../data/reportMetrics";


interface Proj {
  id: string;
  name: string;
}

/** Team members per roster request, and per press of Load more. */
const PEOPLE_PAGE = 10;

interface Person {
  id?: string | number;
  fullName?: string;
  email?: string;
  /** Shown beside the name in the picker, where two people share a first name. */
  role?: string;
  /** What this person is assigned to. `/list-users` nests it on every row. */
  projects?: Proj[];
}

interface Group {
  id: string;
  name: string;
}

/** The window presets, in days back from today including today. */
const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "15", label: "Last 15 days", days: 15 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
];

const CUSTOM = "custom";

/** Recent Activity rows: what the screen shows, and what the page holds. */
const SCREEN_ROWS = 8;
const PRINT_ROWS = 15;

/** The server rejects anything longer, so the picker refuses it first. */
const MAX_RANGE_DAYS = 366;

const fmtRange = (a: Date, b: Date) => {
  const day = (d: Date) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  return `${day(a)} – ${day(b)}, ${b.getFullYear()}`;
};

/**
 * The field look, taken from the Create User form's Blood Group select so the
 * two are the same control rather than two takes on one.
 */
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-surface)",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
    },
  },
  "& .MuiInputBase-input": { padding: "10px 14px", fontSize: 13, fontWeight: 600 },
  "& .MuiSelect-select": { padding: "10px 14px" },
};

/** The same field, shrunk to sit in the calendar header. */
const headerSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "7px",
    backgroundColor: "var(--bg-card)",
    fontSize: 11.5,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
    },
  },
  "& .MuiSelect-select": {
    padding: "4px 26px 4px 8px",
    color: "var(--text-primary)",
  },
  "& .MuiSelect-icon": { right: 3, color: "var(--text-muted)" },
};

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString(undefined, { month: "short" })
);

/** Placeholder text is faint; a chosen value is not. */
const valueSx = (filled: boolean) => ({
  color: filled ? "var(--text-primary)" : "var(--text-faint)",
});

/** The spring the dashboard's List / Board / Gantt tabs use. Same feel here. */
const TAB_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

const SCOPES = [
  { key: "user" as const, label: "Individual", Icon: FiUser },
  { key: "team" as const, label: "Team", Icon: FiUsers },
];

/** Recessive grid and axes — the data carries the ink, not the frame. */
const AXIS = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 10, fill: "var(--text-faint)" },
} as const;

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid var(--border-light)",
  backgroundColor: "var(--bg-card)",
  fontSize: 12,
};
const GainDot = (props: {
  cx?: number;
  cy?: number;
  payload?: { gained?: boolean };
}) => {
  const { cx, cy, payload } = props;
  if (!payload?.gained || cx === undefined || cy === undefined) {
    // Recharts wants an element back, never null.
    return <g />;
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--chart-trend)"
      stroke="var(--bg-card)"
      strokeWidth={2}
    />
  );
};

/**
 * The hovered segment, drawn a few pixels proud of the ring.
 *
 * Size, not a colour change: brightening a slice moves it relative to its
 * neighbours in exactly the dimension the legend exists to protect.
 */
const RaisedSlice = (props: object) => {
  const p = props as { innerRadius?: number; outerRadius?: number };
  return (
    <Sector
      {...(props as Record<string, unknown>)}
      innerRadius={(p.innerRadius ?? 0) - 2}
      outerRadius={(p.outerRadius ?? 0) + 6}
    />
  );
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const EMPTY_TOTALS: ReportTotals = {
  tasks_worked: 0,
  completed: 0,
  in_progress: 0,
  pending: 0,
  completion_rate: 0,
  total_seconds: 0,
  avg_seconds_per_task: 0,
  active_rate: 0,
  today_seconds: 0,
};

const EMPTY_PREVIOUS: ReportPrevious = { tasks_worked: 0, completed: 0, total_seconds: 0 };

type Scope = "user" | "team";

export default function TaskReports() {
  const { role } = useParams();
  const { showSnackbar } = useSnackbar();
  const { user } = useAppSelector((state) => state.user);

  const upperRole = String(role ?? "").toUpperCase();
  const canSeeOthers = upperRole === "SP" || upperRole === "AM";
  const isAM = upperRole === "AM";

 
  const reportable = useCallback(
    (rows: Person[]) =>
      rows.filter((p) => {
        if (String(p.id) === String(user?.id ?? "")) return false;
        if (!isAM) return true;
        const r = String(p.role ?? "").toUpperCase();
        return r === "USER" || r === "DEVLOPER";
      }),
    [isAM, user?.id]
  );

  
  const [scope, setScope] = useState<Scope>(canSeeOthers ? "team" : "user");
  const [people, setPeople] = useState<Person[]>([]);
  
  const [peoplePage, setPeoplePage] = useState(1);
  const [peoplePages, setPeoplePages] = useState(1);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  
  const peopleLoaded = useRef(false);
  
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
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLLabelElement | null>(null);

  const [totals, setTotals] = useState<ReportTotals>(EMPTY_TOTALS);
  const [previous, setPrevious] = useState<ReportPrevious>(EMPTY_PREVIOUS);
  const [daily, setDaily] = useState<ReportDay[]>([]);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [memberCount, setMemberCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  /** Which slice the pointer is on — the arc and its key row share it. */
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];
  const today = useMemo(() => startOfDay(new Date()), []);

  const YEARS = useMemo(() => {
    const end = today.getFullYear();
    return Array.from({ length: 6 }, (_, i) => end - 5 + i);
  }, [today]);

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
    if (!calOpen) return;
    const away = (e: MouseEvent) => {
      if (!calRef.current?.contains(e.target as Node)) setCalOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCalOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [calOpen]);

  // ─── Pickers ──────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        /*
         * The roster is not fetched here. It is a list nobody reads until they
         * reach for the member field, so it waits for that — see
         * `openPeople` below. Only the groups are needed to draw the page.
         *
         * Every group the caller can see, not one board's lanes: a team report
         * spans people whose boards do not have the same columns.
         */
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

  // ─── The report ───────────────────────────────────────────────────
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

  // ─── Derived for display only ─────────────────────────────────────
  const doneDelta = deltaPct(totals.completed, previous.completed);
  const timeDelta = deltaPct(totals.total_seconds, previous.total_seconds);

  const taskChart = useMemo(
    () =>
      daily.map((d) => ({
        label: fmtDay(d.date),
        // Keyed by the label shown in the legend and tooltip, so the two can
        // never disagree about which line is which.
        Worked: d.tasks_worked,
        Completed: d.completed,
      })),
    [daily]
  );

  const chart = useMemo(
    () =>
      daily.map((d) => ({
        label: fmtDay(d.date),
        hours: +(d.total_seconds / 3600).toFixed(2),
      })),
    [daily]
  );

  // Newest first, and only the days that actually had work on them — a table
  // padded with empty rows buries the days worth reading.
  /*
   * Eight rows on screen, fifteen on paper.
   *
   * Eight is what fits beside the card next to it; fifteen is what fits on the
   * printed page without pushing the report past three. Anything further back
   * is in the Excel export, which has no page to run out of.
   */
  const activity = useMemo(
    () => daily.filter((d) => d.tasks_worked > 0).slice().reverse().slice(0, PRINT_ROWS),
    [daily]
  );

  /*
   * A running total, not the per-day counts the card above already plots. It
   * answers a different question — how the window is building up — and being
   * monotonic it reads as an area, which a jagged daily series would not.
   */
  const cumulative = useMemo(() => {
    let run = 0;
    return daily.map((d) => {
      run += d.completed;
      // `gained` is what the bubbles mark: a day something was finished. Every
      // other day the line is flat, and an unmarked flat run is the stall the
      // card's note is about.
      return { label: fmtDay(d.date), Completed: run, gained: d.completed > 0 };
    });
  }, [daily]);

  /*
   * Part-to-whole of the same `tasks_worked` the tiles count, so the three
   * always sum to it. Zero-value slices are dropped — a legend entry for a
   * segment with no arc is a line the reader has to rule out.
   */
  const statusSplit = useMemo(() => {
    const whole = Math.max(1, totals.tasks_worked);
    /*
     * Ordered palest to darkest, which is also the order the work moves in.
     * The ring reads as a progression rather than three unrelated wedges, and
     * the arcs stay in that order however the counts fall.
     */
    return [
      { name: "Pending", value: totals.pending, token: "var(--chart-pending)" },
      { name: "In Progress", value: totals.in_progress, token: "var(--chart-progress)" },
      { name: "Completed", value: totals.completed, token: "var(--chart-done)" },
    ]
      .filter((slice) => slice.value > 0)
      .map((slice) => ({ ...slice, pct: Math.round((slice.value / whole) * 100) }));
  }, [totals]);

  /*
   * Only the projects the report could actually be about.
   *
   * Individual scope is the selected person's own list — picking Mayookh must
   * not offer a project he is not on, because that report is empty by
   * construction. Team scope has no one person, so it is the union of the
   * team's, de-duplicated by id since most projects have several people on
   * them.
   */
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

  /*
   * A project chosen for one person is meaningless for the next, and leaving it
   * set would send a `project_id` the new member is not on — a silently empty
   * report rather than an obviously wrong one.
   */
  useEffect(() => {
    if (projectId && !projects.some((p) => p.id === projectId)) setProjectId("");
  }, [projects, projectId]);

  const active = activeSlice === null ? null : statusSplit[activeSlice] ?? null;

  const memberName =
    people.find((p) => String(p.id) === memberId)?.fullName ||
    selectedPerson?.name ||
    "—";

  /**
   * One page of the roster, replacing the page before it.
   *
   * A page at a time rather than a growing pile: you read down ten names, do
   * not see the one you want, and go to the next ten. Previous brings back the
   * page you just read, and the request is the same either way.
   */
  const loadPeoplePage = useCallback(
    async (page: number, search = peopleSearch) => {
      if (!canSeeOthers) return;
      setPeopleLoading(true);
      try {
        const res = await fetchUsers({
          page,
          limit: PEOPLE_PAGE,
          ...(search ? { search } : {}),
        });
        setPeople(reportable(res?.users ?? []));
        setPeoplePage(page);
        setPeoplePages(res?.totalPages || 1);
      } catch {
        showSnackbar({ message: "Could not load the team list", severity: "error" });
      } finally {
        setPeopleLoading(false);
      }
    },
    // showSnackbar is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canSeeOthers, peopleSearch, reportable]
  );

  /**
   * The first page, the first time somebody opens the field.
   *
   * Nothing is fetched to draw this page: the roster only matters once you go
   * looking for a name in it, so that is when it is asked for.
   */
  const openPeople = useCallback(() => {
    if (peopleLoaded.current || peopleLoading) return;
    peopleLoaded.current = true;
    void loadPeoplePage(1).catch(() => {
      // Let the next open try again.
      peopleLoaded.current = false;
    });
  }, [peopleLoading, loadPeoplePage]);

  /**
   * A search starts again at page one, because the match may be on a page
   * nobody has opened — a picker that only searched the ten in hand would say
   * "no such person" about somebody who is right there.
   */
  const searchPeople = useCallback(
    (query: string) => {
      if (query === peopleSearch) return;
      setPeopleSearch(query);
      peopleLoaded.current = true;
      void loadPeoplePage(1, query);
    },
    [peopleSearch, loadPeoplePage]
  );

  /** The roster as the picker wants it: a name to search and a role to show. */
  const pickablePeople = useMemo(
    () =>
      people.map((p) => ({
        id: String(p.id),
        name: p.fullName || p.email || "Unknown",
        role: p.role,
      })),
    [people]
  );
  const projectName = projects.find((p) => p.id === projectId)?.name || "All Projects";
  const onExport = async () => {
    setExporting(true);
    try {
      /*
       * The task rows are fetched here, not with the page.
       *
       * Nothing on screen needs them and on a long window they are the bulk of
       * the response, so asking for them on every filter change would be paying
       * for a sheet almost nobody opens. The same member, window, project and
       * status group the page is showing go with the request, so the sheet can
       * only ever describe the report it came from.
       *
       * Team scope has no per-task sheet: that is every member's tasks, which
       * is a different and much larger thing to ask for.
       */
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
          /*
           * The workbook is still worth having without the Tasks sheet, so a
           * failure here is reported and stepped over rather than losing the
           * export. `/reports/user` does not return `tasks` yet.
           */
          showSnackbar({
            message: "Task list unavailable — exporting the summary only",
            severity: "warning",
          });
        }
      }

      // Imported on the click, not with the page: exceljs is ~940kB minified,
      // and most visits here read the figures and never export anything.
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

  /*
   * Print, and let the browser make the PDF.
   *
   * No PDF library on either side, and the one already on the machine is the
   * browser's own — "Save as PDF" in its print dialog renders the real page,
   * charts and all, rather than a second layout that has to be kept in step
   * with this one.
   *
   * The body class is what the print stylesheet keys off; `afterprint` clears
   * it, and so does the timeout, because Safari fires that event unreliably.
   */
  const onPrint = () => {
    document.body.classList.add("printing-report");
    const clear = () => document.body.classList.remove("printing-report");
    window.addEventListener("afterprint", clear, { once: true });
    window.setTimeout(clear, 1000);
    window.print();
  };

  /*
   * Export, beside the scope switch in the configuration head.
   *
   * These had a card of their own, which gave two downloads the same weight on
   * the page as a chart. Up here they sit with the other controls, and they are
   * reachable without scrolling past every chart to find them.
   */
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

  const delta = (v: number | null) =>
    v === null ? null : (
      <span className={`tr-delta${v < 0 ? " tr-delta--down" : ""}`}>
        {v < 0 ? <FiArrowDownRight size={12} /> : <FiArrowUpRight size={12} />}
        {v > 0 ? "+" : ""}
        {v}%
      </span>
    );

  return (
    <div className="tr-page">
      {/*
          The RX loader, over the whole page while a report is being read.
          `SpinLoader` holds it back 300ms, so a quick read never flashes it and
          a slow one — switching scope refetches everything — always shows it.
      */}
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

        {/*
            Print only. The configuration card is stripped from the printed
            page — it is a set of choices, not findings — so the choices have
            to survive somewhere, or the reader is handed figures with nothing
            saying whose they are or when.
        */}
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

      {/* ─── Configuration ─── */}
      <section className="tr-card tr-config">
        <div className="tr-card__head">
          <span className="tr-card__icon"><FiSliders size={17} /></span>
          <h2 className="tr-card__title">Report Configuration</h2>

          {/*
              No Generate button and no timestamp: the report reloads whenever a
              filter or the scope changes, and a read that takes long enough to
              notice puts the RX loader up (`SpinLoader` at the top of the page).
              That is the whole status story, so nothing here repeats it.

              `margin-left: auto` moves to the switch, which is now the only
              thing on the right of this header.
          */}

          {/*
              Scope and exports together on the right of this head. One group
              rather than two `margin-left: auto` siblings, which would push
              apart and strand the exports mid-header when the switch is hidden.
          */}
          <div className="tr-head-actions">
          {/* Individual or the whole team. Hidden for anyone who has no team. */}
          {canSeeOthers && (
            <div className="tr-scope" role="tablist" aria-label="Report scope">
              {SCOPES.map(({ key, label, Icon }) => {
                const active = scope === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setScope(key)}
                    whileTap={{ scale: 0.94 }}
                    transition={TAB_SPRING}
                    className="tr-scope__btn"
                    style={{ color: active ? "#fff" : "var(--text-muted)" }}
                  >
                    {/* One element shared across both tabs, so framer slides it
                        from the old one to the new rather than fading two. The
                        radius is inline because framer only corrects a scaled
                        element's corners for a radius it can read as a style. */}
                    {active && (
                      <motion.span
                        layoutId="reportScopePill"
                        transition={TAB_SPRING}
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 8,
                          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                          boxShadow: "0 2px 10px rgba(124, 58, 237, 0.35)",
                          zIndex: 0,
                        }}
                      />
                    )}
                    <motion.span
                      animate={{ scale: active ? 1.12 : 1 }}
                      transition={TAB_SPRING}
                      style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
                    >
                      <Icon size={13} />
                    </motion.span>
                    <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}
          {exportActions}
          </div>
        </div>

        <div className="tr-config__grid">
          {scope === "user" && canSeeOthers && (
            <label className="tr-field">
              <span className="tr-field__label">
                Select team member
                <span className="tr-field__count">
                  <FiUsers size={11} />
                  {people.length} loaded
                </span>
              </span>
              {/*
                * Searched, not scrolled. A dropdown is fine for five options
                * and unusable at two hundred — and this list is the whole
                * roster, so the name you want is faster typed than found.
                */}
              <MentionPicker
                people={pickablePeople}
                value={memberId}
                onChange={(id) => {
                  setMemberId(id);
                  setSelectedPerson(pickablePeople.find((p) => p.id === id) ?? null);
                }}
                allowEmpty={false}
                placeholder="Type a name to search…"
                onOpen={openPeople}
                onSearch={searchPeople}
                page={peoplePage}
                pageCount={peoplePages}
                onPageChange={loadPeoplePage}
                loading={peopleLoading}
                selected={selectedPerson}
              />
            </label>
          )}

          <label className="tr-field" ref={calRef}>
            <span className="tr-field__label">
              Date range
              {/* Up here beside the label, the way the member field carries its
                  count — not on a line of its own under the field. */}
              {rangeKey === CUSTOM && (
                <button
                  type="button"
                  className="tr-cal__toggle"
                  onClick={() => setCalOpen((o) => !o)}
                >
                  <FiCalendar size={11} />
                  {customReady ? "Change dates" : "Choose dates"}
                </button>
              )}
            </span>
            <FormControl fullWidth size="small" sx={inputSx}>
              <Select
                displayEmpty
                value={rangeKey}
                onChange={(e) => {
                  const next = String(e.target.value);
                  setRangeKey(next);
                  // Picking Custom opens the calendar straight away — it is the
                  // only option that needs a second step, so asking for a third
                  // click to reveal it would be one too many.
                  setCalOpen(next === CUSTOM);
                }}
                // Once both ends exist the field carries the dates themselves,
                // which is the only place the chosen window is written down.
                renderValue={(v) =>
                  v === CUSTOM
                    ? customReady
                      ? fmtRange(customFrom as Date, customTo as Date)
                      : "Pick two dates…"
                    : RANGES.find((r) => r.key === v)?.label || "Select Date Range"
                }
                sx={valueSx(rangeKey !== CUSTOM || customReady)}
              >
                {RANGES.map((r) => (
                  <MenuItem key={r.key} value={r.key}>{r.label}</MenuItem>
                ))}
                <MenuItem value={CUSTOM}>Custom range…</MenuItem>
              </Select>
            </FormControl>

            {calOpen && (
              <div className="tr-cal">
                <DatePicker
                  selectsRange
                  inline
                  /*
                   * The header is ours, so the month and year are the same MUI
                   * select the rest of the form uses.
                   *
                   * react-datepicker's own `showMonthDropdown` renders a bare
                   * native select that inherits nothing — a different control
                   * sitting inside the field it belongs to. The arrows stay for
                   * stepping one month at a time.
                   */
                  renderCustomHeader={({
                    date,
                    changeMonth,
                    changeYear,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div className="tr-cal__head">
                      <button
                        type="button"
                        className="tr-cal__nav"
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        aria-label="Previous month"
                      >
                        <FiChevronLeft size={14} />
                      </button>

                      <FormControl size="small" sx={headerSx}>
                        <Select
                          value={date.getMonth()}
                          onChange={(e) => changeMonth(Number(e.target.value))}
                          MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                        >
                          {MONTHS.map((m, i) => (
                            <MenuItem key={m} value={i} sx={{ fontSize: 12.5 }}>{m}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={headerSx}>
                        <Select
                          value={date.getFullYear()}
                          onChange={(e) => changeYear(Number(e.target.value))}
                          MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                        >
                          {YEARS.map((y) => (
                            <MenuItem key={y} value={y} sx={{ fontSize: 12.5 }}>{y}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <button
                        type="button"
                        className="tr-cal__nav"
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        aria-label="Next month"
                      >
                        <FiChevronRight size={14} />
                      </button>
                    </div>
                  )}
                  startDate={customFrom}
                  endDate={customTo}
                  // Every preset ends today; a window running into the future
                  // would only ever add empty days.
                  maxDate={today}
                  onChange={(dates) => {
                    const [start, end] = dates as [Date | null, Date | null];
                    if (start && end) {
                      const span =
                        Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
                      if (span > MAX_RANGE_DAYS) {
                        showSnackbar({
                          message: `Pick ${MAX_RANGE_DAYS} days or fewer`,
                          severity: "warning",
                        });
                        return;
                      }
                    }
                    setCustomFrom(start);
                    setCustomTo(end);
                    // Both ends in: the report can run, so the calendar closes.
                    if (start && end) setCalOpen(false);
                  }}
                />
              </div>
            )}
          </label>

          <label className="tr-field">
            <span className="tr-field__label">
              Project
              {projects.length > 0 && (
                <span className="tr-field__count">
                  <FiFolder size={11} />
                  {projects.length} assigned
                </span>
              )}
            </span>
            <FormControl fullWidth size="small" sx={inputSx}>
              <Select
                displayEmpty
                value={projectId}
                onChange={(e) => setProjectId(String(e.target.value))}
                renderValue={(v) =>
                  (v && projects.find((p) => p.id === v)?.name) || "All Projects"
                }
                // "All Projects" is a real choice, not an empty state, so it is
                // shown in full colour rather than as a placeholder.
                sx={valueSx(true)}
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </label>

          <label className="tr-field">
            <span className="tr-field__label">Status group</span>
            <FormControl fullWidth size="small" sx={inputSx}>
              <Select
                displayEmpty
                value={groupId}
                onChange={(e) => setGroupId(String(e.target.value))}
                renderValue={(v) =>
                  (v && groups.find((g) => g.id === v)?.name) || "All Statuses"
                }
                // "All Statuses" is a real choice, not an empty state.
                sx={valueSx(true)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </label>
        </div>
      </section>

      <h2 className="tr-section">Report Overview</h2>

      <div className="tr-overview">
        {/* ─── Productivity ─── */}
        <section className="tr-card">
          <div className="tr-card__head">
            <span className="tr-card__icon"><FiCheckSquare size={17} /></span>
            <div className="tr-card__titles">
              <h3 className="tr-card__title">Task Productivity Report</h3>
              <p className="tr-card__note">Track task completion and team productivity.</p>
            </div>
            <div className="tr-card__delta">
              {delta(doneDelta)}
              <span className="tr-card__vs">vs previous period</span>
            </div>
          </div>

          <div className="tr-tiles">
            <div className="tr-tile"><b>{totals.tasks_worked}</b><span>Tasks Worked</span></div>
            <div className="tr-tile"><b>{totals.completed}</b><span>Completed</span></div>
            <div className="tr-tile"><b>{totals.in_progress}</b><span>In Progress</span></div>
            <div className="tr-tile"><b>{totals.pending}</b><span>Pending</span></div>
          </div>

          <div className="tr-rate">
            <div className="tr-rate__row">
              <span>Completion Rate</span>
              <b>{totals.completion_rate}%</b>
            </div>
            <div className="tr-rate__track">
              <div className="tr-rate__fill" style={{ width: `${totals.completion_rate}%` }} />
            </div>
          </div>

          {/*
              The rate above is one number for the whole window; this is the
              same story day by day, and the gap between the two lines is the
              work that did not get finished.

              Lines rather than bars: the card beside this one is already a bar
              chart, and two counts on one scale read as a gap more clearly than
              as paired columns. One y-axis, both series in tasks — never a
              second scale.

              Colours come from `--chart-worked` / `--chart-completed`, which
              are the same violet and green the Tasks Worked and Completed tiles
              above use, so a series keeps its identity down the card. Both
              steps are validated against their own surface.
          */}
          <div className="tr-chart">
            <div className="tr-chart__head">
              <p className="tr-chart__title">Tasks by Day</p>
              <div className="tr-legend">
                <span className="tr-legend__item">
                  <span className="tr-legend__key tr-legend__key--worked" />
                  Worked
                </span>
                <span className="tr-legend__item">
                  <span className="tr-legend__key tr-legend__key--done" />
                  Completed
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={168}>
              <LineChart data={taskChart} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke="var(--border-light)" />
                <XAxis
                  {...AXIS}
                  dataKey="label"
                  interval="preserveStartEnd"
                  minTickGap={18}
                />
                <YAxis {...AXIS} width={44} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "var(--border-light)", strokeWidth: 1 }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Line
                  type="monotone"
                  dataKey="Worked"
                  stroke="var(--chart-worked)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--bg-card)" }}
                />
                <Line
                  type="monotone"
                  dataKey="Completed"
                  stroke="var(--chart-completed)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--bg-card)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ─── Time ─── */}
        <section className="tr-card">
          <div className="tr-card__head">
            <span className="tr-card__icon"><FiClock size={17} /></span>
            <div className="tr-card__titles">
              <h3 className="tr-card__title">Time &amp; Effort Report</h3>
              <p className="tr-card__note">Analyze time spent and effort distribution.</p>
            </div>
            <div className="tr-card__delta">
              {delta(timeDelta)}
              <span className="tr-card__vs">vs previous period</span>
            </div>
          </div>

          <div className="tr-tiles">
            <div className="tr-tile"><b>{fmtDuration(totals.total_seconds)}</b><span>Total Time</span></div>
            <div className="tr-tile"><b>{fmtDuration(totals.avg_seconds_per_task)}</b><span>Avg / Task</span></div>
            <div className="tr-tile"><b>{totals.active_rate}%</b><span>Active Time</span></div>
            <div className="tr-tile"><b>{fmtDuration(totals.today_seconds)}</b><span>Today</span></div>
          </div>

          {/* One series, so no legend — the title names it. */}
          <div className="tr-chart">
            <div className="tr-chart__head">
              <p className="tr-chart__title">Time Spent by Day</p>
            </div>
            <ResponsiveContainer width="100%" height={168}>
              <BarChart data={chart} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke="var(--border-light)" />
                <XAxis
                  {...AXIS}
                  dataKey="label"
                  interval="preserveStartEnd"
                  minTickGap={18}
                />
                <YAxis {...AXIS} width={44} tickFormatter={(v: number) => `${v}h`} />
                <Tooltip
                  cursor={{ fill: "rgba(124,58,237,0.07)" }}
                  formatter={(v: number) => [`${v}h`, "Time"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                {/* 4px rounded ends on the data end only, anchored to the baseline. */}
                <Bar
                  dataKey="hours"
                  fill="var(--chart-worked)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* ─── Trend and split ─── */}
      <div className="tr-trend">
        {/* One series, so no legend — the title names it. */}
        <section className="tr-card">
          <div className="tr-card__head">
            <span className="tr-card__icon"><FiTrendingUp size={17} /></span>
            <div className="tr-card__titles">
              <h3 className="tr-card__title">Completed Over Time</h3>
              <p className="tr-card__note">
                Running total across the window — a flat stretch is a stall.
                Each bubble is a day something was completed.
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={196}>
            <AreaChart data={cumulative} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
              {/* A single hue fading out, not a second colour — the fill is the
                  same green as the line so it reads as one series with weight. */}
              <defs>
                <linearGradient id="trCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-trend)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-trend)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border-light)" />
              <XAxis {...AXIS} dataKey="label" interval="preserveStartEnd" minTickGap={18} />
              <YAxis {...AXIS} width={44} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: "var(--border-light)", strokeWidth: 1 }}
                contentStyle={TOOLTIP_STYLE}
              />
              <Area
                type="monotone"
                dataKey="Completed"
                stroke="var(--chart-trend)"
                strokeWidth={2}
                fill="url(#trCumulative)"
                dot={<GainDot />}
                // Bigger than the resting bubble, so the hovered day is the one
                // the eye lands on rather than one of its neighbours.
                activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--bg-card)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* ─── Status split ─── */}
        <section className="tr-card">
          <div className="tr-card__head">
            <span className="tr-card__icon"><FiPieChart size={17} /></span>
            <div className="tr-card__titles">
              <h3 className="tr-card__title">Status Breakdown</h3>
              <p className="tr-card__note">Share of the {totals.tasks_worked} tasks worked.</p>
            </div>
          </div>

          {statusSplit.length === 0 ? (
            <p className="tr-empty">No tasks in this period</p>
          ) : (
            <div className="tr-split">
              <div
                className="tr-split__chart"
                onMouseLeave={() => setActiveSlice(null)}
              >
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={statusSplit}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={80}
                      // Softened ends and a surface-coloured gap, so two slices
                      // never touch and the boundary survives any colour vision.
                      cornerRadius={4}
                      paddingAngle={3}
                      stroke="var(--bg-card)"
                      strokeWidth={2}
                      // Off: the ring is the readout, and spinning it up means
                      // the first thing anyone sees is the wrong shape.
                      isAnimationActive={false}
                      // recharts 3 tracks the hovered segment itself, so there
                      // is no index to hand it — `activeSlice` below is only
                      // for the centre readout and the key rows.
                      activeShape={RaisedSlice}
                      onMouseEnter={(_, i) => setActiveSlice(i)}
                    >
                      {statusSplit.map((slice) => (
                        <Cell key={slice.name} fill={slice.token} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/*
                    The hole is the readout.

                    A tooltip floating beside the ring covers the slice next to
                    the one being read; here the answer appears in the space the
                    donut already leaves, and resting nowhere leaves the total.
                */}
                <div className="tr-split__centre">
                  {active ? (
                    <>
                      <b style={{ color: active.token }}>{active.pct}%</b>
                      <span>
                        {active.value} {active.name.toLowerCase()}
                      </span>
                    </>
                  ) : (
                    <>
                      <b>{totals.tasks_worked}</b>
                      <span>tasks</span>
                    </>
                  )}
                </div>
              </div>

              {/*
                  Every value is written out here.

                  Amber and green are ~dE 7 apart for a deuteranope, which is the
                  band where colour alone is not enough. These rows are the relief:
                  the split is readable straight off the numbers, and the swatch
                  only confirms which arc is which.
              */}
              <ul className="tr-split__keys">
                {statusSplit.map((slice, i) => (
                  <li
                    key={slice.name}
                    className={activeSlice === i ? "is-on" : undefined}
                    // Hovering a row lifts its arc and the reverse: two ways
                    // into one slice, and the row is the bigger hit target.
                    onMouseEnter={() => setActiveSlice(i)}
                    onMouseLeave={() => setActiveSlice(null)}
                  >
                    <span className="tr-split__row">
                      <span className="tr-split__dot" style={{ backgroundColor: slice.token }} />
                      <span className="tr-split__name">{slice.name}</span>
                      <b className="tr-split__n">{slice.value}</b>
                      <span className="tr-split__pct">{slice.pct}%</span>
                    </span>
                    {/* The same proportion as the arc, on a straight scale —
                        lengths compare accurately where angles do not. */}
                    <span className="tr-split__bar">
                      <span style={{ width: slice.pct + "%", backgroundColor: slice.token }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* ─── Per-member breakdown, team scope only ─── */}
      {scope === "team" && (
        <section className="tr-card tr-members">
          <div className="tr-card__head">
            <span className="tr-card__icon"><FiUsers size={17} /></span>
            <div className="tr-card__titles">
              <h3 className="tr-card__title">By Member</h3>
              <p className="tr-card__note">
                {memberCount} member{memberCount === 1 ? "" : "s"}, most time logged first.
              </p>
            </div>
          </div>

          <div className="tr-table-wrap">
            <table className="tr-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Tasks Worked</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>Pending</th>
                  <th>Completion</th>
                  <th>Time Spent</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr>
                    <td colSpan={7} className="tr-table__empty">No members in this period</td>
                  </tr>
                )}
                {members.map((m) => (
                  <tr key={m.user.id}>
                    <td>{m.user.fullName}</td>
                    <td>{m.tasks_worked}</td>
                    <td>{m.completed}</td>
                    <td>{m.in_progress}</td>
                    <td>{m.pending}</td>
                    <td>{m.completion_rate}%</td>
                    <td>{fmtDuration(m.total_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="tr-bottom">
        {/* ─── Activity ─── */}
        <section className="tr-card">
          <div className="tr-card__head">
            <span className="tr-card__icon"><FiClock size={17} /></span>
            <h3 className="tr-card__title">Recent Activity</h3>
          </div>

          <div className="tr-table-wrap">
            <table className="tr-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tasks Worked</th>
                  <th>Completed</th>
                  <th>Time Spent</th>
                  <th>Productivity</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 && (
                  <tr>
                    <td colSpan={5} className="tr-table__empty">No activity in this period</td>
                  </tr>
                )}
                {activity.map((d, i) => (
                  // Past the eighth the rows are print-only: on screen the card
                  // would run past the one beside it, on paper there is room.
                  <tr
                    key={d.date}
                    className={i >= SCREEN_ROWS ? "tr-row--print" : undefined}
                  >
                    <td>{fmtDayLong(d.date)}</td>
                    <td>{d.tasks_worked}</td>
                    <td>{d.completed}</td>
                    <td>{fmtDuration(d.total_seconds)}</td>
                    <td>{d.productivity}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
