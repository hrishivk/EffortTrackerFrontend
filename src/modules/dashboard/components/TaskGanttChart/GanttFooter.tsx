import type { Dispatch, SetStateAction } from "react";

type Props = {
  zoomLevel: number;
  setZoomLevel: Dispatch<SetStateAction<number>>;
};

const LEGEND = [
  { label: "In Progress", color: "#7c3aed" },
  { label: "Completed", color: "#9333ea" },
  { label: "Pending", color: "#c084fc" },
];

const zoomButtonStyle = {
  width: 22, height: 22, borderRadius: "50%", border: "1px solid #d1d5db",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 14, color: "#6b7280", background: "#fff", cursor: "pointer",
};

export default function GanttFooter({ zoomLevel, setZoomLevel }: Props) {
  return (
    <div
      className="d-flex align-items-center justify-content-between flex-wrap"
      style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}
    >
      <div className="d-flex align-items-center gap-4">
        {LEGEND.map(({ label, color }) => (
          <div key={label} className="d-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="d-flex align-items-center gap-2">
        <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>
          Zoom
        </span>
        <button
          onClick={() => setZoomLevel(z => Math.max(0.5, +(z - 0.1).toFixed(1)))}
          style={zoomButtonStyle}
        >
          &minus;
        </button>
        <input
          type="range" min={0.5} max={2} step={0.1}
          value={zoomLevel}
          onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
          style={{ width: 100, accentColor: "#7c3aed", cursor: "pointer" }}
        />
        <button
          onClick={() => setZoomLevel(z => Math.min(2, +(z + 0.1).toFixed(1)))}
          style={zoomButtonStyle}
        >
          +
        </button>
      </div>
    </div>
  );
}
