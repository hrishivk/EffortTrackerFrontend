import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dialog from "@mui/material/Dialog";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import LowPriorityRoundedIcon from "@mui/icons-material/LowPriorityRounded";

import type { taskList } from "../../user/types";
import { toLocalDate } from "../../../shared/utils/taskStatus";
import { isTaskRunning } from "../../../shared/utils/taskTime";
import {
  assigneeIdOf,
  assigneeOf,
  blockedReason,
  completeBlockedReason,
} from "../../../shared/utils/subtasks";
import { STATUS_ACCENT, PRIORITY_STYLE } from "./boardConstants";
import TaskTimer from "./TaskTimer";
import TaskComments from "./TaskComments";

/**
 * One spring for the whole tab strip, so the pill, the tap and the icon pop all
 * move together. Same values as the List / Board / Gantt toggle — these tabs do
 * the same job, so they should feel like the same control.
 */
const TAB_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

/**
 * The cascade as a list lands. Capped at six rows: past that the delay stops
 * reading as sequence and starts reading as lag, so everything below simply
 * arrives with the sixth.
 */
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: "easeOut" as const, delay: Math.min(i, 6) * 0.035 },
});

const normalize = (v?: string | null) =>
  (v || "").toLowerCase().replace(/[\s-]+/g, "_");

const STATUS_LABEL: Record<string, string> = {
  yet_to_start: "Not Started",
  pending: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  done: "Completed",
  blocked: "Blocked",
};

const statusFace = (status?: string | null) => {
  const s = normalize(status);
  const accent = STATUS_ACCENT[s] ?? "#6b7280";
  return {
    label: STATUS_LABEL[s] ?? (s ? s.replace(/_/g, " ") : "—"),
    color: accent,
    bg: `${accent}1f`,
  };
};

const projectName = (project: taskList["project"] | undefined) =>
  typeof project === "object" && project !== null ? project.name : String(project || "");

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const showDate = (v?: string | null) => {
  const d = toLocalDate(v);
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "--";
};

/** "Apr 16" — the compact form used on a card. */
const showShort = (v?: string | null) => {
  const d = toLocalDate(v);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : null;
};

const showTime = (v?: string | null) => {
  const d = toLocalDate(v);
  return d ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--";
};

