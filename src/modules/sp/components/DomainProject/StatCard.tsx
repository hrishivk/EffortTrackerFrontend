const StatCard = ({
  title,
  value,
  subtitle,
  progress,
  icon,
  accentColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
  icon: React.ReactNode;
  accentColor: string;
}) => (
  <div className="rounded-2xl px-5 py-4 flex-1" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide m-0" style={{ color: "var(--text-faint)" }}>
          {title}
        </p>
        <p className="text-3xl font-bold mt-1 mb-0 leading-tight" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] mt-0.5 mb-0" style={{ color: "var(--text-faint)" }}>{subtitle}</p>
        )}
        {progress !== undefined && (
          <div
            style={{
              width: 100,
              height: 6,
              borderRadius: 99,
              backgroundColor: "var(--border-light)",
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 99,
                background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              }}
            />
          </div>
        )}
      </div>
      {/*
        * A tinted tile rather than a bare glyph: the measure's own colour, held
        * in a wash of itself with a hairline of the same hue, so four cards in
        * a row read as one set of four rather than four loose marks.
        */}
      <div
        style={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 12,
          background: `linear-gradient(140deg, ${accentColor}1f, ${accentColor}0d)`,
          border: `1px solid ${accentColor}2e`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
        }}
      >
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
