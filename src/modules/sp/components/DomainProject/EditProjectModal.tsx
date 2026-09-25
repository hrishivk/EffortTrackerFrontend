import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress, MenuItem, Select, TextField } from "@mui/material";
import {
  FiActivity,
  FiCheck,
  FiCalendar,
  FiEdit2,
  FiFlag,
  FiPlusCircle,
  FiUserMinus,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";

import {
  assignProjectMembers,
  fetchUsers,
  removeProjectMembers,
  updateProject,
} from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { pdGetInitials } from "./utils";
import { PROJECT_CATEGORIES } from "./constants";
import type { formUserData } from "../../../../shared/types/User";
import type { ProjectActivityEntry } from "../../../../core/types";

const NAME_MAX = 100;

/** Rows per roster request. Two screens' worth, so scrolling rarely waits. */
const ROSTER_PAGE_SIZE = 20;

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
  "& .MuiInputBase-input": {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  "& .MuiSelect-select": { padding: "10px 14px", color: "var(--text-primary)" },
  "& .MuiSelect-icon": { color: "var(--text-muted)" },
};

const errorSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    backgroundColor: "#fef2f2",
    "& fieldset": { borderColor: "#ef4444" },
    "&:hover fieldset": { borderColor: "#dc2626" },
    "&.Mui-focused fieldset": {
      borderColor: "#dc2626",
      boxShadow: "0 0 0 2px rgba(239,68,68,0.12)",
    },
  },
};

/**
 * `datetime-local` needs `YYYY-MM-DDTHH:mm` in *local* time. The API sends UTC
 * with an offset, so read it through the Date constructor rather than slicing
 * the string — slicing shows the wrong day either side of midnight.
 */
const toDateTimeInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const REASON_MAX = 500;

/**
 * The day a stored or submitted end date falls on, exactly as the API reduces
 * it: the UTC calendar day of the ISO string. Deciding "moved later" any other
 * way would ask for a reason the server does not want, or skip one it does.
 */
