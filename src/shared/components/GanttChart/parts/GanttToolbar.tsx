import { FormControl, MenuItem, Select } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import type { ViewMode } from "../../../types/GanttChart";
import { selectSx } from "./ganttStyles";

const VIEW_MODES: ViewMode[] = ["Week", "Month", "Year"];

const navButtonStyle = { border: "1px solid var(--border-light)", borderRadius: 8, lineHeight: 1 };
const navIconSx = { fontSize: 18, color: "var(--text-muted)" };

interface Props {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  headerLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

export default function GanttToolbar({
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  headerLabel,
  onPrev,
  onNext,
}: Props) {
  return (
    <div
      className="d-flex align-items-center justify-content-between flex-wrap gap-2"
      style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)" }}
    >
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <FormControl size="small" sx={{ minWidth: 110, ...selectSx }}>
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            renderValue={(val) => `Status: ${val}`}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="ON TRACK">On Track</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="DELAYED">Delayed</MenuItem>
          </Select>
        </FormControl>

        <div
          className="d-flex"
          style={{
            border: "1px solid var(--border-light)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className="btn btn-sm"
              style={{
                borderRadius: 0,
                fontSize: 12,
                fontWeight: 500,
                padding: "5px 14px",
                backgroundColor: viewMode === mode ? "var(--bg-hover)" : "var(--bg-card)",
                color: viewMode === mode ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                borderRight: mode !== "Year" ? "1px solid var(--border-light)" : "none",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button onClick={onPrev} className="btn btn-sm p-1" style={navButtonStyle}>
          <KeyboardArrowLeftIcon sx={navIconSx} />
        </button>
        <button
          className="btn btn-sm text-white d-flex align-items-center gap-1"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #9333ea)",
            borderRadius: 8,
            padding: "5px 14px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CalendarMonthIcon sx={{ fontSize: 16 }} />
          {headerLabel}
        </button>
        <button onClick={onNext} className="btn btn-sm p-1" style={navButtonStyle}>
          <KeyboardArrowRightIcon sx={navIconSx} />
        </button>
      </div>
    </div>
  );
}
