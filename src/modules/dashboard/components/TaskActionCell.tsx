import CircularProgress from "@mui/material/CircularProgress";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

/**
 * Where a task is, and the one thing you can do to it next.
 *
 * Everything is done from here — the List view has no detail modal — so this is
 * used for a task's own row and for each of its subtasks.
 *
 *   Yet to Start → [▶ Start]
 *   In Progress  → [● Running ✓]   the tick finishes it
 *   Completed    → [✓ Completed]
 */

const chipBase = (dense: boolean) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  borderRadius: 8,
  fontSize: dense ? 10 : 11,
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
});

interface TaskActionCellProps {
  status?: string | null;
  /** False when the viewer is not the assignee, which makes this read-only. */
  owns: boolean;
  busy?: boolean;
  dense?: boolean;
  onStart: () => void;
  onComplete: () => void;
}

export default function TaskActionCell({
  status,
  owns,
  busy = false,
  dense = false,
  onStart,
  onComplete,
}: TaskActionCellProps) {
  const st = (status || "").toLowerCase().replace(/[\s-]+/g, "_");
  const base = chipBase(dense);

  // Clicks must not reach the row or card underneath.
  const act = (run: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    run();
  };

  if ((st === "yet_to_start" || st === "pending") && owns) {
    return (
      <button
        type="button"
        title="Start this task"
        disabled={busy}
        onClick={act(onStart)}
        style={{
          ...base,
          padding: dense ? "3px 8px" : "4px 10px",
          border: "none",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          color: "#2563eb",
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? (
          <CircularProgress size={dense ? 9 : 11} sx={{ color: "inherit" }} />
        ) : (
          <PlayArrowRoundedIcon sx={{ fontSize: dense ? 12 : 14 }} />
        )}
        Start
      </button>
    );
  }

  if (st === "in_progress") {
    return (
      <span
        style={{
          ...base,
          padding: dense ? "2px 3px 2px 8px" : "3px 4px 3px 10px",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          color: "#2563eb",
        }}
      >
        <span className="task-running-dot" />
        Running
        {owns && (
          <button
            type="button"
            className="task-running-done"
            title="Mark this task complete"
            disabled={busy}
            onClick={act(onComplete)}
          >
            {busy ? (
              <CircularProgress size={10} sx={{ color: "inherit" }} />
            ) : (
              <CheckRoundedIcon sx={{ fontSize: dense ? 12 : 13 }} />
            )}
          </button>
        )}
      </span>
    );
  }

  if (st === "completed" || st === "done") {
    return (
      <span
        style={{
          ...base,
          padding: dense ? "3px 8px" : "4px 10px",
          backgroundColor: "rgba(22, 163, 74, 0.12)",
          color: "#16a34a",
        }}
      >
        <CheckRoundedIcon sx={{ fontSize: dense ? 12 : 13 }} />
        Completed
      </span>
    );
  }

  return <span style={{ fontSize: dense ? 10 : 12, color: "var(--text-faint)" }}>--</span>;
}
