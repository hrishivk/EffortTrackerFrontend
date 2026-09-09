import {
  daysOverdue,
  isPlainDate,
  toLocalDate,
  type DueState,
} from "../../../shared/utils/taskStatus";

/**
 * The deadline marker: a blinking red badge shaped like the status badge beside
 * it, in one of two escalations.
 *
 * `today` is a warning; `overdue` is a deeper red and says so in words, because
 * a missed deadline is the one a person has to act on first.
 */

interface DueBadgeProps {
  /** The task's `due_date` — a plain `YYYY-MM-DD`, or a full timestamp. */
  dueDate: string;
  state: Exclude<DueState, null>;
  /** Smaller type for compact Board cards. */
  dense?: boolean;
  /** Extra positioning, e.g. pushing the badge right inside a card footer. */
  style?: React.CSSProperties;
}

export default function DueBadge({
  dueDate,
  state,
  dense = false,
  style,
}: DueBadgeProps) {
  const d = toLocalDate(dueDate);
  if (!d) return null;

  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    ...(dense ? {} : { year: "numeric" }),
  });

  const overdue = state === "overdue";
  const late = overdue ? daysOverdue(dueDate) : 0;
  // A bare calendar day has no meaningful clock time to show.
  const clock = isPlainDate(dueDate)
    ? ""
    : ` at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <span
      className={`task-due-badge${overdue ? " task-due-badge--overdue" : ""}`}
      title={
        overdue
          ? `Overdue by ${late} day${late === 1 ? "" : "s"} — was due ${date}${clock}`
          : `Due today${clock}`
      }
      style={{
        fontSize: dense ? 9.5 : 11,
        padding: dense ? "2px 7px" : "3px 10px",
        ...style,
      }}
    >
      {overdue ? (dense ? `Overdue ${date}` : `Overdue \u00b7 ${date}`) : `Due ${date}`}
    </span>
  );
}
