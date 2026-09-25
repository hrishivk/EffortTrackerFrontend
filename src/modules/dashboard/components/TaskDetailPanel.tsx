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
import LowPriorityRoundedIcon from "@mui/icons-material/LowPriorityRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import type {
  taskList,
  TaskEditFields,
  AddSubtaskInput,
} from "../../user/types";
import { toDateValue, toLocalDate } from "../../../shared/utils/taskStatus";
import { isTaskRunning } from "../../../shared/utils/taskTime";
import {
  assigneeIdOf,
  assigneeOf,
} from "../../../shared/utils/subtasks";
import { STATUS_ACCENT, PRIORITY_STYLE } from "./boardConstants";
import TaskTimer from "./TaskTimer";
import TaskComments from "./TaskComments";
import TaskEditForm, { AddSubtasksForm } from "./TaskEditForm";
import type { SubtaskAssignee } from "./CreateTaskModal";
import Dialoge from "../../../presentation/Dialog";
import ExtendTaskDialog from "./ExtendTaskDialog";

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
  const events: {
    at: string;
    title: string;
    by: string;
    tone: string;
    /** Why a deadline moved. Only an extension carries one. */
    note?: string;
  }[] = [];
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

  /**
   * Every push of a deadline, with the reason given for it.
   *
   * These are the only entries here that were recorded rather than inferred —
   * the rest are read off timestamps the task happens to carry. A push with no
   * previous date is a deadline being set, not moved, and says so.
   */
  const pushes = (row: taskList, label: string) =>
    (row.extensions ?? []).forEach((ext) =>
      events.push({
        at: ext.created_at,
        title: ext.previous_due_date
          ? `${label} extended · ${showShort(ext.previous_due_date)} → ${showShort(ext.new_due_date)}`
          : `${label} due date set · ${showShort(ext.new_due_date)}`,
        by: ext.extendedBy?.fullName || "Somebody since removed",
        tone: "#d97706",
        note: ext.reason,
      })
    );

  add(task, "Main task");
  pushes(task, "Main task");
  (task.subtasks ?? []).forEach((sub) => {
    add(sub, `“${sub.description}”`);
    pushes(sub, `“${sub.description}”`);
  });

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
  /**
   * Save an edit to one row — the task itself or any of its subtasks. Rejects
   * when the API refuses, which is what keeps the form open with the typing
   * still in it rather than throwing the edit away.
   *
   * Omitted, no row offers an edit control at all.
   */
  onTaskEdit?: (taskId: string, fields: TaskEditFields) => Promise<void>;
  /**
   * Add children to this task — several at a time, in the order given, and
   * `sequential` alongside them when the composer's order toggle was changed.
   *
   * Resolves with how many rows were actually taken: each subtask is its own
   * request, so a run can stop half way, and the composer keeps what is left.
   *
   * Omitted, the Add subtask control is hidden.
   */
  onSubtaskAdd?: (
    parentId: string,
    rows: AddSubtaskInput[],
    sequential?: boolean
  ) => Promise<number>;
  /**
   * Delete one row — this task, or one of its subtasks. Rejects when the API
   * refuses; the caller reports it.
   *
   * Deleting the task the panel is about closes the panel, since there is
   * nothing left for it to show.
   */
  onTaskDelete?: (taskId: string) => Promise<void>;
  /**
   * Whether this viewer may delete that row. Narrower than editing it — being
   * able to see a task on a room board deliberately does not mean being able to
   * destroy it — so it is decided by the caller, which knows the viewer's role.
   */
  canDelete?: (row: taskList) => boolean;
  /**
   * Push one row's deadline out, with a reason. Rejects when the API refuses,
   * which keeps the dialog open with what was typed still in it.
   *
   * Omitted, no row offers the control.
   */
  onTaskExtend?: (
    taskId: string,
    input: { due_date: string; reason: string }
  ) => Promise<void>;
  /**
   * The tab to open on. Omitted, the panel opens on the work — but something
   * that asked a specific question ("why has this slipped?") should land on
   * the answer rather than make the reader go looking for it.
   */
  initialTab?: TabKey;
  /** The room's roster, so a new subtask can be handed to one of them. */
  roomMembers?: SubtaskAssignee[];
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
  onTaskEdit,
  onSubtaskAdd,
  onTaskDelete,
  onTaskExtend,
  canDelete,
  initialTab,
  roomMembers = [],
  projectColorMap,
}: TaskDetailPanelProps) {
  const [tab, setTab] = useState<TabKey>("subtasks");
  /** Nested grandchildren, expanded per card. */
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  /** Which cards have their comment thread showing. */
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});
  /** The one row being edited. One at a time, task or subtask. */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** The composer for a new child, under the list it will join. */
  const [addingChild, setAddingChild] = useState(false);
  /** A save or an add in flight. Either way only one form is open. */
  const [saving, setSaving] = useState(false);
  /** The row a delete has been asked for, held until it is confirmed. */
  const [pendingDelete, setPendingDelete] = useState<taskList | null>(null);
  /** The row whose deadline is being pushed. */
  const [extending, setExtending] = useState<taskList | null>(null);

  const subs = useMemo(() => task?.subtasks ?? [], [task]);

  useEffect(() => {
    if (!open) return;
    // The work is what the panel is for — its pieces if it has any, and if it
    // has none, the one card plus the control that breaks it into some. Unless
    // whoever opened it was asking something else.
    setTab(initialTab ?? "subtasks");
    setOpenRows({});
    setOpenThreads({});
    // A form left open would reopen against whatever task is shown next.
    setEditingId(null);
    setAddingChild(false);
    setPendingDelete(null);
    setExtending(null);
    // `initialTab` is read at open; changing it later must not yank the reader
    // off the tab they have since chosen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const me = String(currentUserId ?? "");
  const creatorId = String(task.created_by ?? task.dailyLog?.created_by ?? "");

  /**
   * Who may change a row.
   *
   * Whoever holds it, and whoever raised the task — a manager who created work
   * for somebody else still has to be able to correct its dates or its wording.
   * Ownership is read per row, exactly as the start/complete control is: on a
   * shared task three people see the same panel and each holds one card.
   *
   * The server enforces this too; this only decides whether to offer the
   * control, so a refusal still arrives as a message rather than a surprise.
   */
  const mayEdit = (row: taskList): boolean => {
    if (!onTaskEdit || !me) return false;
    const who = assigneeIdOf(row);
    if (who) return who === me || creatorId === me;
    return creatorId ? creatorId === me : owns;
  };

  /**
   * Both writes swallow the rejection on purpose: the caller has already put
   * the API's message on screen, and what matters here is that the form stays
   * open with the typing in it so it can be fixed and sent again.
   */
  const saveEdit = async (rowId: string, fields: TaskEditFields) => {
    if (!onTaskEdit) return;
    setSaving(true);
    try {
      await onTaskEdit(rowId, fields);
      setEditingId(null);
    } catch {
      /* reported by the caller — leave the form standing */
    } finally {
      setSaving(false);
    }
  };

  const pushDeadline = async (input: { due_date: string; reason: string }) => {
    if (!onTaskExtend || !extending) return;
    setSaving(true);
    try {
      await onTaskExtend(String(extending.id), input);
      setExtending(null);
    } catch {
      /* reported by the caller — leave the dialog standing */
    } finally {
      setSaving(false);
    }
  };

  /**
   * What is actually about to be destroyed, said plainly.
   *
   * A main task takes its children with it, and the hours banked on all of them
   * — which the reports read from the same rows — so the prompt names the task
   * and counts what goes with it rather than asking "are you sure?".
   */
  const deletePrompt = (row: taskList | null): string => {
    if (!row) return "";
    const name = `“${row.description}”`;
    if (row.parent_id) {
      return `${name} will be deleted, along with the time tracked against it. The task it belongs to and its other subtasks are not affected. This cannot be undone.`;
    }
    const kids = row.subtask_count ?? row.subtasks?.length ?? 0;
    if (!kids) {
      return `${name} will be deleted, along with the time tracked against it — the reports read the same figures. This cannot be undone.`;
    }
    return `${name} and its ${kids} subtask${kids === 1 ? "" : "s"} will be deleted, including any assigned to other people, along with the time tracked against them — the reports read the same figures. This cannot be undone.`;
  };

  /**
   * Delete, once it has been confirmed.
   *
   * Nothing is removed from the screen here: the caller reloads, and the row
   * this panel shows is derived from that. What does happen here is closing —
   * a panel about a task that no longer exists has nothing to render.
   */
  const removeRow = async (row: taskList) => {
    if (!onTaskDelete) return;
    setSaving(true);
    try {
      await onTaskDelete(String(row.id));
      setPendingDelete(null);
      if (String(row.id) === String(task.id)) onClose();
    } catch {
      /* reported by the caller — leave the prompt up */
    } finally {
      setSaving(false);
    }
  };

  /**
   * `sequential` only goes up when the toggle actually moved. It is a property
   * of the parent, not of the children being added, so re-sending what is
   * already stored would be a second write for nothing.
   */
  const addChildren = async (
    rows: AddSubtaskInput[],
    sequential: boolean
  ): Promise<number> => {
    if (!onSubtaskAdd) return 0;
    setSaving(true);
    try {
      const added = await onSubtaskAdd(
        String(task.id),
        rows,
        sequential === !!task.sequential ? undefined : sequential
      );
      if (added >= rows.length) setAddingChild(false);
      return added;
    } catch {
      /* reported by the caller — leave the form standing */
      return 0;
    } finally {
      setSaving(false);
    }
  };

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

    if (st === "completed" || st === "done") {
      return (
        <span className="tdp__done" title="Completed">
          <CheckRoundedIcon sx={{ fontSize: 15 }} />
        </span>
      );
    }

    if (!rowOwns) return null;

    if (st === "in_progress") {
      /*
       * A task finishes on its own say-so. Its subtasks are separate units of
       * work with separate clocks, so an open child no longer withholds this —
       * whoever owns the task decides when the task is done.
       */
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
    const editing = editingId === id;

    /*
     * Editing swaps the card's own face for the form and leaves everything
     * under it alone — a task's children stay listed while its dates are being
     * corrected, which is usually exactly what they are being corrected
     * against.
     */
    if (editing) {
      return (
        <div key={id} className={`tdp__card${isMain ? " tdp__card--main" : ""}`}>
          <TaskEditForm
            task={row}
            isMain={isMain}
            saving={saving}
            onCancel={() => setEditingId(null)}
            onSave={(fields) => saveEdit(id, fields)}
          />

          {expanded && kids.length > 0 && (
            <div className="tdp__card-kids">
              {kids.map((kid) => renderCard(kid))}
            </div>
          )}
        </div>
      );
    }

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

              {/* How often this one has slipped, where the deadline is read. */}
              {(row.extension_count ?? row.extensions?.length ?? 0) > 0 && (
                <span
                  className="tdp__slip"
                  title={`The deadline has been pushed ${
                    row.extension_count ?? row.extensions?.length
                  } time(s) — the reasons are in Activity`}
                >
                  <EventRepeatOutlinedIcon sx={{ fontSize: 10 }} />
                  {row.extension_count ?? row.extensions?.length}
                </span>
              )}
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

            {mayEdit(row) && (
              <button
                type="button"
                className="tdp__comment-btn"
                title={isMain ? "Edit this task" : "Edit this subtask"}
                onClick={() => {
                  setAddingChild(false);
                  setEditingId(id);
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: 12 }} />
              </button>
            )}

            {/*
              * Extending is offered on anything unfinished, not only on what
              * has already slipped: the honest moment to push a deadline is
              * when you know you will miss it, which is before you do.
              */}
            {onTaskExtend && mayEdit(row) && normalize(row.status) !== "completed" && (
              <button
                type="button"
                className="tdp__comment-btn"
                title={
                  row.due_date
                    ? "Extend this deadline"
                    : "Set a deadline for this"
                }
                onClick={() => {
                  setEditingId(null);
                  setAddingChild(false);
                  setExtending(row);
                }}
              >
                <EventRepeatOutlinedIcon sx={{ fontSize: 12 }} />
              </button>
            )}

            {onTaskDelete && canDelete?.(row) && (
              <button
                type="button"
                className="tdp__comment-btn tdp__comment-btn--danger"
                title={isMain ? "Delete this task" : "Delete this subtask"}
                onClick={() => {
                  setEditingId(null);
                  setAddingChild(false);
                  setPendingDelete(row);
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 12 }} />
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

                  {onSubtaskAdd && mayEdit(task) && !addingChild && (
                    <button
                      type="button"
                      className="tdp__head-btn"
                      onClick={() => {
                        setEditingId(null);
                        setAddingChild(true);
                      }}
                    >
                      <AddRoundedIcon sx={{ fontSize: 15 }} />
                      {subs.length ? "Add subtasks" : "Break into subtasks"}
                    </button>
                  )}
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

                {addingChild && (
                  <div className="tdp__add-slot">
                    <AddSubtasksForm
                      roomMembers={roomMembers}
                      // The parent's window, so a child starts inside it rather
                      // than at whatever today happens to be.
                      defaultStartDate={toDateValue(task.start_date)}
                      defaultDueDate={toDateValue(task.due_date)}
                      sequential={!!task.sequential}
                      saving={saving}
                      onCancel={() => setAddingChild(false)}
                      onAdd={addChildren}
                    />
                  </div>
                )}

                {subs.length === 0 && !addingChild && (
                  <p className="tdp__note">No subtasks — this task is tracked on its own.</p>
                )}
              </div>
            )}

            {tab === "details" && (
              <div className="tdp__panel">
                <div className="tdp__panel-head">
                  <ArticleOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                  <h4 className="tdp__panel-title">Details</h4>

                  {mayEdit(task) && editingId !== String(task.id) && (
                    <button
                      type="button"
                      className="tdp__head-btn"
                      onClick={() => {
                        setAddingChild(false);
                        setEditingId(String(task.id));
                      }}
                    >
                      <EditOutlinedIcon sx={{ fontSize: 14 }} />
                      Edit
                    </button>
                  )}
                </div>

                {editingId === String(task.id) ? (
                  <TaskEditForm
                    task={task}
                    isMain
                    saving={saving}
                    onCancel={() => setEditingId(null)}
                    onSave={(fields) => saveEdit(String(task.id), fields)}
                  />
                ) : (
                <>
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
                </>
                )}
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
                          {/* Why, in their words. Only a push carries one. */}
                          {e.note && <p className="tdp__event-reason">{e.note}</p>}
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

      <ExtendTaskDialog
        task={extending}
        open={extending !== null}
        saving={saving}
        onClose={() => setExtending(null)}
        onExtend={pushDeadline}
      />

      <Dialoge
        open={pendingDelete !== null}
        data="delete"
        busy={saving}
        title={pendingDelete?.parent_id ? "Delete this subtask?" : "Delete this task?"}
        message={deletePrompt(pendingDelete)}
        confirmLabel="Yes, delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void removeRow(pendingDelete);
        }}
      />
    </Dialog>
  );
}
