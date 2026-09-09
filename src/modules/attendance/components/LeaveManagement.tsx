import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronDown,
  FiCalendar,
} from "react-icons/fi";
import {
  MdOutlineMoneyOff,
  MdOutlineBeachAccess,
  MdOutlineWorkOff,
  MdOutlineWork,
} from "react-icons/md";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useAppSelector } from "../../../store/configureStore";
import HolidayList from "./HolidayList";
import LeaveRequest from "./LeaveRequest";
import MyLeaves from "./MyLeaves";
import TeamLeaves from "./TeamLeaves";
import TeamLeaveHistory from "./TeamLeaveHistory";

type Tab = "management" | "summary" | "balance" | "requests" | "myLeaves" | "teamLeaves" | "teamLeaveHistory";

interface LeaveCard {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  available: number;
  total?: number;
  booked: number;
}

interface Holiday {
  date: string;
  day: string;
  name: string;
}

const leaveCards: LeaveCard[] = [
  {
    title: "LEAVE WITHOUT PAY",
    icon: <MdOutlineMoneyOff size={22} />,
    iconBg: "#fee2e2",
    available: 0,
    booked: 0,
  },
  {
    title: "CASUAL LEAVE",
    icon: <MdOutlineBeachAccess size={22} />,
    iconBg: "#ffedd5",
    available: 0,
    total: 8,
    booked: 0,
  },
  {
    title: "COMPENSATORY OFF",
    icon: <MdOutlineWorkOff size={22} />,
    iconBg: "#f3e8ff",
    available: 0,
    booked: 0,
  },
  {
    title: "ON DUTY",
    icon: <MdOutlineWork size={22} />,
    iconBg: "#dbeafe",
    available: 0,
    booked: 0,
  },
];

const upcomingHolidays: Holiday[] = [
  { date: "14-Apr-2026", day: "Tuesday", name: "Tamil New Year" },
  { date: "01-May-2026", day: "Friday", name: "May Day" },
  { date: "15-Aug-2026", day: "Saturday", name: "Independence Day" },
  { date: "14-Sep-2026", day: "Monday", name: "Vinayagar Chaturthi" },
];

const pastHolidays: Holiday[] = [
  { date: "26-Jan-2026", day: "Monday", name: "Republic Day" },
  { date: "15-Jan-2026", day: "Thursday", name: "Pongal" },
];

const iconColors: Record<string, string> = {
  "#fee2e2": "#ef4444",
  "#ffedd5": "#f97316",
  "#f3e8ff": "#a855f7",
  "#dbeafe": "#3b82f6",
};

const LeaveManagement = () => {
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;

  const pageTabs: { key: Tab; label: string }[] = role === "SP"
    ? [
        { key: "teamLeaves" as Tab, label: "Leave Approvals" },
        { key: "balance", label: "Holiday List" },
      ]
    : [
        { key: "myLeaves", label: "My Leaves" },
        // { key: "summary", label: "Attendance Summary" },
        { key: "balance", label: "Holiday List" },
        { key: "requests", label: "Apply Leave" },
        ...(role === "AM"
          ? [
              { key: "teamLeaves" as Tab, label: "Team Leaves" },
              { key: "teamLeaveHistory" as Tab, label: "Team Leave History" },
            ]
          : []),
      ];

  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as Tab | null;
  const defaultTab = role === "SP" ? "teamLeaves" as Tab : "myLeaves";
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl || defaultTab);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);
  const [year, setYear] = useState(2026);

  const dateRange = `01-Jan-${year} - 31-Dec-${year}`;

  return (
    <motion.div
      className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 md:p-6"
      style={{ backgroundColor: "var(--bg-page)" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Tabs — same as Dashboard */}
        <div
          className="relative flex gap-6 mt-2 border-b"
          style={{ borderColor: "var(--border-light)" }}
        >
          {pageTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative px-1 pb-3 text-sm font-semibold transition-colors duration-200"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
                    style={{
                      background: "linear-gradient(135deg, #AD21DB, #7C3AED)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ══════ TAB CONTENT ══════ */}
        {/* activeTab === "summary" ? (
          <AttendanceSummary />
        ) : */ activeTab === "balance" ? (
          <HolidayList />
        ) : activeTab === "requests" ? (
          <LeaveRequest onSuccess={() => setActiveTab("myLeaves")} />
        ) : activeTab === "myLeaves" ? (
          <MyLeaves />
        ) : activeTab === "teamLeaves" ? (
          <TeamLeaves />
        ) : activeTab === "teamLeaveHistory" ? (
          <TeamLeaveHistory />
        ) : null}
        {/* Leave Management view commented out */}
        {false && (
          <>
            {/* Header row — same sizes as Dashboard */}
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
                {/* Date range — same arrow buttons as MyTasksView */}
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
                  onClick={() => setActiveTab("requests")}
                >
                  + Apply Leave
                </button>
              </div>
            </div>

            {/* Leave Cards */}
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
                      <p
                        className="text-3xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {card.available}
                      </p>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: "var(--text-faint)" }}
                      >
                        Available
                      </p>
                    </div>
                    <div className="text-right">
                      {card.total !== undefined && (
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#f97316" }}
                        >
                          {card.total}
                        </p>
                      )}
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {card.total !== undefined ? "Sanctioned" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {card.booked}
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        Booked
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

     
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <button
                onClick={() => setUpcomingOpen((o) => !o)}
                className="flex items-center justify-between w-full px-6 py-4"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: "#f97316" }}>
                    <FiCalendar size={18} />
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Upcoming Leaves & Holidays
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: upcomingOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: "var(--text-muted)" }}
                >
                  <FiChevronDown size={20} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {upcomingOpen && (
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
                      {upcomingHolidays.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3.5"
                          style={{
                            borderBottom:
                              i < upcomingHolidays.length - 1
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
                            <span
                              className="text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
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
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <button
                onClick={() => setPastOpen((o) => !o)}
                className="flex items-center justify-between w-full px-6 py-4"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: "#7C3AED" }}>
                    <FiCalendar size={18} />
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Past Leaves & Holidays
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: pastOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: "var(--text-muted)" }}
                >
                  <FiChevronDown size={20} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {pastOpen && (
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
                      {pastHolidays.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3.5"
                          style={{
                            borderBottom:
                              i < pastHolidays.length - 1
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
                            <span
                              className="text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
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
          </>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            &copy; 2025 KREW. All rights reserved.
          </p>
        </div>
      </div>

    </motion.div>
  );
};

export default LeaveManagement;
