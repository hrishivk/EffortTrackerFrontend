import TableList from "../../../shared/Table/Table";
import { getTeamPerformanceColumns } from "../getTeamPerformanceColumns";
import { teamPerformanceData } from "../teamPerformanceData";
import type { SpTeamPerformanceProps } from "../types";

const departments = [
  { name: "Engineering", booked: 320, available: 400, color: "bg-teal-500" },
  { name: "Design", booked: 180, available: 200, color: "bg-blue-500" },
  { name: "Product", booked: 120, available: 160, color: "bg-purple-500" },
  { name: "Marketing", booked: 60, available: 120, color: "bg-orange-500" },
];

const events = [
  {
    title: "Team Building Workshop",
    date: "July 22 • 2:00 PM - 5:00 PM",
    type: "ONSITE",
    tagColor: "bg-emerald-100 text-emerald-600",
    iconBg: "bg-emerald-50",
    icon: "👥",
  },
  {
    title: "Olivia's Birthday",
    date: "July 25 • All Day Event",
    subText: "Remote Celebration @ 10 AM",
    type: "SOCIAL",
    tagColor: "bg-pink-100 text-pink-600",
    iconBg: "bg-pink-50",
    icon: "🎂",
  },
  {
    title: "Ethan Walker (Leave)",
    date: "July 28 - Aug 02",
    subText: "Annual Leave approved",
    type: "LEAVE",
    tagColor: "bg-orange-100 text-orange-600",
    iconBg: "bg-orange-50",
    icon: "🏖️",
  },
  {
    title: "UI Design Principles Prep",
    date: "August 05 • 9:00 AM - 12:00 PM",
    subText: "Pooja & Team Alpha",
    type: "TRAINING",
    tagColor: "bg-blue-100 text-blue-600",
    iconBg: "bg-blue-50",
    icon: "🎓",
  },
];


export const TeamCapacityByDepartment = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="fw-bold text-gray-800" style={{ fontSize: "1.25rem" }}>
        Team Capacity by Department
      </h2>

      <div className="space-y-6">
        {departments.map((dept, index) => {
          const percentage = (dept.booked / dept.available) * 100;
          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 font-medium">{dept.name}</span>
                <span className="text-sm text-gray-500">
                  {dept.booked}h Booked / {dept.available}h Avail.
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`${dept.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center items-center gap-6 mt-8 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-teal-500"></span>
          Hours Booked
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-300"></span>
          Hours Available
        </div>
      </div>
    </div>
  );
};


export const UpcomingTeamEvents = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2
        className="fw-bold text-gray-800 mb-4"
        style={{ fontSize: "1.25rem" }}
      >
        Upcoming Team Events / Leave
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {events.map((event, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-3 sm:p-4 flex justify-between items-start hover:shadow-sm transition-all duration-300"
          >
            <div className="flex gap-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${event.iconBg}`}
              >
                {event.icon}
              </div>
              <div>
                <span className="font-semibold text-gray-800">
                  {event.title}
                </span>
                <p className="text-xs text-gray-500 mt-1">{event.date}</p>
                {event.subText && (
                  <p className="text-xs text-gray-400 mt-1">{event.subText}</p>
                )}
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-3 py-1 rounded-full ${event.tagColor}`}
            >
              {event.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AmTeamPerformance = ({
  page,
  setPage,
}: SpTeamPerformanceProps) => {
  return (
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
  );
};