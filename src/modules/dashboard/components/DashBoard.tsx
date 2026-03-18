import { useCallback, useEffect, useState } from "react";
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
import {
  fetchAllExistProjects,
  fetchAllUsers,
} from "../../../core/actions/spAction";
import { authLogout } from "../../../core/actions/action";
import { useDispatch } from "react-redux";
import { reset } from "../../../store/authSlice";
import type { AppDispatch } from "../../../store/configureStore";
import type { project } from "../../../shared/types/Project";
import type { formUserData } from "../../../shared/types/User";
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
  const [, setProject] = useState<project[]>([]);
  const [, setUsers] = useState<formUserData[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector((state) => state.user);
  const role = user.role;
  const id = user?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewUserId = searchParams.get("viewUser") || "";
  const viewProject = searchParams.get("viewProject") || "";
  const viewTab = searchParams.get("tab") || "";
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
  const spHasViewParam = role === "SP" && (viewUserId || viewProject);
  const allTabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "myTasks" as const, label: role === "SP" ? "Tasks" : "My Tasks" },
    { key: "profile" as const, label: "Profile" },
  ];
  const tabs = role === "SP" && !spHasViewParam
    ? allTabs.filter((tab) => tab.key !== "myTasks")
    : allTabs;

  const listData = useCallback(async () => {
    try {
      const projectResponse = await fetchAllExistProjects();
      setProject(projectResponse.data);

      if (role === "SP" || role === "AM") {
        const response = await fetchAllUsers();
        if (response?.data) setUsers(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, [role, id]);

  useEffect(() => {
    listData();
  }, [listData]);

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
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "overview") {
                    if (viewUserId) searchParams.delete("viewUser");
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

        {activeTab === "profile" ? (
          <ProfileView
            onLogout={async () => {
              const response = await authLogout(id as string);
              if (response.success) {
                await dispatch(reset());
                window.location.href = "/";
              }
            }}
          />
        ) : activeTab === "myTasks" ? (
          <MyTasksView viewUserId={viewUserId} viewProject={viewProject} viewTab={viewTab} />
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

            {/* Filters */}
            {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5">
              <div className="d-flex gap-3">
                <FormControl fullWidth size="small" sx={commonFormControlSx}>
                  <InputLabel>Project</InputLabel>
                  <Select label="Project" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} MenuProps={commonMenuProps}>
                    <MenuItem value="">All Projects</MenuItem>
                    {project.map((item, index) => (
                      <MenuItem key={index} value={item.name}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {(role === "SP" || role === "AM") && (
                  <FormControl fullWidth size="small" sx={commonFormControlSx}>
                    <InputLabel>User</InputLabel>
                    <Select label="User" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} MenuProps={commonMenuProps}>
                      <MenuItem value="">All Users</MenuItem>
                      {users.map((item, index) => (
                        <MenuItem key={index} value={item.fullName}>
                          {item.fullName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <FormControl fullWidth size="small" sx={commonFormControlSx}>
                  <Select
                    value={dateData}
                    onChange={(e) => setDateData(e.target.value)}
                    MenuProps={commonMenuProps}
                  >
                    <MenuItem value="All Dates">All Dates</MenuItem>
                    <MenuItem value="thisWeek">This Week</MenuItem>
                    <MenuItem value="thisMonth">This Month</MenuItem>
                    <MenuItem value="thisYear">This Year</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={commonFormControlSx}>
                  <Select
                    value={dateData}
                    onChange={(e) => setDateData(e.target.value)}
                    MenuProps={commonMenuProps}
                  >
                    <MenuItem value="Task Status">Task Status</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div> */}

            {/* {(role === "SP" || role === "AM") && (
            <div>
              <h2
                className="fw-bold text-gray-800 mb-4"
                style={{ fontSize: "1.25rem" }}
              >
                Team Overview
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-5 sm:overflow-visible sm:pb-0 scrollbar-hide">
                <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                  <StatCard
                    title="Total Tasks"
                    value={totalTasks}
                    subText="Across all projects"
                    icon="📋"
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-600"
                  />
                </div>
                <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                  <StatCard
                    title="Yet To Start"
                    value={yetToStart}
                    subText=" assignment"
                    icon="⏳"
                    iconBg="bg-orange-50"
                    iconColor="text-orange-600"
                  />
                </div>
                <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                  <StatCard
                    title="In Progress"
                    value={inProgress}
                    subText="Currently active"
                    icon="🔄"
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                  />
                </div>
                <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                  <StatCard
                    title="Completed"
                    value={completed}
                    subText="Successfully done"
                    icon="✅"
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                  />
                </div>
                <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
                  <StatCard
                    title="Total Hours"
                    value={totalHours}
                    subText="Estimated effort"
                    icon="⏱️"
                    iconBg="bg-pink-50"
                    iconColor="text-pink-600"
                  />
                </div>
              </div>
            </div>
            )} */}

            {/* {(role === "USER" || role === "DEVLOPER") && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <WeeklyProgressChart />
                <MyActiveTasks onViewAll={() => setActiveTab("myTasks")} />
              </div>
            )} */}

            {/* {(role === "SP" || role === "AM") && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {role === "SP" && (
                    <TaskStatusDistribution
                      completed={completed}
                      inProgress={inProgress}
                      yetToStart={yetToStart}
                      totalTasks={totalTasks}
                    />
                  )}
                  {role === "AM" && <TeamCapacityByDepartment />}
                  <RecentActivityFeed />
                </div>

                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                  <div className="flex-[3] min-w-0">
                    {role === "SP" && <TaskCompletionTrend />}
                    {role === "AM" && <UpcomingTeamEvents />}
                  </div>
                  <div className="flex-[2] min-w-0">
                    <UpcomingDeadlines />
                  </div>
                </div>
              </>
            )} */}
            {/* {role === "SP" && <SpTeamPerformance page={page} setPage={setPage} />}
            {role === "AM" && <AmTeamPerformance page={page} setPage={setPage} />} */}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default UserDashboard;
