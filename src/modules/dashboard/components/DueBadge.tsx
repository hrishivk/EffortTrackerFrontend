import {
  daysOverdue,
  isPlainDate,
  toLocalDate,
  type DueState,
} from "../../../shared/utils/taskStatus";


interface DueBadgeProps {
  dueDate: string;
  state: Exclude<DueState, null>;
  dense?: boolean;
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
