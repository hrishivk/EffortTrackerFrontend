import type { BoardTask } from "../../types";
import { avatarColors } from "../ganttConstants";
import { getInitials } from "../ganttUtils";

interface AvatarStackProps {
  taskKey: string;
  assignees: NonNullable<BoardTask["assignees"]>;
  size: number;
  max: number;
}

export default function AvatarStack({ taskKey, assignees, size, max }: AvatarStackProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      {assignees.slice(0, max).map((a, i) => (
        <span
          key={`${taskKey}-${a.userId ?? i}`}
          title={a.name}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            fontSize: size <= 18 ? 8 : 9,
            fontWeight: 700,
            color: "#fff",
            backgroundColor: avatarColors[i % avatarColors.length],
            border: "2px solid var(--bg-card)",
            marginLeft: i === 0 ? 0 : -6,
            flexShrink: 0,
          }}
        >
          {getInitials(a.name || "?")}
        </span>
      ))}
      {assignees.length > max && (
        <span style={{ fontSize: 9, color: "var(--text-faint)", marginLeft: 3 }}>
          +{assignees.length - max}
        </span>
      )}
    </span>
  );
}
