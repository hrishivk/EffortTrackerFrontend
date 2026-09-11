import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";

import { subtaskProgress } from "../../../shared/utils/subtasks";
import { STATUS_ACCENT } from "./boardConstants";



interface SubtaskProgressProps {
  subtasks?: { status?: string | null }[];
  /**
   * The API's own tally (`subtask_done_count` / `subtask_count`). Preferred
   * over counting `subtasks[]`, which is only the slice this caller happens to
   * hold — a response that nests no children would otherwise read 0 of 0.
   */
  done?: number;
  total?: number;

  onOpen?: () => void;
  /** Narrower bar and smaller type, for a Board card. */
  dense?: boolean;
}

export default function SubtaskProgress({
  subtasks,
  done: doneProp,
  total: totalProp,
  onOpen,
  dense = false,
}: SubtaskProgressProps) {
  const counted = subtaskProgress(subtasks);
  const done = doneProp ?? counted.done;
  const total = totalProp ?? counted.total;
  if (!total) return null;

  const pct = Math.round((done / total) * 100);
  const complete = done === total;
  const started = done > 0;
  // Green once every child is done, blue while some are, grey before any.
  const fill = complete
    ? STATUS_ACCENT.completed
    : started
      ? STATUS_ACCENT.in_progress
      : STATUS_ACCENT.yet_to_start;

  const inner = (
    <>
      <AccountTreeOutlinedIcon sx={{ fontSize: dense ? 11 : 13, flexShrink: 0 }} />
      <span
        style={{
          position: "relative",
          width: dense ? 34 : 46,
          height: 5,
          flexShrink: 0,
          borderRadius: 999,
          backgroundColor: "var(--border-light)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            borderRadius: 999,
            backgroundColor: fill,
            transition: "width 0.25s ease-out",
          }}
        />
      </span>
      <span style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
        {done}/{total}
      </span>
      {onOpen && <OpenInFullIcon sx={{ fontSize: dense ? 9 : 10, flexShrink: 0 }} />}
    </>
  );

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: dense ? 4 : 6,
    padding: dense ? "2px 7px" : "4px 9px",
    border: "none",
    borderRadius: 8,
    backgroundColor: complete
      ? "rgba(22, 163, 74, 0.12)"
      : started
        ? "rgba(37, 99, 235, 0.12)"
        : "var(--bg-hover)",
    color: complete ? "#16a34a" : started ? "#2563eb" : "var(--text-muted)",
    fontSize: dense ? 10 : 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  const label = `${done} of ${total} subtasks done`;

  if (!onOpen) {
    return (
      <span title={label} style={style}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      title={`${label} — open the task`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      style={{ ...style, cursor: "pointer" }}
    >
      {inner}
    </button>
  );
}
