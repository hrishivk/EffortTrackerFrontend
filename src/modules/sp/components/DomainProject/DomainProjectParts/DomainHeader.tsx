import { useNavigate } from "react-router-dom";
import { fetchTasksByProject } from "../../../../../core/actions/action";
import { exportProjectReport } from "../../../../../shared/utils/exportProjectReport";
import { exportTaskReport } from "../../../../../shared/utils/exportTaskReport";
import type { DomainTab } from "../../../types";

const buttonStyle = (backgroundColor: string) => ({
  backgroundColor,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  padding: "6px 16px",
});

type Props = {
  activeTab: DomainTab;
  isAM: boolean;
  canManage: boolean;
  currentRole: string;
  selectedProjectId: string | number | null;
  rawProjects: any[];
};

const DomainHeader = ({
  activeTab,
  isAM,
  canManage,
  currentRole,
  selectedProjectId,
  rawProjects,
}: Props) => {
  const navigate = useNavigate();
  const isOverview = activeTab === "overview";

  const handleExport = async () => {
    if (selectedProjectId) {
      const proj = rawProjects.find((p: any) => String(p.id) === String(selectedProjectId));
      const projName = proj?.name || "Project";
      try {
        const allTaskRes = await fetchTasksByProject(projName, { page: 1, limit: 1000 });
        const allTasks = allTaskRes?.data || [];
        exportTaskReport({ tasks: allTasks, projectName: projName });
      } catch {
        alert("Failed to fetch tasks for export.");
      }
    } else {
      exportProjectReport({ rawProjects });
    }
  };

  const createButtons = isAM
    ? [
        { label: "+ Create Department", color: "#7c3aed", path: "create-domain" },
        { label: "+ Create Projects", color: "#7c3aed", path: "create-project" },
      ]
    : canManage
      ? [
          { label: "+ Add Department", color: "#4f46e5", path: "create-domain" },
          { label: "+ Add Project", color: "#9333ea", path: "create-project" },
        ]
      : [];

  return (
    <div className="d-flex justify-content-between align-items-start mt-4 mb-4">
      <div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "var(--text-primary)" }}>
          {isAM
            ? isOverview
              ? "Executive Project List"
              : "All Completed Projects Timeline"
            : "Departments & Projects"}
        </h2>
        <p className="mt-2 mb-0" style={{ fontSize: "0.90rem", color: "var(--text-muted)" }}>
          {isAM
            ? isOverview
              ? "High-level overview of all active initiatives and project health."
              : "Historical view of delivered initiatives and retrospective data."
            : canManage
              ? "Manage all departments and their associated projects"
              : "The departments and projects you are part of"}
        </p>
      </div>

      <div className="d-flex align-items-center gap-2">
        {isOverview ? (
          createButtons.map((btn) => (
            <button
              key={btn.path}
              className="btn text-white"
              style={buttonStyle(btn.color)}
              onClick={() => navigate(`/${currentRole}/${btn.path}`)}
            >
              {btn.label}
            </button>
          ))
        ) : (
          <button className="btn text-white" style={buttonStyle("#7c3aed")} onClick={handleExport}>
            {selectedProjectId ? "Export Task Report" : "Export Report"}
          </button>
        )}
      </div>
    </div>
  );
};

export default DomainHeader;
