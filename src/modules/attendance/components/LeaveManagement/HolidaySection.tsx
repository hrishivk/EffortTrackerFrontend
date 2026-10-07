import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiCalendar } from "react-icons/fi";
import type { Holiday } from "./leaveData";

interface HolidaySectionProps {
  title: string;
  iconColor: string;
  holidays: Holiday[];
  open: boolean;
  onToggle: () => void;
}

const HolidaySection = ({
  title,
  iconColor,
  holidays,
  open,
  onToggle,
}: HolidaySectionProps) => (
  <div
    className="rounded-2xl"
    style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border-card)",
      boxShadow: "var(--shadow-card)",
    }}
  >
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-6 py-4"
    >
      <div className="flex items-center gap-2">
        <span style={{ color: iconColor }}>
          <FiCalendar size={18} />
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </span>
      </div>
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ color: "var(--text-muted)" }}
      >
        <FiChevronDown size={20} />
      </motion.span>
    </button>

    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div
            className="px-6 pb-4"
            style={{ borderTop: "1px solid var(--border-light)" }}
          >
            {holidays.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3.5"
                style={{
                  borderBottom:
                    i < holidays.length - 1
                      ? "1px solid var(--border-light)"
                      : "none",
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {h.date}, {h.day}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#7C3AED" }}
                  />
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {h.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default HolidaySection;
