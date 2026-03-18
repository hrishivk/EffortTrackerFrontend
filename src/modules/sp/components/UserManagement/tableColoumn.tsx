import dayjs from "dayjs";
import { Trash2 } from "lucide-react";
import type { Column } from "../../../../shared/components/Table/types";
import type { formUserData } from "../../../../shared/types/User";
import type { ColumnHandlers } from "../../types";

const roleStyles: Record<string, { bg: string; text: string }> = {
  SP: { bg: "#f0fdf4", text: "#16a34a" },
  AM: { bg: "#eff6ff", text: "#2563eb" },
  USER: { bg: "#f5f3ff", text: "#7c3aed" },
  DEVLOPER: { bg: "#fef3c7", text: "#d97706" },
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const getUserColumns = ({
  onViewTasks,
  onDeleteUser,
}: ColumnHandlers): Column<formUserData>[] => [
  {
    key: "name",
    header: "Name",
    width: "30%",
    render: (u) => (
      <div className="um-user-name">
        <div className="um-avatar">{getInitials(u.fullName)}</div>
        <div>
          <div className="um-name-text">{u.fullName}</div>
          <div className="um-email-text">{u.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: "project",
    header: "Project(s)",
    width: "18%",
    render: (u) => {
      if (!u.projects || u.projects.length === 0)
        return <span className="um-no-activity">No projects</span>;
      return (
        <div className="d-flex flex-wrap gap-1">
          {u.projects.slice(0, 2).map((p) => (
            <span key={p.id} className="um-project-badge">
              {p.name}
            </span>
          ))}
          {u.projects.length > 2 && (
            <span className="um-project-more">
              +{u.projects.length - 2}
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: "role",
    header: "Role",
    width: "10%",
    render: (u) => {
      const style = roleStyles[u.role] || roleStyles.USER;
      return (
        <span
          className="um-role-badge"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {u.role}
        </span>
      );
    },
  },
  {
    key: "lastActive",
    header: "Last Active",
    width: "20%",
    render: (u) => {
      if (!u.lastSeenAt) {
        return (
          <span className="d-flex align-items-center gap-1">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#16a34a" }}>Active</span>
          </span>
        );
      }
      const parsed = dayjs(u.lastSeenAt);
      if (parsed.isValid()) {
        return (
          <span className="um-last-active">
            {parsed.format("DD MMM YYYY, h:mm A")}
          </span>
        );
      }
      return <span className="um-no-activity">{String(u.lastSeenAt)}</span>;
    },
  },
  {
    key: "tasks",
    header: "Tasks",
    width: "12%",
    render: (u) => (
      <button
        className="btn btn-sm um-view-tasks-btn"
        onClick={() => onViewTasks(u.id!)}
      >
        View Tasks
      </button>
    ),
  },
  {
    key: "actions",
    header: "",
    width: 50,
    render: (u) => (
      <button
        className="btn btn-sm um-delete-btn"
        onClick={() => onDeleteUser(u.id!)}
        title="Delete user"
      >
        <Trash2 size={14} />
      </button>
    ),
  },
];
