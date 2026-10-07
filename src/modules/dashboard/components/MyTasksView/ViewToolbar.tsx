import { motion } from "framer-motion";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { toDateInput } from "../../../../shared/utils/taskStatus";
import { PRIMARY_GRADIENT, TAB_SPRING, VIEW_TABS } from "./constants";
import { formatDateLabel } from "./helpers";
import type { ViewMode } from "./types";

type Props = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isCompact: boolean;
  selectedDate: Date;
  onShiftDay: (delta: number) => void;
  onToday: () => void;
  onPickDate: (date: Date) => void;
};

const stepButtonClass =
  "w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition flex-shrink-0";
const stepButtonStyle = { border: "1px solid var(--border-light)", borderRadius: 8, backgroundColor: "var(--bg-card)" };

export default function ViewToolbar({
  viewMode,
  onViewModeChange,
  isCompact,
  selectedDate,
  onShiftDay,
  onToday,
  onPickDate,
}: Props) {
  return (
    <div className="rounded-2xl shadow-sm px-3 sm:px-5 py-3 mb-4 sm:mb-5 flex flex-row justify-between items-center gap-2 sm:gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div
          style={{
            display: "flex",
            gap: 2,
            padding: 4,
            borderRadius: 14,
            border: "1px solid var(--border-light)",
            backgroundColor: "var(--bg-hover)",
            flexShrink: 0,
          }}
        >
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = viewMode === tab.key;
            return (
              <motion.button
                key={tab.key}
                onClick={() => onViewModeChange(tab.key)}
                whileTap={{ scale: 0.94 }}
                transition={TAB_SPRING}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: isCompact ? 4 : 6,
                  backgroundColor: "transparent",
                  color: active ? "#fff" : "var(--text-muted)",
                  borderRadius: 10,
                  fontSize: isCompact ? 11 : 12.5,
                  fontWeight: 600,
                  padding: isCompact ? "6px 9px" : "7px 14px",
                  whiteSpace: "nowrap",
                  border: "none",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  transition: "color 0.2s",
                }}
              >
                {active && (
                  <motion.span
                    layoutId="viewTabPill"
                    transition={TAB_SPRING}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 10,
                      background: PRIMARY_GRADIENT,
                      boxShadow: "0 2px 10px rgba(124, 58, 237, 0.35)",
                      zIndex: 0,
                    }}
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.12 : 1 }}
                  transition={TAB_SPRING}
                  style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
                >
                  {Icon && <Icon sx={{ fontSize: isCompact ? 12 : 14 }} />}
                </motion.span>
                <span style={{ position: "relative", zIndex: 1 }}>
                  {isCompact ? tab.shortLabel : tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {viewMode !== "gantt" && (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button onClick={() => onShiftDay(-1)} className={stepButtonClass} style={stepButtonStyle}>
              <KeyboardArrowLeftIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
            </button>
            <button
              className="flex items-center gap-1 sm:gap-1.5 text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                borderRadius: isCompact ? 8 : 12,
                fontSize: isCompact ? 10 : 12,
                fontWeight: 600,
                padding: isCompact ? "5px 8px" : "7px 10px",
                whiteSpace: "nowrap",
              }}
              onClick={onToday}
            >
              <CalendarMonthIcon sx={{ fontSize: isCompact ? 12 : 14 }} />
              {formatDateLabel(selectedDate)}
            </button>
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
              <input
                type="date"
                value={toDateInput(selectedDate)}
                onChange={(e) => {
                  if (e.target.value) onPickDate(new Date(e.target.value + "T00:00:00"));
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: 2 }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center transition"
                style={{ border: "1px solid var(--border-light)", borderRadius: 8, zIndex: 1 }}
              >
                <CalendarMonthIcon sx={{ fontSize: 14, color: "var(--text-muted)" }} />
              </div>
            </div>
            <button onClick={() => onShiftDay(1)} className={stepButtonClass} style={stepButtonStyle}>
              <KeyboardArrowRightIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