const dayOf = (value?: string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

/** `YYYY-MM-DD` shown as a local calendar day, never shifted by the timezone. */
const showDay = (value?: string | null) => {
  if (!value) return "none";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

/** The time of day, for an entry already filed under its date. */
const showTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

/** The heading a run of entries is filed under: Today, Yesterday, or the date. */
const dayHeading = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" });
};

/** Consecutive entries on the same local day, in the order they arrive (newest first). */
const byDay = (entries: ProjectActivityEntry[]) => {
  const days: { key: string; heading: string; entries: ProjectActivityEntry[] }[] = [];
  for (const e of entries) {
    const d = new Date(e.created_at);
    const key = Number.isNaN(d.getTime())
      ? "unknown"
      : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = days[days.length - 1];
    if (last && last.key === key) last.entries.push(e);
    else days.push({ key, heading: dayHeading(e.created_at), entries: [e] });
  }
  return days;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  on_hold: "On hold",
  paused: "Paused",
  completed: "Completed",
};
const showStatus = (value?: string | null) =>
  value ? STATUS_LABEL[value] ?? value : "none";

const FIELD_LABEL: Record<string, string> = {
  description: "Description",
  domain_id: "Department",
  client_department: "Category",
  start_date: "Start date",
};

type Tone = "violet" | "amber" | "green" | "red" | "grey";

/**
 * One entry, drawn as a node on the line: what happened, and — for anything
 * that moved from one value to another — the before and after, so the old
 * value can be struck through rather than buried in a sentence.
 */
const describe = (
  e: ProjectActivityEntry,
): { title: string; from?: string; to?: string; icon: React.ReactNode; tone: Tone } => {
  switch (e.action) {
    case "created":
      return { title: `Created “${e.new_value ?? "the project"}”`, icon: <FiPlusCircle size={12} />, tone: "green" };
    case "extended":
      return e.old_value
        ? {
            title: "Extended the due date",
            from: showDay(e.old_value),
            to: showDay(e.new_value),
            icon: <FiCalendar size={12} />,
            tone: "amber",
          }
        : { title: "Set the due date", to: showDay(e.new_value), icon: <FiCalendar size={12} />, tone: "amber" };
    case "due_date_changed":
      return {
        title: "Brought the due date forward",
        from: showDay(e.old_value),
        to: showDay(e.new_value),
        icon: <FiCalendar size={12} />,
        tone: "violet",
      };
    case "status_changed":
      return {
        title: "Changed the status",
        from: showStatus(e.old_value),
        to: showStatus(e.new_value),
        icon: <FiFlag size={12} />,
        tone: "violet",
      };
    case "renamed":
      return {
        title: "Renamed the project",
        from: e.old_value ?? "",
        to: e.new_value ?? "",
        icon: <FiEdit2 size={12} />,
        tone: "violet",
      };
    case "member_added":
      return { title: `Added ${e.new_value ?? "someone"} to the team`, icon: <FiUserPlus size={12} />, tone: "green" };
    case "member_removed":
      return { title: `Removed ${e.old_value ?? "someone"} from the team`, icon: <FiUserMinus size={12} />, tone: "red" };
    case "updated": {
      // A department is an id on the entry; there is no name to show for it.
      if (e.field === "domain_id") {
        return { title: "Moved to another department", icon: <FiEdit2 size={12} />, tone: "grey" };
      }
      const label = FIELD_LABEL[e.field ?? ""] ?? e.field ?? "a field";
      const fmt = e.field === "start_date" ? showDay : (v?: string | null) => v || "none";
      return {
        title: `Changed the ${label.toLowerCase()}`,
        from: fmt(e.old_value),
        to: fmt(e.new_value),
        icon: <FiEdit2 size={12} />,
        tone: "grey",
      };
    }
    default:
      return { title: "Updated the project", icon: <FiActivity size={12} />, tone: "grey" };
  }
};

export interface EditProjectModalProps {
  open: boolean;
  /**
   * The project as `GET /project?id=` returns it — not a row out of the list.
   *
   * Two versions of the record arrive on it. The top level is the table's:
   * `dueDate`, `startDate`, a shouty `status: "ACTIVE"`. `editValues` is the
   * write body, field for field, in the casing the columns store. This form
   * reads `editValues` and submits those names back, because filling it from
   * the display twins is how a form posts "ON HOLD" into a column that takes
   * `on_hold`.
   */
  project: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const EditProjectModal = ({
  open,
  project,
  onClose,
  onSaved,
}: EditProjectModalProps) => {
  const { showSnackbar } = useSnackbar();
  const role = useSelector((state: any) => state.user.user.role);
  const isAM = String(role || "").toUpperCase() === "AM";

  /**
   * Who this account may put on a project: an SP staffs managers, an AM staffs
   * its own team. So an AM never sees another manager in here — not among the
   * people they could add, and not among the ones already on the project.
   *
   * The same rule governs the seeded membership below, so the count beside the
   * heading matches the rows underneath it, and a save can never add or drop
   * somebody this account was not shown.
   */
  const canAssign = useCallback(
    (who?: { role?: string | null }) => {
      const r = String(who?.role || "").toUpperCase();
      return isAM ? r === "USER" || r === "DEVLOPER" : r === "AM";
    },
    [isAM]
  );

  const [form, setForm] = useState({
    name: "",
    category: "",
    endDate: "",
  });
  /** The form, or what has happened to the project so far. */
  const [tab, setTab] = useState<"details" | "activity">("details");
  /** Why the due date is moving later. Asked for only when it is. */
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  /**
   * Who could be added, a page at a time.
   *
   * The whole roster used to be pulled in one go and cached on the screen
   * behind this. On an organisation of any size that is a long wait for a list
   * you scroll a third of — so it arrives as pages, and the next one is asked
   * for as you reach the bottom of the one you are reading.
   */
  const [roster, setRoster] = useState<formUserData[]>([]);
  const [rosterPage, setRosterPage] = useState(0);
  const [rosterPages, setRosterPages] = useState(1);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Members have their own endpoints, so they are tracked as a diff against
  // what the project started with and applied separately on save.
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const initialMemberIds = useRef<string[]>([]);
  /** Guards against re-seeding over the manager's own toggles. */
  const membersSeeded = useRef(false);

  /**
   * Everything comes off `editValues`, and the top-level fields are only a
   * fallback for a caller still handing over a list row.
   *
   * `client_department` is the column. The form labels it "category" and there
   * is no `project_category` column to write to, despite the name.
   */
  useEffect(() => {
    if (!open || !project) {
      membersSeeded.current = false;
      return;
    }
    const edit = project.editValues ?? {};
    setErrors({});
    setReason("");
    setTab("details");
    setForm({
      name: edit.name ?? project.name ?? "",
      category: edit.client_department ?? project.client_department ?? "",
      endDate: toDateTimeInput(edit.end_date ?? project.end_date ?? project.dueDate),
    });
    membersSeeded.current = false;
    setMemberIds([]);
  }, [open, project]);

  /**
   * Who is on it already.
   *
   * The read answers this directly now, straight off the join. The fallback
   * below is the old way — fetch every user and filter on their `projects[]` —
   * kept only for a caller that opened this on a list row, and it still has to
   * wait for that roster to arrive before it can say anything.
   */
  useEffect(() => {
    if (!open || !project || membersSeeded.current) return;

    if (Array.isArray(project.members)) {
      const assigned = project.members
        .filter(canAssign)
        .map((m: { id: string | number }) => String(m.id));
      setMemberIds(assigned);
      initialMemberIds.current = assigned;
      membersSeeded.current = true;
      return;
    }

    // Nothing to seed from: an older payload without `members` leaves the
    // picker empty rather than guessing at who is on the project.
    setMemberIds([]);
    initialMemberIds.current = [];
    membersSeeded.current = true;
    // `canAssign` is derived from the signed-in role, which does not change
    // while a modal is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleMember = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );

  /** Assigned first, so the current team is always what you see without scrolling. */
  /**
   * The project's own members lead, then everyone else as they page in.
   *
   * Members come off the project read rather than being found in the roster,
   * which matters now that the roster arrives in pieces: somebody already on
   * the project would otherwise be missing from this list until you happened to
   * scroll far enough to load them.
   */
  const visibleUsers = useMemo(() => {
    const members: formUserData[] = Array.isArray(project?.members)
      ? project.members.filter(canAssign)
      : [];
    const byId = new Map<string, formUserData>();
    for (const u of [...members, ...roster]) {
      const id = String(u.id);
      if (!byId.has(id)) byId.set(id, u);
    }
    const all = [...byId.values()];
    const assigned = all.filter((u) => memberIds.includes(String(u.id)));
    const rest = all.filter((u) => !memberIds.includes(String(u.id)));
    return [...assigned, ...rest];
  }, [project, roster, memberIds, canAssign]);

  /**
   * An SP staffs projects with managers; an AM staffs its own team onto them.
   *
   * The API filters on one role, and an AM needs two, so their pages are
   * narrowed here afterwards — which means a page can render short. Harmless
   * for a list you scroll (unlike a numbered pager, you simply scroll on), but
   * it is why the count below is the server's and not this array's length.
   */
  const loadRoster = useCallback(
    async (next: number) => {
      if (rosterLoading) return;
      setRosterLoading(true);
      try {
        const res = await fetchUsers({
          page: next,
          limit: ROSTER_PAGE_SIZE,
          ...(isAM ? {} : { role: "AM" }),
        });
        const rows = (res?.users ?? []).filter(canAssign);
        setRoster((prev) => {
          // Pages can overlap as people are added or removed underneath us.
          const seen = new Set(prev.map((u) => String(u.id)));
          return [...prev, ...rows.filter((u) => !seen.has(String(u.id)))];
        });
        setRosterPage(next);
        setRosterPages(res?.totalPages || 1);
      } catch {
        showSnackbar({ message: "Failed to load the team list", severity: "error" });
        // Stop asking: another page would fail the same way.
        setRosterPages(next);
        setRosterPage(next);
      } finally {
        setRosterLoading(false);
      }
    },
    // showSnackbar is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAM, rosterLoading, canAssign]
  );

  useEffect(() => {
    if (!open) {
      setRoster([]);
      setRosterPage(0);
      setRosterPages(1);
      return;
    }
    void loadRoster(1);
    // Only on open: `loadRoster` changes identity as it runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id]);

  const rosterHasMore = rosterPage < rosterPages;

  /** Within a row of the bottom, ask for the next page. */
  const onRosterScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!rosterHasMore || rosterLoading) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 72) {
      void loadRoster(rosterPage + 1);
    }
  };

  /** An older project may carry a category no longer on the list; keep it selectable. */
  const categoryOptions = useMemo(
    () =>
      form.category && !PROJECT_CATEGORIES.includes(form.category)
        ? [form.category, ...PROJECT_CATEGORIES]
        : PROJECT_CATEGORIES,
    [form.category],
  );

  const sx = (field: string) => (errors[field] ? errorSx : inputSx);

  /**
   * Is this save an extension? The same test the API applies: the due date lands
   * on a later day than the stored one, or is set where there was none.
   */
  const savedDay = dayOf(project?.editValues?.end_date ?? project?.end_date ?? null);
  const formDay = form.endDate ? dayOf(new Date(form.endDate).toISOString()) : null;
  const extending = !!formDay && (!savedDay || formDay > savedDay);

  const activity: ProjectActivityEntry[] = Array.isArray(project?.activity)
    ? project.activity
    : [];
  const extensionCount: number = project?.extension_count ?? 0;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Project name is required";
    else if (form.name.trim().length > NAME_MAX)
      next.name = `Project name must be ${NAME_MAX} characters or fewer`;
    if (!form.category) next.category = "Project category is required";
    if (!form.endDate) next.endDate = "Due date is required";
    else if (extending && !reason.trim())
      next.reason = "Say why the due date is moving later";
    setErrors(next);
    if (Object.keys(next).length) {
      setTab("details");
      showSnackbar({ message: Object.values(next)[0], severity: "error" });
      return false;
    }
    return true;
  };

  const added = memberIds.filter((id) => !initialMemberIds.current.includes(id));
  const removed = initialMemberIds.current.filter((id) => !memberIds.includes(id));

  const handleSave = async () => {
    if (!project?.id || !validate()) return;

    setSaving(true);
    try {
      // The API's own field names, as `editValues` hands them over. There is
      // no `project_category` column — "category" writes `client_department`.
      // The department a project sits under is not edited here — it is left
      // alone by being left out, which is what a partial write is for.
      await updateProject(project.id, {
        name: form.name.trim(),
        client_department: form.category,
        end_date: new Date(form.endDate).toISOString(),
        // Only on an extension — the API ignores it otherwise, and sending it on
        // every save would suggest every save was one.
        ...(extending ? { extension_reason: reason.trim() } : {}),
      });

      // Members are separate routes, so they only run once the record itself saved.
      if (added.length) await assignProjectMembers(String(project.id), added);
      if (removed.length) await removeProjectMembers(String(project.id), removed);

      showSnackbar({ message: "Project updated successfully", severity: "success" });
      onSaved();
      onClose();
    } catch (error: any) {
      showSnackbar({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update project",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && project && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="ep-backdrop"
            onClick={onClose}
          />

          <div className="ep-wrap">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="ep-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Edit project"
            >
              <header className="ep-head">
                <div className="ep-head-left">
                  <div className="ep-icon">
                    <FiEdit2 size={19} />
                  </div>
                  <div className="ep-head-text">
                    <h3>Edit Project</h3>
                    <p>Update project details and save your changes.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="ep-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <FiX size={19} />
                </button>
              </header>

              <div className="ep-tabs" role="tablist" aria-label="Project sections">
                {(
                  [
                    { key: "details", label: "Details", icon: <FiEdit2 size={13} /> },
                    { key: "activity", label: "Activity", icon: <FiActivity size={13} /> },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    className={`ep-tab${tab === t.key ? " is-active" : ""}`}
                    onClick={() => setTab(t.key)}
                  >
                    {tab === t.key && (
                      <motion.span
                        layoutId="ep-tab-pill"
                        className="ep-tab-pill"
                        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                      />
                    )}
                    <span className="ep-tab-inner">
                      {t.icon}
                      {t.label}
                      {t.key === "activity" && activity.length > 0 && (
                        <span className="ep-tab-count">{activity.length}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <div className="ep-body">
                {tab === "activity" ? (
                  <div className="ep-tl">
                    {activity.length === 0 ? (
                      <div className="ep-tl-empty">
                        <FiActivity size={18} />
                        <span>Nothing has happened to this project yet.</span>
                      </div>
                    ) : (
                      byDay(activity).map((day) => (
                        <section key={day.key} className="ep-tl-day">
                          <h5 className="ep-tl-date">{day.heading}</h5>
                          <ol className="ep-tl-list">
                            {day.entries.map((entry) => {
                              const { title, from, to, icon, tone } = describe(entry);
                              return (
                                <li key={entry.id} className={`ep-tl-item ep-tl--${tone}`}>
                                  <span className="ep-tl-node">{icon}</span>
                                  <div className="ep-tl-content">
                                    <p className="ep-tl-title">
                                      {title}
                                      <time className="ep-tl-time" dateTime={entry.created_at}>
                                        {showTime(entry.created_at)}
                                      </time>
                                    </p>
                                    {to !== undefined && (
                                      <p className="ep-tl-diff">
                                        {from !== undefined && (
                                          <>
                                            <s className="ep-tl-was">{from}</s>
                                            <span className="ep-tl-arrow">→</span>
                                          </>
                                        )}
                                        <span className="ep-tl-now">{to}</span>
                                      </p>
                                    )}
                                    {entry.reason && (
                                      <blockquote className="ep-tl-reason">{entry.reason}</blockquote>
                                    )}
                                    <p className="ep-tl-by">by {entry.actor_name ?? "someone"}</p>
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        </section>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="ep-cols">
                    <div>
                      <div className="ep-field">
                        <label className="ep-label">
                          Project Name<span className="ep-req">*</span>
                        </label>
                        <TextField
                          fullWidth
                          size="small"
                          sx={sx("name")}
                          value={form.name}
                          slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
                          onChange={(e) => setField("name", e.target.value)}
                        />
                        {errors.name ? (
                          <p className="ep-error">{errors.name}</p>
                        ) : (
                          <p className="ep-count">
                            {form.name.length} / {NAME_MAX}
                          </p>
                        )}
                      </div>

                      {/* Category and due date read as one line: what kind of
                          work it is, and when it is due. */}
                      <div className="ep-grid">
                        <div>
                          <label className="ep-label">
                            Project Category<span className="ep-req">*</span>
                          </label>
                          <Select
                            fullWidth
                            size="small"
                            displayEmpty
                            sx={sx("category")}
                            value={form.category}
                            onChange={(e) => setField("category", e.target.value)}
                            renderValue={(value) =>
                              value ? (
                                (value as string)
                              ) : (
                                <span style={{ color: "var(--text-faint)" }}>
                                  Select a category
                                </span>
                              )
                            }
                          >
                            {categoryOptions.map((c) => (
                              <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>
                                {c}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.category && (
                            <p className="ep-error">{errors.category}</p>
                          )}
                        </div>

                        <div>
                          <label className="ep-label">
                            Due Date<span className="ep-req">*</span>
                          </label>
                          <TextField
                            fullWidth
                            size="small"
                            type="datetime-local"
                            sx={sx("endDate")}
                            value={form.endDate}
                            onChange={(e) => setField("endDate", e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <FiCalendar
                                    size={15}
                                    style={{
                                      marginRight: 10,
                                      color: "var(--text-muted)",
                                    }}
                                  />
                                ),
                              },
                            }}
                          />
                          {errors.endDate ? (
                            <p className="ep-error">{errors.endDate}</p>
                          ) : (
                            <p className="ep-hint">
                              {savedDay
                                ? `Currently ${showDay(savedDay)}`
                                : "Select project due date and time"}
                              {extensionCount > 0 && (
                                <span className="ep-slip">Extended {extensionCount}×</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Only when the date moves later: that is an extension, and
                          the API refuses one without a reason. */}
                      <AnimatePresence initial={false}>
                        {extending && (
                          <motion.div
                            key="reason"
                            className="ep-field ep-reason"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                          >
                            <label className="ep-label">
                              Why is the due date moving later?
                              <span className="ep-req">*</span>
                            </label>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              size="small"
                              sx={sx("reason")}
                              value={reason}
                              placeholder="e.g. Client pushed the UAT window"
                              slotProps={{ htmlInput: { maxLength: REASON_MAX } }}
                              onChange={(e) => {
                                setReason(e.target.value);
                                if (errors.reason) {
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.reason;
                                    return next;
                                  });
                                }
                              }}
                            />
                            {errors.reason ? (
                              <p className="ep-error">{errors.reason}</p>
                            ) : (
                              <p className="ep-hint">
                                Recorded as an extension with your name · {reason.length} / {REASON_MAX}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>

                    <div className="ep-team">
                      <div className="ep-team-head">
                        <h4>
                          <FiUsers size={14} />
                          Team Assigned
                        </h4>
                        <span className="ep-team-count">{memberIds.length}</span>
                      </div>
                      <p className="ep-team-sub">
                        Tap a row to add or remove them from this project.
                      </p>

                      {rosterLoading && roster.length === 0 ? (
                        <div className="ep-team-loading">
                          <CircularProgress size={22} thickness={4} sx={{ color: "#7c3aed" }} />
                          <span>Loading team…</span>
                        </div>
                      ) : visibleUsers.length === 0 ? (
                        <div className="ep-team-empty">
                          No one is available to assign yet.
                        </div>
                      ) : (
                        <div className="ep-team-list" onScroll={onRosterScroll}>
                          {visibleUsers.map((user) => {
                            const uid = String(user.id);
                            const assigned = memberIds.includes(uid);
                            return (
                              <button
                                key={uid}
                                type="button"
                                className={`ep-member ${assigned ? "is-assigned" : ""}`}
                                aria-pressed={assigned}
                                onClick={() => toggleMember(uid)}
                              >
                                <span className="ep-member-avatar">
                                  {pdGetInitials(user.fullName)}
                                </span>
                                <span className="ep-member-info">
                                  <span className="ep-member-name">{user.fullName}</span>
                                  <span className="ep-member-role">{user.role}</span>
                                </span>
                                <span className="ep-member-state">
                                  {assigned ? (
                                    <>
                                      <FiCheck size={11} />
                                      Added
                                    </>
                                  ) : (
                                    "Add"
                                  )}
                                </span>
                              </button>
                            );
                          })}

                          {rosterLoading && (
                            <div className="ep-team-more">
                              <CircularProgress
                                size={14}
                                thickness={5}
                                sx={{ color: "#7c3aed" }}
                              />
                              <span>Loading more…</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <footer className="ep-foot">
                {added.length || removed.length ? (
                  <span className="ep-foot-note">
                    {added.length > 0 && `${added.length} to add`}
                    {added.length > 0 && removed.length > 0 && " · "}
                    {removed.length > 0 && `${removed.length} to remove`}
                  </span>
                ) : null}
                <div className="ep-foot-actions">
                  <button type="button" className="ep-btn-cancel" onClick={onClose}>
                    {tab === "activity" ? "Close" : "Cancel"}
                  </button>
                  {tab === "details" && (
                  <button
                    type="button"
                    className="ep-btn-save"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    <FiCheck size={15} />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  )}
                </div>
              </footer>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditProjectModal;
