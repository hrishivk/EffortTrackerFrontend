import CheckIcon from "@mui/icons-material/Check";

/** Where the decorative specks sit around the ring, as % offsets. */
const SPECKS = [
  { top: "4%", left: "16%", size: 4 },
  { top: "0%", left: "72%", size: 3 },
  { top: "34%", left: "94%", size: 4 },
  { top: "84%", left: "84%", size: 3 },
  { top: "92%", left: "26%", size: 4 },
  { top: "48%", left: "2%", size: 3 },
];

/** Copy per lane, so an empty Completed reads differently from an empty group. */
const emptyCopy = (laneKey: string, label: string) => {
  switch (laneKey) {
    case "completed":
      return {
        title: "No tasks completed yet",
        hint: "Tasks will appear here once they are completed.",
      };
    case "in_progress":
      return {
        title: "Nothing in progress",
        hint: "Start a task and it will show up here.",
      };
    case "yet_to_start":
      return {
        title: "Nothing to do yet",
        hint: "New tasks will appear here.",
      };
    case "blocked":
      return {
        title: "Nothing blocked",
        hint: "Blocked tasks will appear here.",
      };
    default:
      return {
        title: "No tasks in this group yet",
        hint: `Drag a task into ${label} to get started.`,
      };
  }
};

interface BoardEmptyStateProps {
  laneKey: string;
  label: string;
  accent: string;
  tint: string;
  dense?: boolean;
}

export default function BoardEmptyState({
  laneKey,
  label,
  accent,
  tint,
  dense = false,
}: BoardEmptyStateProps) {
  const { title, hint } = emptyCopy(laneKey, label);
  const ring = dense ? 54 : 76;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: dense ? "18px 8px" : "34px 12px",
        flex: 1,
      }}
    >
      <div style={{ position: "relative", width: ring, height: ring }}>
        {SPECKS.map((s, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: accent,
              opacity: 0.45,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: dense ? 7 : 9,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            opacity: 0.28,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: dense ? 13 : 17,
            borderRadius: "50%",
            backgroundColor: "var(--bg-card)",
            backgroundImage: `linear-gradient(${tint}, ${tint})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckIcon sx={{ fontSize: dense ? 17 : 24, color: accent }} />
        </div>
      </div>

      <p
        style={{
          margin: dense ? "12px 0 0" : "18px 0 0",
          fontSize: dense ? 11.5 : 13,
          fontWeight: 700,
          color: "var(--text-secondary)",
        }}
      >
        {title}
      </p>
      {!dense && (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 11.5,
            lineHeight: 1.5,
            color: "var(--text-faint)",
            maxWidth: 190,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
