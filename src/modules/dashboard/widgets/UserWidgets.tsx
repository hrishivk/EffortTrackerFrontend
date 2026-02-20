
export const MyFocusToday = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="fw-bold text-gray-800" style={{ fontSize: "1.25rem" }}>
        My Focus Today
      </h2>

      <div className="space-y-4">
        {/* Task 1 */}
        <div className="task-card">
          <div className="flex items-center gap-3">
            <span className="status-circle"></span>
            <div>
              <p className="task-title">Refine Mobile Design System</p>
              <p className="task-subtitle">Project: Apollo App</p>
            </div>
          </div>
          <span className="badge-high">HIGH</span>
        </div>

        {/* Task 2 */}
        <div className="task-card">
          <div className="flex items-center gap-3">
            <span className="status-circle"></span>
            <div>
              <p className="task-title">API Integration</p>
              <p className="task-subtitle">Project: Backend</p>
            </div>
          </div>
          <span className="badge-medium">MEDIUM</span>
        </div>

        {/* Task 3 */}
        <div className="task-card">
          <div className="flex items-center gap-3">
            <span className="status-circle completed"></span>
            <div>
              <p className="task-title line-through text-gray-400">
                Login Module Setup
              </p>
              <p className="task-subtitle">Project: Auth</p>
            </div>
          </div>
          <span className="badge-low">LOW</span>
        </div>
      </div>
    </div>
  );
};