const showStamp = (v?: string | null) => {
  const d = toLocalDate(v);
  return d
    ? `${d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
    : "--";
};

/**
 * What actually happened to this task, derived from its own timestamps.
 *
 * There is no activity endpoint, so nothing here is invented — creation comes
 * from `created_at` + `creator`, and a start or finish entry only appears once
 * the matching timestamp exists. Each subtask contributes its own two, so the
 * tab reads as the story of the whole task rather than just the parent's.
 */
const buildActivity = (task: taskList) => {
  const events: { at: string; title: string; by: string; tone: string }[] = [];
  const creator = task.dailyLog?.creator?.fullName || "—";

  if (task.created_at)
    events.push({ at: task.created_at, title: "Task created", by: creator, tone: "#7c3aed" });

  const add = (row: taskList, label: string) => {
    const who = assigneeOf(row)?.fullName || creator;
    if (row.start_time)
      events.push({
        at: row.start_time,
        title: `${label} started`,
        by: who,
        tone: STATUS_ACCENT.in_progress,
      });
    if (row.end_time && normalize(row.status) === "completed")
      events.push({
        at: row.end_time,
        title: `${label} completed`,
        by: who,
        tone: STATUS_ACCENT.completed,
      });
  };

  add(task, "Main task");
  (task.subtasks ?? []).forEach((sub) => add(sub, `“${sub.description}”`));

  return events.sort((a, b) => (a.at < b.at ? -1 : 1));
};

/**
 * Progress as one block per piece of work, rather than an arc.
 *
 * The donut this replaces drew a single number — the completion percentage —
 * and left the split between the three states to the legend beside it. Two
 * graphics for one fact, and at the counts this actually runs at ("2 of 2") an
 * arc says less than the numbers under it do.
 *
 * A block per subtask says the same thing and more: how many pieces there are,
 * which of them are done, and which one is currently moving. Blocks share the
 * width equally, so it stays a readable bar whether the task has two children
 * or twenty.
 */
function ProgressTrack({ units }: { units: { status: string; label: string }[] }) {
  return (
    <div
      className="tdp__track"
      role="img"
      aria-label={units.map((u) => `${u.label}: ${u.status}`).join(", ")}
    >
      {units.map((u, i) => (
        <span
          key={i}
          className="tdp__track-seg"
          title={`${u.label} — ${STATUS_LABEL[u.status] ?? u.status}`}
          style={{ backgroundColor: STATUS_ACCENT[u.status] ?? "var(--bg-hover)" }}
        />
      ))}
    </div>
  );
}

interface TaskDetailPanelProps {
  task: taskList | null;
  open: boolean;
  onClose: () => void;
  /** False when the viewer does not own the parent — its own row is read-only. */
  owns: boolean;
  /**
   * The viewer. On a shared task each subtask has an owner of its own, so who
   * may act is decided per row: three people can be looking at this panel and
   * each of them may act on exactly one of the cards in it.
   */
  currentUserId?: string | number | null;
  /** Ids with a request in flight. */
  busy: Record<string, boolean>;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  /** Comment writes. Each resolves once the API has saved and the list reloaded. */
  onCommentAdd?: (taskId: string, body: string) => Promise<void>;
  onCommentEdit?: (taskId: string, commentId: string, body: string) => Promise<void>;
  onCommentDelete?: (taskId: string, commentId: string) => Promise<void>;
  projectColorMap: Record<string, { bg: string; text: string }>;
}

type TabKey = "details" | "subtasks" | "activity";

export default function TaskDetailPanel({
  task,
  open,
  onClose,
  owns,
  currentUserId,
  busy,
  onStart,
  onComplete,
  onCommentAdd,
  onCommentEdit,
  onCommentDelete,
  projectColorMap,
}: TaskDetailPanelProps) {
  const [tab, setTab] = useState<TabKey>("subtasks");
  /** Nested grandchildren, expanded per card. */
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  /** Which cards have their comment thread showing. */
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});

  const subs = useMemo(() => task?.subtasks ?? [], [task]);

  useEffect(() => {
    if (!open) return;
    // A task with children opens on them; one without has nothing there to see.
    setTab(subs.length ? "subtasks" : "details");
    setOpenRows({});
    setOpenThreads({});
  }, [open, task?.id, subs.length]);

  /**
   * Everyone holding a piece of this, with their own tally. Built from the
   * children already in hand — the parent's owner leads, then whoever holds a
   * subtask. Nothing is fetched.
   */
  const team = useMemo(() => {
    const byId = new Map<
      string,
      { id: string; name: string; done: number; total: number; owner: boolean }
    >();

    const seed = (who: { id: string; fullName: string } | null, owner: boolean) => {
      if (!who) return null;
      const id = String(who.id);
      if (!byId.has(id)) byId.set(id, { id, name: who.fullName, done: 0, total: 0, owner });
      return byId.get(id)!;
    };

    seed(assigneeOf(task ?? undefined), true);
    for (const sub of subs) {
      const row = seed(assigneeOf(sub), false);
      if (!row) continue;
      row.total += 1;
      if (normalize(sub.status) === "completed") row.done += 1;
    }

    return [...byId.values()].sort(
      (a, b) => Number(b.owner) - Number(a.owner) || b.done - a.done
    );
  }, [task, subs]);

  /** One entry per piece of work, for the track and its legend. */
  const tally = useMemo(() => {
    const counts = { completed: 0, in_progress: 0, pending: 0 };
    const bucket = (status?: string | null) => {
      const s = normalize(status);
      if (s === "completed" || s === "done") counts.completed += 1;
      else if (s === "in_progress") counts.in_progress += 1;
      else counts.pending += 1;
    };
    // With no children the task is the only unit of work there is to report on.
    if (subs.length) subs.forEach((s) => bucket(s.status));
    else if (task) bucket(task.status);
    return counts;
  }, [subs, task]);

  /** The blocks themselves, in the order the work is listed. */
  const units = useMemo(() => {
    const one = (row: taskList) => {
      const s = normalize(row.status);
      const key =
        s === "done" ? "completed" : s === "pending" ? "yet_to_start" : s;
      return { status: key, label: row.description ?? "" };
    };
    if (subs.length) return subs.map(one);
    return task ? [one(task)] : [];
  }, [subs, task]);

  if (!task) return null;

  const face = statusFace(task.status);
  const prio = PRIORITY_STYLE[(task.priority || "").toUpperCase()];
  const projName = projectName(task.project);
  const projColor = projectColorMap[projName] ?? { bg: "#ede9fe", text: "#7c3aed" };
  const activity = buildActivity(task);

  const total = tally.completed + tally.in_progress + tally.pending;
  const percent = total ? Math.round((tally.completed / total) * 100) : 0;

  const canComment = !!onCommentAdd && !!onCommentEdit && !!onCommentDelete;

  const commentBox = (row: taskList) => (
    <TaskComments
      dense
      taskId={String(row.id)}
      comments={row.comments}
      commentCount={row.comment_count}
      currentUserId={currentUserId}
      taskCreatedBy={row.created_by ?? task.created_by}
      onAdd={onCommentAdd!}
      onEdit={onCommentEdit!}
      onDelete={onCommentDelete!}
    />
  );

  /**
   * The one control a row offers next.
   *
   * Ownership is the row's own, not the parent's: on a shared task all three
   * members see all three subtasks and each may act on exactly one. A row with
   * no assignee of its own falls back to the parent's answer, which is how a
   * plain single-owner task keeps behaving as it always did.
   */
  const action = (row: taskList, isMain: boolean) => {
    const st = normalize(row.status);
    const id = String(row.id);
    const working = !!busy[id];
    const rowAssigneeId = assigneeIdOf(row);
    const rowOwns = rowAssigneeId ? rowAssigneeId === String(currentUserId ?? "") : owns;
    const blocked = blockedReason(row);

    if (st === "completed" || st === "done") {
      return (
        <span className="tdp__done" title="Completed">
          <CheckRoundedIcon sx={{ fontSize: 15 }} />
        </span>
      );
    }

    // Ahead of the Start branch: a blocked subtask is still "not started", and
    // offering the button there is the click the server's 409 exists to catch.
    if (blocked) {
      return (
        <span className="tdp__wait" title={blocked}>
          <HourglassEmptyRoundedIcon sx={{ fontSize: 13 }} />
          Waiting
        </span>
      );
    }

    if (!rowOwns) return null;

    if (st === "in_progress") {
      /*
       * A task is not finished while a piece of it is outstanding. Its own
       * clock still runs and its Start was always its own — this only stops it
       * being marked done ahead of its children, which is what put a DONE badge
       * next to "1/2" on the list.
       */
      const early = completeBlockedReason(row);
      if (early) {
        return (
          <span className="tdp__wait" title={`Can't complete yet — ${early}`}>
            <HourglassEmptyRoundedIcon sx={{ fontSize: 13 }} />
            {early}
          </span>
        );
      }

      return (
        <button
          type="button"
          className="tdp__stop"
          title={isMain ? "Complete this task" : "Complete this subtask"}
          disabled={working}
          onClick={() => onComplete(id)}
        >
          {working ? (
            <CircularProgress size={11} sx={{ color: "inherit" }} />
          ) : (
            <StopRoundedIcon sx={{ fontSize: 15 }} />
          )}
          Complete
        </button>
      );
    }

    return (
      <button
        type="button"
        className="tdp__play"
        title={isMain ? "Start this task" : "Start this subtask"}
        disabled={working}
        onClick={() => onStart(id)}
      >
        {working ? (
          <CircularProgress size={12} sx={{ color: "inherit" }} />
        ) : (
          <PlayArrowRoundedIcon sx={{ fontSize: 17 }} />
        )}
      </button>
    );
  };

  /** The status mark down the left of a card. */
  const mark = (status?: string | null) => {
    const s = normalize(status);
    if (s === "completed" || s === "done")
      return <CheckCircleIcon sx={{ fontSize: 21, color: STATUS_ACCENT.completed }} />;
    if (s === "in_progress")
      return (
        <PlayCircleFilledRoundedIcon sx={{ fontSize: 21, color: STATUS_ACCENT.in_progress }} />
      );
    return <RadioButtonUncheckedIcon sx={{ fontSize: 21, color: "var(--text-faint)" }} />;
  };

  /**
   * One card, plus any grandchildren indented under it.
   *
   * `isMain` draws the task itself as the first card. It has a start, a finish
   * and a clock of its own, so it is shown and acted on exactly like the cards
   * beneath it — which is the point: those are the team's pieces, this is the
   * task's.
   */
  const renderCard = (row: taskList, isMain = false): React.ReactElement => {
    const id = String(row.id);
    const kids = row.subtasks ?? [];
    // Collapsed only if someone has closed it: a tree that opens shut hides the
    // thing the panel exists to show.
    const expanded = openRows[id] !== false;
    const rowFace = statusFace(row.status);
    const rowPrio = PRIORITY_STYLE[(row.priority || "").toUpperCase()];
    const who = assigneeOf(row);
    const threadOpen = !!openThreads[id];
    const threadCount = row.comment_count ?? row.comments?.length ?? 0;
    const from = showShort(row.start_date ?? row.start_time);
    const to = showShort(row.due_date ?? row.end_time);
    const running = isTaskRunning(row);

    return (
      <div key={id} className={`tdp__card${isMain ? " tdp__card--main" : ""}`}>
        <div className="tdp__card-main">
          {kids.length > 0 ? (
            <button
              type="button"
              className="tdp__twisty"
              title={expanded ? `Collapse ${kids.length} subtasks` : `Expand ${kids.length} subtasks`}
              onClick={() => setOpenRows((o) => ({ ...o, [id]: !expanded }))}
            >
              {expanded ? (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              )}
            </button>
          ) : (
            <span className="tdp__twisty tdp__twisty--gap" />
          )}

          <span className="tdp__mark">{mark(row.status)}</span>

          <div className="tdp__card-body">
            <div className="tdp__card-title-row">
              {isMain && <span className="tdp__main-tag">Main task</span>}
              <span className="tdp__card-title" title={row.description}>
                {row.description}
              </span>
            </div>

            <div className="tdp__card-chips">
              {rowPrio && (
                <span
                  className="tdp__chip"
                  style={{ backgroundColor: rowPrio.bg, color: rowPrio.color }}
                >
                  {(row.priority || "").toUpperCase()}
                </span>
              )}
              {(row.tags ?? []).slice(0, 2).map((t) => (
                <span key={t} className="tdp__chip tdp__chip--tag">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="tdp__card-right">
            {who ? (
              <span className="tdp__who-avatar" title={who.fullName}>
                {initialsOf(who.fullName)}
              </span>
            ) : (
              <span className="tdp__who-avatar tdp__who-avatar--none" title="Unassigned">
                <PersonOutlineIcon sx={{ fontSize: 13 }} />
              </span>
            )}

            <span
              className="tdp__chip"
              style={{ backgroundColor: rowFace.bg, color: rowFace.color }}
            >
              {running && <span className="task-running-dot" />}
              {rowFace.label}
            </span>

            {canComment && (
              <button
                type="button"
                className={`tdp__comment-btn${threadOpen ? " tdp__comment-btn--on" : ""}`}
                title={
                  threadCount
                    ? `${threadCount} comment${threadCount === 1 ? "" : "s"}`
                    : "Comment on this"
                }
                onClick={() => setOpenThreads((o) => ({ ...o, [id]: !threadOpen }))}
              >
                <ChatBubbleOutlineIcon sx={{ fontSize: 12 }} />
                {threadCount > 0 && threadCount}
              </button>
            )}

            {action(row, isMain)}
          </div>
        </div>

        {/* The dates and the clock, on their own line so the title above is
            never squeezed by them. */}
        <div className="tdp__card-meta">
          {from && (
            <span title="Start date">
              <CalendarTodayOutlinedIcon sx={{ fontSize: 12 }} />
              {from}
            </span>
          )}
          {to && (
            <span title="Due date">
              <CalendarTodayOutlinedIcon sx={{ fontSize: 12 }} />
              {to}
            </span>
          )}
          <span className="tdp__card-clock">
            {/* Its own clock — starting a subtask times the subtask, and leaves
                the task it belongs to alone. */}
            <TaskTimer
              dense
              status={row.status}
              startTime={row.start_time}
              endTime={row.end_time}
              totalSeconds={row.total_seconds}
            />
          </span>
          {row.blocked_by && (
            <span className="tdp__card-waits" title={blockedReason(row) ?? undefined}>
              <LowPriorityRoundedIcon sx={{ fontSize: 12 }} />
              after &ldquo;{row.blocked_by.description}&rdquo;
            </span>
          )}
        </div>

        {canComment && threadOpen && (
          <div className="tdp__card-thread">{commentBox(row)}</div>
        )}

        {expanded && kids.length > 0 && (
          <div className="tdp__card-kids">
            {kids.map((kid, i) => (
              <motion.div key={String(kid.id)} {...stagger(i)} style={{ minWidth: 0 }}>
                {renderCard(kid)}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const facts: { icon: React.ElementType; label: string; value: React.ReactNode }[] = [
    { icon: CalendarTodayOutlinedIcon, label: "Due Date", value: showDate(task.due_date) },
    { icon: CalendarTodayOutlinedIcon, label: "Start Date", value: showDate(task.start_date) },
    {
      icon: FlagOutlinedIcon,
      label: "Priority",
      value: prio ? (
        <span className="tdp__chip" style={{ backgroundColor: prio.bg, color: prio.color }}>
          {(task.priority || "").toUpperCase()}
        </span>
      ) : (
        "--"
      ),
    },
    {
      icon: PersonOutlineIcon,
      label: "Assignee",
      value: assigneeOf(task)?.fullName ?? "Unassigned",
    },
    { icon: FolderOutlinedIcon, label: "Project", value: projName || "--" },
  ];

  if (task.tags?.length) {
    facts.push({
      icon: LocalOfferOutlinedIcon,
      label: "Labels",
      value: (
        <span className="tdp__fact-tags">
          {task.tags.map((t) => (
            <span key={t} className="tdp__chip tdp__chip--tag">
              {t}
            </span>
          ))}
        </span>
      ),
    });
  }

  const TABS: { key: TabKey; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "details", label: "Details", icon: ArticleOutlinedIcon },
    {
      key: "subtasks",
      label: "Subtasks",
      icon: AccountTreeOutlinedIcon,
      count: task.subtask_count ?? subs.length,
    },
    { key: "activity", label: "Activity", icon: TimelineIcon },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: "calc(100% - 48px)",
            maxWidth: 1420,
            margin: "24px",
            borderRadius: 4,
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)",
          },
        },
      }}
    >
      <div className="tdp">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="tdp__top">
          <span className="tdp__top-badge">
            <AccountTreeOutlinedIcon sx={{ fontSize: 21 }} />
          </span>

          <div className="tdp__top-text">
            <div className="tdp__top-title-row">
              <h3 className="tdp__top-title" title={task.description}>
                {task.description}
              </h3>
              <span className="tdp__chip" style={{ backgroundColor: face.bg, color: face.color }}>
                {isTaskRunning(task) && <span className="task-running-dot" />}
                {face.label}
              </span>
              {task.sequential && (
                <span
                  className="tdp__chip tdp__chip--seq"
                  title="Each subtask starts only once the one before it is completed"
                >
                  <LowPriorityRoundedIcon sx={{ fontSize: 12 }} />
                  In order
                </span>
              )}
            </div>
            <p className="tdp__top-sub">
              {[projName, `${tally.completed} of ${total} done`].filter(Boolean).join("  ·  ")}
            </p>
          </div>

          <div className="tdp__stack" title={team.map((m) => m.name).join(", ")}>
            {team.slice(0, 4).map((m) => (
              <span key={m.id} className="tdp__stack-avatar">
                {initialsOf(m.name)}
              </span>
            ))}
            {team.length > 4 && (
              <span className="tdp__stack-avatar tdp__stack-avatar--more">
                +{team.length - 4}
              </span>
            )}
          </div>

          <button type="button" className="tdp__icon-btn" onClick={onClose} title="Close">
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        {/* ── Three columns ──────────────────────────────────── */}
        <div className="tdp__grid">
          {/* Left rail — what the task is */}
          <aside className="tdp__rail">
            <div className="tdp__idcard">
              <div className="tdp__idcard-head">
                <span className="tdp__idcard-badge">
                  <AccountTreeOutlinedIcon sx={{ fontSize: 17 }} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <p className="tdp__idcard-name" title={task.description}>
                    {task.description}
                  </p>
                  <span
                    className="tdp__chip"
                    style={{ backgroundColor: face.bg, color: face.color }}
                  >
                    {face.label}
                  </span>
                </span>
              </div>

              <div className="tdp__idcard-progress">
                <span>Progress</span>
                <strong>{percent}%</strong>
              </div>
              <span className="tdp__bar">
                <span className="tdp__bar-fill" style={{ width: `${percent}%` }} />
              </span>
            </div>

            <div className="tdp__facts">
              {facts.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="tdp__fact">
                    <span className="tdp__fact-icon">
                      <Icon sx={{ fontSize: 16 }} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <p className="tdp__fact-label">{f.label}</p>
                      <p className="tdp__fact-value">{f.value}</p>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* The task's own clock and its own two actions. Separate from the
                subtasks' by design: starting a child times the child. */}
            <div className="tdp__timer">
              <TimerOutlinedIcon sx={{ fontSize: 19, color: "#7c3aed" }} />
              <p className="tdp__timer-title">Time on this task</p>
              <p className="tdp__timer-note">
                Tracked on the main task alone — each subtask keeps its own.
              </p>
              <div className="tdp__timer-clock">
                <TaskTimer
                  status={task.status}
                  startTime={task.start_time}
                  endTime={task.end_time}
                  totalSeconds={task.total_seconds}
                />
              </div>
              <div className="tdp__timer-action">{action(task, true)}</div>
            </div>
          </aside>

          {/* Centre — the work */}
          <main className="tdp__centre">
            <div className="tdp__tabs">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <motion.button
                    key={t.key}
                    type="button"
                    className={`tdp__tab${active ? " tdp__tab--on" : ""}`}
                    onClick={() => setTab(t.key)}
                    whileTap={{ scale: 0.94 }}
                    transition={TAB_SPRING}
                  >
                    {/* One element shared across the tabs, so framer slides it
                        from the old tab to the new one rather than fading two. */}
                    {active && (
                      <motion.span
                        layoutId="taskDetailTabPill"
                        transition={TAB_SPRING}
                        className="tdp__tab-pill"
                      />
                    )}
                    <motion.span
                      animate={{ scale: active ? 1.12 : 1 }}
                      transition={TAB_SPRING}
                      style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
                    >
                      <Icon sx={{ fontSize: 15 }} />
                    </motion.span>
                    <span style={{ position: "relative", zIndex: 1 }}>
                      {t.label}
                      {t.count !== undefined && ` (${t.count})`}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{ minWidth: 0 }}
              >
            {tab === "subtasks" && (
              <div className="tdp__panel">
                <div className="tdp__panel-head">
                  <AccountTreeOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                  <h4 className="tdp__panel-title">
                    Work ({(task.subtask_count ?? subs.length) + 1})
                  </h4>
                </div>

                {/*
                 * A tree, not a flat list. The main task is the root and its
                 * subtasks hang off it — which is what they are. Listing all of
                 * them as siblings said the opposite: that the task and its
                 * pieces were four equal things.
                 */}
                <div className="tdp__cards">
                  <motion.div {...stagger(0)} style={{ minWidth: 0 }}>
                    {renderCard(task, true)}
                  </motion.div>
                </div>

                {subs.length === 0 && (
                  <p className="tdp__note">No subtasks — this task is tracked on its own.</p>
                )}
              </div>
            )}

            {tab === "details" && (
              <div className="tdp__panel">
                <div className="tdp__panel-head">
                  <ArticleOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                  <h4 className="tdp__panel-title">Details</h4>
                </div>

                {/*
                 * `description` is this API's task *name* — there is no separate
                 * long-form field, so there is no body text to render here and
                 * repeating the title would be noise. The real facts go instead.
                 * A `details` column is already asked for in
                 * docs/create-task-fields.md; when it lands, it belongs here.
                 */}
                <div className="tdp__detail-grid">
                  {[
                    { label: "Created", value: showStamp(task.created_at) },
                    { label: "Created by", value: task.dailyLog?.creator?.fullName || "--" },
                    { label: "Started", value: showTime(task.start_time) },
                    { label: "Finished", value: showTime(task.end_time) },
                    { label: "Start date", value: showDate(task.start_date) },
                    { label: "Due date", value: showDate(task.due_date) },
                    {
                      label: "Subtask order",
                      value: task.sequential
                        ? "Sequential — each waits for the one before"
                        : "Parallel — any of them can start",
                    },
                    {
                      label: "Project",
                      value: projName ? (
                        <span
                          className="tdp__chip"
                          style={{
                            backgroundColor: projColor.bg,
                            color: projColor.text,
                            fontWeight: 600,
                          }}
                        >
                          {projName}
                        </span>
                      ) : (
                        "--"
                      ),
                    },
                  ].map((d, i) => (
                    <motion.div key={d.label} className="tdp__detail" {...stagger(i)}>
                      <p className="tdp__fact-label">{d.label}</p>
                      <p className="tdp__fact-value">{d.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {tab === "activity" && (
              <div className="tdp__panel">
                <div className="tdp__panel-head">
                  <TimelineIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                  <h4 className="tdp__panel-title">Activity</h4>
                </div>
                {activity.length === 0 ? (
                  <p className="tdp__note">Nothing has happened on this task yet.</p>
                ) : (
                  <ul className="tdp__activity">
                    {activity.map((e, i) => (
                      <motion.li key={i} className="tdp__event" {...stagger(i)}>
                        <span className="tdp__event-icon" style={{ backgroundColor: e.tone }} />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <p className="tdp__event-title">{e.title}</p>
                          <p className="tdp__event-when">{showStamp(e.at)}</p>
                        </span>
                        <span className="tdp__event-by">by {e.by}</span>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Right rail — who, how far, and the conversation */}
          <aside className="tdp__side">
            <div className="tdp__panel">
              <div className="tdp__panel-head">
                <GroupsOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                <h4 className="tdp__panel-title">On this task ({team.length})</h4>
              </div>
              {team.length === 0 ? (
                <p className="tdp__note">Nobody is assigned yet.</p>
              ) : (
                <ul className="tdp__team">
                  {team.map((m) => (
                    <li key={m.id} className="tdp__team-row">
                      <span className="tdp__who-avatar">{initialsOf(m.name)}</span>
                      <span className="tdp__team-name" title={m.name}>
                        {m.name}
                        {m.owner && <span className="tdp__team-owner">owner</span>}
                      </span>
                      {m.total > 0 && (
                        <span
                          className="tdp__team-count"
                          title={`${m.done} of ${m.total} of their subtasks done`}
                        >
                          {m.done}/{m.total}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="tdp__panel">
              <div className="tdp__panel-head">
                <BarChartRoundedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                <h4 className="tdp__panel-title">Progress</h4>
              </div>
              <div className="tdp__progress">
                <div className="tdp__progress-top">
                  <span className="tdp__progress-count">
                    {tally.completed} of {total} done
                  </span>
                  <strong className="tdp__progress-pct">{percent}%</strong>
                </div>

                <ProgressTrack units={units} />

                {/* The counts, inline under the track rather than stacked beside
                    it — three short numbers do not need a column of their own. */}
                <ul className="tdp__legend">
                  {[
                    { label: "Completed", n: tally.completed, color: STATUS_ACCENT.completed },
                    {
                      label: "In Progress",
                      n: tally.in_progress,
                      color: STATUS_ACCENT.in_progress,
                    },
                    { label: "Pending", n: tally.pending, color: STATUS_ACCENT.yet_to_start },
                  ].map((l) => (
                    <li key={l.label}>
                      <span className="tdp__legend-dot" style={{ backgroundColor: l.color }} />
                      <span className="tdp__legend-name">{l.label}</span>
                      <span className="tdp__legend-n">{l.n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </Dialog>
  );
}
