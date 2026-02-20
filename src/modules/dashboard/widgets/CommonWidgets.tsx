import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import UpdateIcon from "@mui/icons-material/Update";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import type { LegendItemProps, StaCardProps, StatCardProps } from "../types";


export const StatCard = ({
  title,
  value,
  subText,
  icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
}: StatCardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight">
            {value}
          </p>
          {subText && (
            <p className="text-[11px] text-gray-400 mt-0.5">{subText}</p>
          )}
        </div>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}
          >
            <span className={`text-base ${iconColor}`}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const StaCard = ({
  title,
  value,
  subText,
  icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
}: StaCardProps) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm hover:shadow transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-500 uppercase">
            {title}
          </p>
          <p className="text-xl font-semibold text-gray-900 leading-tight">
            {value}
          </p>
          {subText && (
            <p className="text-[11px] text-gray-400 leading-tight">{subText}</p>
          )}
        </div>
        {icon && (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}
          >
            <span className={`text-base ${iconColor}`}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};


export const RecentActivityFeed = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="fw-bold text-gray-800" style={{ fontSize: "1.25rem" }}>
          Recent Activity Feed
        </h2>
        <button className="!text-[85%] font-medium text-indigo-600 hover:text-indigo-800 transition">
          View All
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
          <CheckCircleIcon className="text-green-500 mt-0.5" fontSize="small" />
          <div className="text-gray-700">
            <span className="font-semibold text-gray-900">Lakshman</span>{" "}
            <span className="text-green-600 font-medium">completed</span>{" "}
            UI Design Review
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
          <PlayCircleFilledIcon className="text-blue-500 mt-0.5" fontSize="small" />
          <div className="text-gray-700">
            <span className="font-semibold text-gray-900">Praveen</span>{" "}
            <span className="text-blue-600 font-medium">started</span>{" "}
            Backend API Development
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
          <UpdateIcon className="text-purple-500 mt-0.5" fontSize="small" />
          <div className="text-gray-700">
            <span className="font-semibold text-gray-900">Mayookh</span>{" "}
            <span className="text-purple-600 font-medium">updated</span>{" "}
            Database Schema
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
          <AssignmentTurnedInIcon className="text-emerald-500 mt-0.5" fontSize="small" />
          <div className="text-gray-700">
            <span className="font-semibold text-gray-900">Vaibhavadharani</span>{" "}
            <span className="text-emerald-600 font-medium">reviewed</span>{" "}
            Performance Dashboard
          </div>
        </div>
      </div>
    </div>
  );
};


export const UpcomingDeadlines = () => {
  const deadlines = [
    {
      title: "Website Redesign - Phase 2",
      due: "Due: July 20, 2025 (Pooja B.)",
      daysLeft: "3 days left",
      icon: "⚠️",
      bg: "bg-red-50",
      border: "border-red-100",
      iconBg: "bg-red-100",
      badgeBg: "bg-red-100",
      badgeText: "text-red-600",
    },
    {
      title: "Mobile App Beta Release",
      due: "Due: July 25, 2025 (Ethan W.)",
      daysLeft: "8 days left",
      icon: "⏰",
      bg: "bg-orange-50",
      border: "border-orange-100",
      iconBg: "bg-orange-100",
      badgeBg: "bg-orange-100",
      badgeText: "text-orange-600",
    },
    {
      title: "Q3 Marketing Strategy",
      due: "Due: August 5, 2025 (Olivia H.)",
      daysLeft: "19 days left",
      icon: "📅",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      iconBg: "bg-emerald-100",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-600",
    },
  
  ];

  return (
   <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
      <h2 className="fw-bold text-gray-800 mt-2 mb-4" style={{ fontSize: "1.25rem" }}>
        Upcoming Deadlines
      </h2>
      <div className="space-y-3  mt-3">
        {deadlines.map((d, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-2 rounded-xl ${d.bg} border ${d.border}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center ${d.iconBg} p-2 rounded-lg`}>
                <span className="text-lg">{d.icon}</span>
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-semibold text-gray-800 text-sm">{d.title}</p>
                <p className="text-xs text-gray-500">{d.due}</p>
              </div>
            </div>
            <span className={`text-xs font-medium ${d.badgeBg} ${d.badgeText} px-2 py-0.5 rounded-full`}>
              {d.daysLeft}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};



export const LegendItem: React.FC<LegendItemProps> = ({ color, label, value, total }) => (
  <div className="flex items-center justify-between gap-6">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-800">
      {value} ({Math.round((value / total) * 100)}%)
    </span>
  </div>
);