import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppSelector } from "../../../store/configureStore";
import HolidayList from "./HolidayList";
import LeaveRequest from "./LeaveRequest";
import MyLeaves from "./MyLeaves";
import TeamLeaves from "./TeamLeaves";
import TeamLeaveHistory from "./TeamLeaveHistory";
import LeaveOverview from "./LeaveManagement/LeaveOverview";

type Tab = "management" | "summary" | "balance" | "requests" | "myLeaves" | "teamLeaves" | "teamLeaveHistory";

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

  return (
    <motion.div
      className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 md:p-6"
      style={{ backgroundColor: "var(--bg-page)" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
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

        { activeTab === "balance" ? (
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
        {false && <LeaveOverview onApplyLeave={() => setActiveTab("requests")} />}

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
