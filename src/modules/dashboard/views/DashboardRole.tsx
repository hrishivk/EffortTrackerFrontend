import React, { lazy, type FC } from "react";
import TeamManagerOverview from "../team/TeamMangerOverView";
import { Footer } from "../layout/Footer";
import type { AccountManagerViewProps, UserDashboardProps } from "./types";
const WeeklySummary = lazy(() => import("../widgets/WeeklySummary"));
const PendingTasks = lazy(() => import("../widgets/PendingTasks"));
const TaskCompletionLog = lazy(() => import("../widgets/TaskCompletionLog"));
const TeamOverview = lazy(() => import("../team/TeamOverView"));

const DeveloperOrUserView: FC = () => (
  <>
    <WeeklySummary />
    <PendingTasks />
    <TaskCompletionLog />

    <section className="w-full max-w-7xl mx-auto p-6 rounded-lg">
      <header className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-medium text-gray-900">
          Weekly Effort Progress
        </h3>
        <span className="text-sm font-medium text-gray-600">80%</span>
      </header>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-900 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: "80%" }}
        />
      </div>
    </section>

    <Footer />
  </>
);
const AccountManagerView: FC<AccountManagerViewProps> = ({Dates}) => (
  <>
    {/* <TeamOverview Dates={Dates} /> */}
    <Footer />
  </>
);
const SupervisorView: FC<AccountManagerViewProps> = ({Dates}) => (
  <>
    <TeamManagerOverview Dates={Dates} />
    <Footer />
  </>
);
const DashboardRole: FC<UserDashboardProps> = ({ role,Dates }) => {
  const isDeveloperOrUser = role === "DEVLOPER" || role === "USER";
  const isAccountManager = role === "AM";
  const isSupervisor = role === "SP";

  return (
    <div className="space-y-6">
      {isDeveloperOrUser && <DeveloperOrUserView />}
      {isAccountManager && <AccountManagerView Dates={Dates}/>}
      {isSupervisor && <SupervisorView Dates={Dates} />}
    </div>
  );
};

export default DashboardRole;
