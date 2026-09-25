import { useEffect, useMemo, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import Popover from "@mui/material/Popover";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import type { taskList } from "../../user/types";
import { toDateValue } from "../../../shared/utils/taskStatus";
import ExtensionLog from "./ExtensionLog";
import AppCalendar from "../../../shared/components/Calendar/AppCalendar";

/**
 * Pushing a deadline out.
 *
 * Deliberately not the edit form. Editing a date is a correction — the 21st was
 * typed when the 12th was meant — and goes up unlogged. This is the admission
 * that the work will not be done in time, so it asks for a reason and is
 * recorded against the task for whoever has to ask about it later.
 *
 * The date is offered as a handful of lengths rather than a calendar, because
 * that is how the decision is actually made: not "the 30th" but "give it
 * another week". The app's calendar is still there, under Custom or the date
 * row, for the case that has a date.
 */

const REASON_MAX = 500;

/** The jumps worth one tap. "Custom" is the fifth, and opens the picker. */
const JUMPS = [
  { days: 2, label: "+2 days" },
  { days: 3, label: "+3 days" },
  { days: 7, label: "+1 week" },
  { days: 14, label: "+2 weeks" },
];

const addDays = (from: string, days: number): string => {
  const [y, m, d] = from.split("-").map(Number);
  if (!y || !m || !d) return "";
  const next = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
};

const showDay = (value?: string | null) => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

/** "YYYY-MM-DD" to a local-midnight Date, and back — the calendar speaks Date. */
const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

const fromDate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const todayValue = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

interface ExtendTaskDialogProps {
  /** The row being pushed — a task or one subtask. */
  task: taskList | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  /** Never rejects: the caller reports a refusal and leaves the dialog open. */
  onExtend: (input: { due_date: string; reason: string }) => void | Promise<void>;
}

export default function ExtendTaskDialog({
  task,
  open,
  saving,
  onClose,
  onExtend,
}: ExtendTaskDialogProps) {
  const current = toDateValue(task?.due_date);
  /** Jumps count from the deadline being missed, or from today if none was set. */
  const base = current || todayValue();
  const floor = addDays(base, 1);

  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  /** The calendar is hidden until the answer is not one of the jumps. */
  const [custom, setCustom] = useState(false);
  const [showLog, setShowLog] = useState(false);
  /** The date row the calendar hangs from; set while it is open. */
  const dateRef = useRef<HTMLDivElement>(null);
  const [calOpen, setCalOpen] = useState(false);

  // A fresh dialog each time it opens, never last time's answer.
  useEffect(() => {
    if (!open) return;
    setDueDate("");
    setReason("");
    setTouched(false);
    setCustom(false);
    setShowLog(false);
    setCalOpen(false);
  }, [open, task?.id]);

  /**
   * The same two rules the API enforces, asked here first so a refusal does not
   * have to be a round trip: a date that is not later is an edit, not an
   * extension, and an extension without a reason is the thing this replaces.
   */
  const problem = useMemo(() => {
    if (!dueDate) return "Pick how much longer it needs.";
    if (dueDate < floor) return "The new date has to be later than the current one.";
    if (!reason.trim()) return "Say why it needs longer.";
    return null;
  }, [dueDate, floor, reason]);

  const submit = async () => {
    setTouched(true);
    if (problem) return;
    await onExtend({ due_date: dueDate, reason: reason.trim() });
  };

  if (!task) return null;

  const pushes = task.extension_count ?? task.extensions?.length ?? 0;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            boxShadow: "0 30px 80px rgba(15, 23, 42, 0.26)",
          },
        },
      }}
    >
      <div className="xtd">
        <div className="xtd__top">
          <span className="xtd__badge">
            <EventRepeatOutlinedIcon sx={{ fontSize: 18 }} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="xtd__title">Extend this deadline</h3>
            <p className="xtd__sub" title={task.description}>
              {task.description}
            </p>
          </div>
          <button
            type="button"
            className="xtd__x"
            title="Close"
            onClick={onClose}
            disabled={saving}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        <div className="xtd__body">
          {/* Where it stands today, and how often it has already moved. */}
          <div className="xtd__now">
            <span className="xtd__now-icon">
              <ScheduleOutlinedIcon sx={{ fontSize: 17 }} />
            </span>
            <div style={{ minWidth: 0 }}>
              <p className="xtd__label">Current due date</p>
              <p className="xtd__now-date">{showDay(current) ?? "No due date set"}</p>
              {pushes > 0 && (
                <button
                  type="button"
                  className="xtd__pushes"
                  // The count is the headline; the reasons behind it are one
                  // tap away rather than in the way of the decision.
                  onClick={() => setShowLog((v) => !v)}
                >
                  Already extended {pushes} time{pushes === 1 ? "" : "s"}
                  <span className="xtd__pushes-more">{showLog ? "Hide" : "Why?"}</span>
                </button>
              )}
            </div>
          </div>

          {showLog && <ExtensionLog extensions={task.extensions} newestFirst />}

          <div className="xtd__field">
            <p className="xtd__heading">Add new due date</p>
            <div className="xtd__jumps">
              {JUMPS.map((jump) => {
                const value = addDays(base, jump.days);
                const on = !custom && dueDate === value;
                return (
                  <button
                    key={jump.days}
                    type="button"
                    className={`xtd__jump${on ? " xtd__jump--on" : ""}`}
                    onClick={() => {
                      setCustom(false);
                      setDueDate(value);
                    }}
                  >
                    {jump.label}
                  </button>
                );
              })}
              <button
                type="button"
                className={`xtd__jump${custom ? " xtd__jump--on" : ""}`}
                onClick={() => {
                  setCustom(true);
                  setDueDate("");
                  // Custom is a request for the calendar, not just a mode.
                  setCalOpen(true);
                }}
              >
                Custom
                <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
              </button>
            </div>
          </div>

          <div className="xtd__field">
            <span className="xtd__label">New due date</span>
            <div
              ref={dateRef}
              role="button"
              tabIndex={0}
              aria-label="New due date"
              aria-haspopup="dialog"
              className={`xtd__date${calOpen ? " xtd__date--open" : ""}${
                touched && !dueDate ? " xtd__date--bad" : ""
              }`}
              onClick={() => setCalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCalOpen(true);
                }
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />
              <span className={`xtd__date-text${dueDate ? "" : " xtd__date-text--empty"}`}>
                {showDay(dueDate) ??
                  (current ? `Currently ${showDay(current)} — pick a new date` : "Pick a date")}
              </span>

              {dueDate && (
                <button
                  type="button"
                  className="xtd__date-clear"
                  title="Clear"
                  onClick={(e) => {
                    // The row behind it opens the calendar; clearing should not.
                    e.stopPropagation();
                    setDueDate("");
                    setCustom(true);
                  }}
                >
                  <CloseIcon sx={{ fontSize: 13 }} />
                </button>
              )}

            </div>

            <Popover
              open={calOpen}
              anchorEl={dateRef.current}
              onClose={() => setCalOpen(false)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.75,
                    borderRadius: "12px",
                    backgroundColor: "transparent",
                    backgroundImage: "none",
                    boxShadow: "none",
                    overflow: "visible",
                  },
                },
              }}
            >
              <AppCalendar
                value={toDate(dueDate)}
                // Nothing on or before the current deadline: that is an edit.
                minDate={toDate(floor) ?? undefined}
                // Ringed so the jump from today's deadline is visible.
                markedDates={current ? [toDate(current) as Date] : undefined}
                onChange={(date) => {
                  if (!date) return;
                  setCustom(true);
                  setDueDate(fromDate(date));
                  setCalOpen(false);
                }}
              />
            </Popover>
          </div>

          <div className="xtd__field">
            <span className="xtd__label">
              Why it needs longer <span className="xtd__req">*</span>
            </span>
            <div className="xtd__reason-wrap">
              <textarea
                className={`xtd__reason${
                  touched && !reason.trim() ? " xtd__reason--bad" : ""
                }`}
                rows={4}
                maxLength={REASON_MAX}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. QA environment was down for three days..."
              />
              <span className="xtd__count">
                {reason.length}/{REASON_MAX}
              </span>
            </div>
          </div>

          {touched && problem && <p className="xtd__error">{problem}</p>}

          <p className="xtd__note">
            <InfoOutlinedIcon sx={{ fontSize: 14 }} />
            <span>
              This is recorded against the task with your name and today&rsquo;s
              date, and everyone who can see the task can read it.
            </span>
          </p>
        </div>

        <div className="xtd__foot">
          <button type="button" className="xtd__cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="xtd__go"
            onClick={() => void submit()}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress size={14} sx={{ color: "inherit" }} />
            ) : (
              <ScheduleOutlinedIcon sx={{ fontSize: 15 }} />
            )}
            Extend Deadline
          </button>
        </div>
      </div>
    </Dialog>
  );
}
