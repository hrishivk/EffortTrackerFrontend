import type { Column } from "../../../shared/components/Table/types";
import type { ProjectRow } from "../types";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: "#ecfdf5", text: "#059669", label: "Active" },
  "ON HOLD": { bg: "#fff7ed", text: "#ea580c", label: "On Hold" },
  ON_HOLD: { bg: "#fff7ed", text: "#ea580c", label: "On Hold" },
  PAUSED: { bg: "#fef3c7", text: "#d97706", label: "Paused" },
  COMPLETED: { bg: "#f0fdf4", text: "#16a34a", label: "Completed" },
};

const normalizeStatus = (s: string) =>
  s.toLowerCase().replace(/\s+/g, "_");

export const getProjectColumns = (
  onManageMembers?: (rowId: number) => void,
  onStatusChange?: (rowId: number, currentStatus: string) => void,
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
              normalizeStatus(row.status) === "active"
                ? "#7c3aed"
                : normalizeStatus(row.status) === "completed"
                  ? "#16a34a"
                  : "#ea580c",
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{row.name}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {normalizeStatus(row.status) === "completed" ? "Completed" : "Due"}: {row.dueDate}
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
      const style = statusStyles[row.status] || statusStyles[row.status.replace(" ", "_")] || statusStyles.ACTIVE;
      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange?.(row.id, row.status);
          }}
          style={{
            backgroundColor: style.bg,
            color: style.text,
            fontWeight: 600,
            fontSize: 11,
            padding: "4px 12px",
            borderRadius: 6,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            cursor: "pointer",
            border: `1px solid ${style.text}20`,
          }}
        >
          {style.label}
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
              backgroundColor: "#7c3aed",
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
    ),
  },
];
