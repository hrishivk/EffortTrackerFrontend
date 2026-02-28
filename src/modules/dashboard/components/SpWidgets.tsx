import { Bar } from "react-chartjs-2";
import { Doughnut } from "react-chartjs-2";
import { StaCard, LegendItem } from "./CommonWidgets";
import TableList from "../../../shared/components/Table/Table";
import { getTeamPerformanceColumns } from "./getTeamPerformanceColumns";
import { teamPerformanceData } from "./teamPerformanceData";
import type { SpTeamPerformanceProps, TaskStatusDistributionProps } from "../types";




export const TaskStatusDistribution = ({
  completed,
  inProgress,
  yetToStart,
  totalTasks,
}: TaskStatusDistributionProps) => {
  const doughnutData = {
    labels: ["Completed", "In Progress", "Yet to Start"],
    datasets: [
      {
        data: [completed, inProgress, yetToStart],
        backgroundColor: ["#9F33FF", "#EEDAFF", "#CE97FF"],
        borderWidth: 0,
      },
    ],
  };

  const centerCirclePlugin = {
    id: "centerCircle",
    beforeDraw(chart: any) {
      const { ctx } = chart;
      const width = chart.width;
      const height = chart.height;

      ctx.restore();
      ctx.font = "bold 16px Inter";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = "#111827";
      ctx.fillText("Total Tasks", width / 2, height / 2 - 10);
      ctx.fillText(totalTasks.toString(), width / 2, height / 2 + 15);
      ctx.save();
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="fw-bold text-gray-800 mb-4" style={{ fontSize: "1.25rem" }}>
        Task Status Distribution
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
        {/* Doughnut Chart */}
        <div className="h-48 w-48 sm:h-72 sm:w-72 flex-shrink-0">
          <Doughnut
            data={doughnutData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "35%",
              plugins: { legend: { display: false } },
            }}
            plugins={[centerCirclePlugin]}
          />
        </div>

        {/* Status Legend */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <LegendItem color="#E9D5FF" label="Yet to Start" value={48} total={120} />
          <LegendItem color="#C084FC" label="In Progress" value={30} total={120} />
          <LegendItem color="#9333EA" label="Completed" value={42} total={120} />
        </div>
      </div>
    </div>
  );
};


export const TaskCompletionTrend = () => {
  const trendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Completed",
        data: [40, 55, 70, 50, 80, 95],
        backgroundColor: "#9F33FF",
        borderRadius: 12,
        barThickness: 28,
      },
      {
        label: "Remaining",
        data: [25, 30, 35, 30, 35, 40],
        backgroundColor: "#EEDAFF",
        borderRadius: 12,
        barThickness: 28,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: "#6B7280", font: { size: 12 } },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { display: false },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-10">
      <h2 className="fw-bold text-gray-800 mb-4" style={{ fontSize: "1.25rem" }}>
        Task Completion Trend
      </h2>
      <div style={{ height: "260px" }}>
        <Bar data={trendData} options={trendOptions} />
      </div>
    </div>
  );
};




export const SpTeamPerformance = ({ page, setPage }: SpTeamPerformanceProps) => {
  return (
    <div>
      <h2
        className="fw-bold text-gray-800 mb-4 ml-1 sm:ml-4"
        style={{ fontSize: "1.25rem" }}
      >
        Recent Activity Feed
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 md:grid-cols-4 sm:gap-5 sm:overflow-visible sm:pb-0 scrollbar-hide">
        <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StaCard
            title="Avg Completion Time"
            value="3.2 days"
            subText="↓ 8% compared to last week"
            icon="⏱️"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        </div>
        <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StaCard
            title="Active Team Members"
            value="18/20"
            subText="2 currently inactive"
            icon="👥"
            iconBg="bg-pink-50"
            iconColor="text-pink-600"
          />
        </div>
        <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StaCard
            title="Project Success Rate"
            value="92%"
            subText="↑ 12% improvement"
            icon="📈"
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
        </div>
        <div className="min-w-[200px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StaCard
            title="Overdue Tasks"
            value="7"
            subText="Needs attention"
            icon="⚠️"
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
        </div>
      </div>

      <TableList
        title="Team Performance"
        columns={getTeamPerformanceColumns()}
        data={teamPerformanceData}
        pagination={{
          currentPage: page,
          totalPages: 3,
          onPageChange: setPage,
        }}
      />
    </div>
  );
};