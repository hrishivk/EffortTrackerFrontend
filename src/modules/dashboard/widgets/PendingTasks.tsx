import React from "react";

const PendingTasks: React.FC = () => {
  const pendingTasks = [
    {
      project: "Project Alpha",
      description: "Implement user authentication",
      status: "In Progress",
      action: "Log Time",
    },
    {
      project: "Project Beta",
      description: "Fix critical bug in payment gateway",
      status: "Yet to Start",
      action: "Log Time",
    },
    {
      project: "Project Gamma",
      description: "Update API documentation",
      status: "In Progress",
      action: "Continue",
    },
  ];

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-semibold";
    switch (status) {
      case "In Progress":
        return <span className={`${base} bg-blue-100 text-blue-700`}>{status}</span>;
      case "Yet to Start":
        return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>;
      case "Completed":
        return <span className={`${base} bg-green-100 text-green-700`}>{status}</span>;
      default:
        return <span className={`${base} bg-yellow-100 text-yellow-700`}>{status}</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="!text-2xl font-bold text-gray-900">Pending Tasks</h2>
          <p className="text-gray-600 mt-1">Tasks that need attention</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="text-left font-semibold text-gray-700 py-4 px-6">Project</th>
                <th className="text-left font-semibold text-gray-700 py-4 px-4">Task Description</th>
                <th className="text-center font-semibold text-gray-700 py-4 px-4">Status</th>
                <th className="text-center font-semibold text-gray-700 py-4 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingTasks.map((task, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <td className="py-4 px-6 font-medium text-[#7D6387]">{task.project}</td>
                  <td className="py-4 px-4 text-[#7D6387]">{task.description}</td>
                  <td className="py-4 px-4 text-center text-[#7D6387]">{getStatusBadge(task.status)}</td>
                  <td className="py-4 px-4 text-center">
                    <button className="text-sm font-semibold text-[#7D6387] hover:underline text-[#7D6387]">
                      {task.action}
                    </button>
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

export default PendingTasks;
