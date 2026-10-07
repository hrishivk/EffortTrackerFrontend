import type { PhaseItem, CriticalUpdate } from "../../../types";

const panelStyle = { flex: 1, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" };
const headingStyle = { fontSize: "1rem", color: "var(--text-primary)" };

type Props = {
  phaseData: PhaseItem[];
  criticalUpdates: CriticalUpdate[];
};

const OverviewInsights = ({ phaseData, criticalUpdates }: Props) => (
  <div className="d-flex flex-column flex-lg-row gap-4 mt-4">
    <div className="rounded-2xl p-4" style={panelStyle}>
      <h3 className="fw-bold mb-3" style={headingStyle}>
        PROJECT PHASE DISTRIBUTION
      </h3>
      <div className="d-flex flex-column gap-3">
        {phaseData.map((phase) => (
          <div key={phase.label}>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {phase.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                {phase.count} Projects
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 99,
                backgroundColor: "var(--border-light)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(phase.count / phase.max) * 100}%`,
                  height: "100%",
                  borderRadius: 99,
                  backgroundColor: phase.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-2xl p-4" style={panelStyle}>
      <h3 className="fw-bold mb-3" style={headingStyle}>
        CRITICAL PROJECT UPDATES
      </h3>
      <div className="d-flex flex-column gap-3">
        {criticalUpdates.length > 0 ? (
          criticalUpdates.map((update, i) => {
            const isWarning = update.type === "warning";
            return (
              <div
                key={i}
                className="d-flex align-items-start gap-3 p-3 rounded-3"
                style={{
                  backgroundColor: isWarning ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${isWarning ? "#fecaca" : "#bbf7d0"}`,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {isWarning ? "⚠️" : "✅"}
                </span>
                <div>
                  <p className="mb-0" style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                    {update.title}
                  </p>
                  <p className="mb-0" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {update.description}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
            No critical updates at the moment.
          </p>
        )}
      </div>
    </div>
  </div>
);

export default OverviewInsights;
