export default function HealthRing({ percent }: { percent: number }) {
  const radius = 38;
  const stroke = 6;
  const nr = radius - stroke / 2;
  const circ = nr * 2 * Math.PI;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="pd-health-ring">
      <svg width={radius * 2} height={radius * 2}>
        <circle stroke="var(--border-light)" fill="transparent" strokeWidth={stroke} r={nr} cx={radius} cy={radius} />
        <circle stroke="#7c3aed" fill="transparent" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`} style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 0.5s ease" }}
          r={nr} cx={radius} cy={radius} />
      </svg>
      <div className="pd-health-text">
        <span className="pd-health-percent">{percent}%</span>
        <span className="pd-health-label">Health</span>
      </div>
    </div>
  );
}
