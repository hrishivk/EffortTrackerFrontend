import type { ReactNode } from "react";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import HealthRing from "../HealthRing";
import StakeholderStack from "./StakeholderStack";
import { pdGetInitials, pdFormatDate, pdGetProjectStatusBadge } from "../utils";
import type { formUserData } from "../../../../../shared/types/User";

type Props = {
  project: any;
  members: formUserData[];
  totalTasks: number;
  healthPercent: number;
};

const MetaItem = ({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) => (
  <div className="pd-meta-item">
    <p className="pd-meta-label">{label}</p>
    <div className="pd-meta-value">
      {icon}
      {children}
    </div>
  </div>
);

const ProjectInfoCard = ({ project, members, totalTasks, healthPercent }: Props) => {
  const manager = members.find((m) => (m as any).role?.toUpperCase() === "AM") || members[0];
  const statusBadge = pdGetProjectStatusBadge(project.status || "active");

  return (
    <div className="pd-info-card">
      <div className="pd-info-top">
        <div className="pd-info-left">
          <div style={{ marginBottom: 12 }}>
            <span className="pd-status-badge" style={{ color: statusBadge.color, backgroundColor: statusBadge.bg }}>
              {statusBadge.label}
            </span>
            <span className="pd-project-id">PRJ-{project.id}</span>
          </div>
          <h2 className="pd-project-name">{project.name}</h2>
          <p className="pd-project-desc">
            {project.description || `Project managed under ${project.client_department || project.domain?.name || "the organization"}.`}
          </p>
        </div>
        <div className="pd-info-right">
          <HealthRing percent={healthPercent} />
          <div className="pd-manager-section">
            <div>
              <p className="pd-manager-label">Project Manager</p>
              <div className="pd-manager-info">
                <div className="pd-manager-avatar">{manager ? pdGetInitials(manager.fullName || "PM") : "PM"}</div>
                <span className="pd-manager-name">{manager?.fullName || "Not assigned"}</span>
              </div>
            </div>
            <div>
              <p className="pd-manager-label">Key Stakeholders</p>
              <StakeholderStack members={members} showOverflow />
            </div>
          </div>
        </div>
      </div>

      <div className="pd-meta-row">
        <MetaItem label="Start Date" icon={<CalendarTodayIcon sx={{ fontSize: 14, color: "#16a34a" }} />}>
          {pdFormatDate(project.start_date || project.startDate)}
        </MetaItem>
        <MetaItem label="Deadline" icon={<EventIcon sx={{ fontSize: 14, color: "#dc2626" }} />}>
          {pdFormatDate(project.end_date || project.dueDate)}
        </MetaItem>
        <MetaItem label="Total Tasks" icon={<AssignmentIcon sx={{ fontSize: 14, color: "#7c3aed" }} />}>
          {totalTasks}
        </MetaItem>
        <MetaItem label="Team Members" icon={<GroupIcon sx={{ fontSize: 14, color: "#2563eb" }} />}>
          {members.length}
        </MetaItem>
        <MetaItem label="Completion" icon={<CheckCircleIcon sx={{ fontSize: 14, color: "#16a34a" }} />}>
          {healthPercent}%
        </MetaItem>
      </div>
    </div>
  );
};

export default ProjectInfoCard;
