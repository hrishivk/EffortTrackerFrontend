import dayjs from "dayjs";
import { Pencil, Trash2 } from "lucide-react";
import { CAvatar } from "@coreui/react";
import type { Column } from "../../shared/Table/types";
import type { formUserData } from "../../shared/User/types";
import type { ColumnHandlers } from "./types";
export const getUserColumns = ({
  onViewTasks,
  onEditUser,
  onDeleteUser,
  avatarSrc,
}: ColumnHandlers): Column<formUserData>[] => [
  {
    key: "name",
    header: "Name",
    render: (u) => (
      <div className="d-flex align-items-center gap-2">
        <CAvatar src={avatarSrc} />
        {u.fullName}
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    render: (u) => u.email,
  },
  {
    key: "project",
    header: "Project(s)",
    render: (u) => {
      if (!u.projects || u.projects.length === 0) return "—";
      return u.projects.map((p) => p.name).join(", ");
    },
  },

  {
    key: "role",
    header: "Role",
    render: (u) => <span className="badge text-bg-light">{u.role}</span>,
  },
  {
    key: "lastActive",
    header: "Last Active",
    render: (u) =>
      u.lastSeenAt ? (
        <span>
          Last seen {dayjs(u.lastSeenAt).format("DD MMM YYYY, h:mm A")}
        </span>
      ) : (
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
          <span style={{ color: "#22c55e" }}>Active</span>
        </span>
      ),
  },
  {
    key: "tasks",
    header: "Tasks",
    render: (u) => (
      <button
        className="btn btn-link p-1 text-decoration-none fs-6"
        onClick={() => onViewTasks(u.id!)}
      >
        <span
          style={{
            fontSize: "85%",
            fontWeight: "bold",
          }}
        >
          View
        </span>
      </button>
    ),
  },

  {
    key: "actions",
    header: "Actions",
    render: (u) => (
      <div className="d-flex gap-2">
        <button
          className="btn btn-link p-0"
          style={{ color: "#6f42c1" }}
          onClick={() => onEditUser(u.id!)}
        >
          <Pencil size={16} />
        </button>
        <button
          className="btn btn-link p-0"
          style={{ color: "#dc3545" }}
          onClick={() => onDeleteUser(u.id!)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    ),
  },
];
