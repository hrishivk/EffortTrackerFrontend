import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import type { TaskGanttChartProps } from "../../types";
import { PROJECT_COLORS } from "../ganttConstants";

type Props = {
  rangeLabel: string;
  projects: TaskGanttChartProps["projects"];
  projectColorMap: TaskGanttChartProps["projectColorMap"];
  isMobile: boolean;
  isTablet: boolean;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
};

const navButtonStyle = { border: "1px solid var(--border-light)", borderRadius: 8, lineHeight: 1 };

export default function GanttToolbar({
  rangeLabel, projects, projectColorMap, isMobile, isTablet, onPrev, onToday, onNext,
}: Props) {
  const iconSx = { fontSize: isMobile ? 16 : 18, color: "var(--text-muted)" };
  return (
    <div
      className="d-flex align-items-center justify-content-between"
      style={{ padding: isMobile ? "10px 12px" : isTablet ? "12px 16px" : "14px 20px", borderBottom: "1px solid var(--border-light)" }}
    >
      <div className="d-flex align-items-center gap-2">
        <button onClick={onPrev} className="btn btn-sm p-1" style={navButtonStyle}>
          <KeyboardArrowLeftIcon sx={iconSx} />
        </button>
        <button
          className="btn btn-sm text-white d-flex align-items-center gap-1"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #9333ea)",
            borderRadius: isMobile ? 8 : 12,
            padding: isMobile ? "5px 10px" : "6px 16px",
            fontSize: isMobile ? 11 : 13,
            fontWeight: 600,
          }}
          onClick={onToday}
        >
          <CalendarMonthIcon sx={{ fontSize: isMobile ? 13 : 16 }} />
          {rangeLabel}
        </button>
        <button onClick={onNext} className="btn btn-sm p-1" style={navButtonStyle}>
          <KeyboardArrowRightIcon sx={iconSx} />
        </button>
      </div>

      {!isMobile && (
        <div className="d-flex align-items-center gap-3">
          {projects.filter(p => (p.status || "").toLowerCase() === "active").slice(0, isTablet ? 2 : 4).map((p: any, i: number) => {
            const color = (projectColorMap[p.name] || PROJECT_COLORS[i % PROJECT_COLORS.length]).dot;
            return (
              <div key={p.id} className="d-flex align-items-center gap-1">
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
                <span style={{ fontSize: isTablet ? 10 : 11, color: "var(--text-muted)", fontWeight: 500 }}>{p.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
