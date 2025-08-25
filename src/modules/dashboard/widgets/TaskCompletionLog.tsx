import React from "react";

const TaskCompletion: React.FC = () => {
  const completedTasks = [
    {
      project: "Project Delta",
      description: "Perform integration testing",
      completedDate: "July 10, 2024",
    },
    {
      project: "Project Epsilon",
      description: "Deploy new version to production",
      completedDate: "July 11, 2024",
    },
    {
      project: "Project Alpha",
      description: "Refactor user profile module",
      completedDate: "July 10, 2024",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="!text-2xl font-bold text-gray-900">Completed Tasks</h2>
          <p className="text-gray-600 mt-1">Tasks finished and logged by the team</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="text-left font-semibold text-gray-700 py-4 px-6">Project</th>
                <th className="text-left font-semibold text-gray-700 py-4 px-4">Task Description</th>
                <th className="text-center font-semibold text-gray-700 py-4 px-4">Completed Date</th>
              </tr>
            </thead>
            <tbody>
              {completedTasks.map((task, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <td className="py-4 px-6 text-[#7D6387] font-medium">{task.project}</td>
                  <td className="py-4 px-4 text-[#7D6387]">{task.description}</td>
                  <td className="py-4 px-4 text-center text-[#7D6387] font-semibold">
                    {task.completedDate}
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

export default TaskCompletion;
