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
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: accentColor + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
          fontSize: 16,
        }}
      >
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
