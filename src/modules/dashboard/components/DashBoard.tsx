import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

import { useAppSelector } from "../../../store/configureStore";
import type { RoleTitles } from "../types";
import { authLogout } from "../../../core/actions/action";
import { useDispatch } from "react-redux";
import { reset } from "../../../store/authSlice";
import type { AppDispatch } from "../../../store/configureStore";
import MyTasksView from "./MyTasksView";
import ProfileView from "../../../presentation/ProfilePanel";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

const UserDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector((state) => state.user);
  const role = user.role;
  const id = user?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewUserId = searchParams.get("viewUser") || "";
  const viewUserName = searchParams.get("viewUserName") || "";
  const viewProject = searchParams.get("viewProject") || "";
  const viewTab = searchParams.get("tab") || "";
  const focusTaskId = searchParams.get("task") || "";
  const [activeTab, setActiveTab] = useState<"overview" | "myTasks" | "profile">(
    viewUserId || viewProject || viewTab === "myTasks" ? "myTasks" : viewTab === "profile" ? "profile" : "overview"
  );
  useEffect(() => {
    if (viewUserId || viewProject || viewTab === "myTasks") {
      setActiveTab("myTasks");
    } else if (viewTab === "profile") {
      setActiveTab("profile");
    }
  }, [viewUserId, viewProject, viewTab]);
  const allTabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "myTasks" as const, label: role === "SP" ? "Tasks" : "My Tasks" },
    { key: "profile" as const, label: "Profile" },
  ];

  // Every role gets the tasks tab; MyTasksView (and its task fetch) only mounts once it is opened.
  const tabs = allTabs;
  const currentTab = activeTab;

  const roleTitles: RoleTitles = {
    USER: "User Dashboard",
    DEVLOPER: "User Dashboard",
    SP: "Admin Dashboard",
    AM: "Manager Dashboard",
  };

  const dashboardTitle = roleTitles[user.role] || "Dashboard";

  return (
    <motion.div
      className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 md:p-6"
      style={{ backgroundColor: "var(--bg-page)" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        <div className="relative flex gap-6 mt-2 border-b" style={{ borderColor: "var(--border-light)" }}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "overview") {
                    if (viewUserId) searchParams.delete("viewUser");
                    if (viewUserName) searchParams.delete("viewUserName");
                    if (viewProject) searchParams.delete("viewProject");
                    if (viewTab) searchParams.delete("tab");
                    if (viewUserId || viewProject || viewTab) {
                      setSearchParams(searchParams, { replace: true });
                    }
                  }
                }}
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

        {currentTab === "profile" ? (
          <ProfileView
            onLogout={async () => {
              const response = await authLogout(id as string);
              if (response.success) {
                await dispatch(reset());
                window.location.href = "/";
              }
            }}
          />
        ) : currentTab === "myTasks" ? (
          <MyTasksView
            viewUserId={viewUserId}
            viewUserName={viewUserName}
            viewProject={viewProject}
            viewTab={viewTab}
            focusTaskId={focusTaskId}
          />
        ) : (
          <>
            <div>
              <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
                {dashboardTitle}
              </h2>
              <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.95rem" }}>
                Real-time insights into team performance and project progress.
              </p>
            </div>




          </>
        )}
      </div>
    </motion.div>
  );
};

export default UserDashboard;
