import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FlagIcon from "@mui/icons-material/Flag";
import type { GanttBar } from "../../../types/GanttChart";
import { barStyles } from "./ganttStyles";

const BAR_TOP = 15;
const BAR_HEIGHT = 26;

/** One project bar, its dashed overdue extension and the flag at the end of either. */
export default function GanttProjectBar({ bar, colWidth }: { bar: GanttBar; colWidth: number }) {
  const bs = barStyles[bar.type];
  const leftPx = (bar.startDay - 1) * colWidth;
  const widthPx = (bar.endDay - bar.startDay + 1) * colWidth;
  const overdueWidthPx = bar.overdueDays ? bar.overdueDays * colWidth : 0;

  return (
    <div>
      <div
        className="gantt-bar"
        style={{
          position: "absolute",
          left: leftPx,
          width: widthPx,
          top: BAR_TOP,
          height: BAR_HEIGHT,
          borderRadius: 6,
          background: bs.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingInline: 8,
          zIndex: 2,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          transition: "box-shadow 0.2s",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: bs.text }}>
          {bar.type === "completed" ? "Done" : `${bar.progress}%`}
        </span>
        {bar.type === "completed" && (
          <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#fff", opacity: 0.9 }} />
        )}
      </div>

      {bar.overdueDays && bar.overdueDays > 0 && (
        <div
          style={{
            position: "absolute",
            left: leftPx + widthPx,
            width: overdueWidthPx,
            top: BAR_TOP,
            height: BAR_HEIGHT,
            borderRadius: "0 6px 6px 0",
            border: "2px dashed #ef4444",
            borderLeft: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            backgroundColor: "#fef2f2",
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", letterSpacing: 0.5 }}>
            OVERDUE
          </span>
        </div>
      )}

      {bar.hasFlag && (
        <FlagIcon
          sx={{
            position: "absolute",
            left: leftPx + widthPx + overdueWidthPx,
            top: 12,
            fontSize: 16,
            color: "#dc2626",
            zIndex: 3,
          }}
        />
      )}
    </div>
  );
}
