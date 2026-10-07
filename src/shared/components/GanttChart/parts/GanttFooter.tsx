import type { CSSProperties } from "react";

const swatch: CSSProperties = { width: 10, height: 10, display: "inline-block" };

const LEGEND: { label: string; style: CSSProperties }[] = [
  { label: "Active Projects", style: { borderRadius: 2, backgroundColor: "#7c3aed" } },
  { label: "Completed", style: { borderRadius: 2, backgroundColor: "#9333ea" } },
  { label: "Delayed / At Risk", style: { borderRadius: "50%", border: "2px solid #ef4444" } },
];

const textStyle = { fontSize: 12, color: "var(--text-muted)" };
const strongStyle = { color: "var(--text-primary)" };

export default function GanttFooter({ total, avgProgress }: { total: number; avgProgress: number }) {
  return (
    <div
      className="d-flex align-items-center justify-content-between flex-wrap"
      style={{
        padding: "14px 20px",
        borderTop: "1px solid var(--border-light)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <div className="d-flex align-items-center gap-4">
        {LEGEND.map((item) => (
          <div key={item.label} className="d-flex align-items-center gap-1">
            <span style={{ ...swatch, ...item.style }} />
            <span style={textStyle}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="d-flex align-items-center gap-4">
        <span style={textStyle}>
          Total Projects: <strong style={strongStyle}>{total}</strong>
        </span>
        <span style={textStyle}>
          Average Completion: <strong style={strongStyle}>{avgProgress}%</strong>
        </span>
      </div>
    </div>
  );
}
