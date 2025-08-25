
import { useAppSelector } from "../../../store/configureStore";

const WeeklySummary = () => {
 

  const weeklyData = [
    { day: "Monday", hours: 8, completed: 5, pending: 2 },
    { day: "Tuesday", hours: 7, completed: 4, pending: 1 },
    { day: "Wednesday", hours: 8, completed: 6, pending: 3 },
    { day: "Thursday", hours: 9, completed: 3, pending: 2 },
    { day: "Friday", hours: 0, completed: 0, pending: 0 },
    { day: "Saturday", hours: 0, completed: 0, pending: 0 },
    { day: "Sunday", hours: 0, completed: 0, pending: 0 },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="!text-3xl font-bold text-gray-900">My Week</h1>
          <p className="text-gray-600 mt-1">Weekly breakdown of hours and task status</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="text-left font-semibold text-gray-700 py-4 px-6">Day</th>
                <th className="text-center font-semibold text-gray-700 py-4 px-4">Hours Logged</th>
                <th className="text-center font-semibold text-gray-700 py-4 px-4">Completed Tasks</th>
                <th className="text-center font-semibold text-gray-700 py-4 px-4">Pending Tasks</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                  <td className="py-4 px-6 text-[#7D6387] font-medium">{day.day}</td>
                  <td className="py-4 px-4 text-center text-[#7D6387]">
                    {day.hours > 0 ? `${day.hours} hrs` : "-"}
                  </td>
                  <td className="py-4 px-4 text-center text-green-700 font-semibold">
                    {day.completed > 0 ? day.completed : "-"}
                  </td>
                  <td className="py-4 px-4 text-center text-red-600 font-semibold">
                    {day.pending > 0 ? day.pending : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

  
    </div>
  );
};

export default WeeklySummary;
