import { useState } from "react";
import { motion } from "framer-motion";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HolidaySection from "./HolidaySection";
import {
  leaveCards,
  upcomingHolidays,
  pastHolidays,
  iconColors,
} from "./leaveData";

interface LeaveOverviewProps {
  onApplyLeave: () => void;
}

const LeaveOverview = ({ onApplyLeave }: LeaveOverviewProps) => {
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);
  const [year, setYear] = useState(2026);

  const dateRange = `01-Jan-${year} - 31-Dec-${year}`;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
            Leave Management
          </h2>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
            Leave limited this year: <strong>3</strong> | Event:{" "}
            <strong>6</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="w-8 h-8 flex items-center justify-center transition"
              style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)" }}
            >
              <KeyboardArrowLeftIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
            </button>
            <button
              className="flex items-center gap-1.5 text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 18px",
                whiteSpace: "nowrap",
                border: "none",
                cursor: "pointer",
              }}
            >
              <CalendarMonthIcon sx={{ fontSize: 14 }} />
              {dateRange}
            </button>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="w-8 h-8 flex items-center justify-center transition"
              style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)" }}
            >
              <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
            </button>
          </div>

          <button
            className="btn text-white d-flex align-items-center gap-1"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 18px",
              whiteSpace: "nowrap",
            }}
            onClick={onApplyLeave}
          >
            + Apply Leave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveCards.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: card.iconBg,
                  color: iconColors[card.iconBg],
                }}
              >
                {card.icon}
              </div>
              <span
                className="text-[11px] font-semibold tracking-wide uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                {card.title}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {card.available}
                </p>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                  Available
                </p>
              </div>
              <div className="text-right">
                {card.total !== undefined && (
                  <p className="text-sm font-semibold" style={{ color: "#f97316" }}>
                    {card.total}
                  </p>
                )}
                <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {card.total !== undefined ? "Sanctioned" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {card.booked}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  Booked
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <HolidaySection
        title="Upcoming Leaves & Holidays"
        iconColor="#f97316"
        holidays={upcomingHolidays}
        open={upcomingOpen}
        onToggle={() => setUpcomingOpen((o) => !o)}
      />
      <HolidaySection
        title="Past Leaves & Holidays"
        iconColor="#7C3AED"
        holidays={pastHolidays}
        open={pastOpen}
        onToggle={() => setPastOpen((o) => !o)}
      />
    </>
  );
};

export default LeaveOverview;
