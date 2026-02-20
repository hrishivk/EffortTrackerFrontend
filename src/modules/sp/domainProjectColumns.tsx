import { Pencil } from "lucide-react";
import type { Column } from "../../shared/Table/types";
import type { ProjectRow } from "./types";

const statusStyles: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "#ecfdf5", text: "#059669" },
  "ON HOLD": { bg: "#fff7ed", text: "#ea580c" },
  COMPLETED: { bg: "#f0fdf4", text: "#16a34a" },
};

export const getProjectColumns = (
  onManageMembers?: (rowId: number) => void,
): Column<ProjectRow>[] => [
  {
    key: "name",
    header: "Project Name",
    render: (row) => (
      <div className="d-flex align-items-center gap-2">
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor:
              row.status === "ACTIVE"
                ? "#7c3aed"
                : row.status === "ON HOLD"
                  ? "#ea580c"
                  : "#16a34a",
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{row.name}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {row.status === "COMPLETED" ? "Completed" : "Due"}: {row.dueDate}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "clientDepartment",
    header: "Client / Department",
    render: (row) => (
      <span style={{ fontSize: 14, color: "#374151" }}>
        {row.clientDepartment}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => {
      const style = statusStyles[row.status] || statusStyles.ACTIVE;
      return (
        <span
          style={{
            backgroundColor: style.bg,
            color: style.text,
            fontWeight: 600,
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 6,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {row.status}
        </span>
      );
    },
  },
  {
    key: "progress",
    header: "Progress",
    render: (row) => (
      <div className="d-flex align-items-center gap-2" style={{ minWidth: 120 }}>
        <div
          style={{
            flex: 1,
            height: 8,
            borderRadius: 99,
            backgroundColor: "#e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${row.progress}%`,
              height: "100%",
              borderRadius: 99,
              background:
                row.progress === 100
                  ? "#16a34a"
                  : "linear-gradient(90deg, #7c3aed, #a855f7)",
            }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
          {row.progress}%
        </span>
      </div>
    ),
  },
  {
    key: "teamAssigned",
    header: "Team Assigned",
    render: (row) => (
      <div className="d-flex align-items-center">
        {row.teamAssigned.slice(0, 3).map((member, i) => (
          <div
            key={i}
            title={member.name}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: ["#7c3aed", "#ec4899", "#f59e0b", "#06b6d4"][
                i % 4
              ],
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
              marginLeft: i > 0 ? -8 : 0,
            }}
          >
            {member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
        ))}
        {row.teamAssigned.length > 3 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#7c3aed",
              marginLeft: 4,
            }}
          >
            +{row.teamAssigned.length - 3}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: (row) => (
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-sm text-white"
          style={{
            backgroundColor: "#7c3aed",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 12px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onManageMembers?.(row.id);
          }}
        >
          Manage Members
        </button>
        <button className="btn btn-link p-0" style={{ color: "#6b7280" }}>
          <Pencil size={14} />
        </button>
      </div>
    ),
  },
];
