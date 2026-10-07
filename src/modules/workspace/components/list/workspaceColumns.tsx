import type { CSSProperties, ReactNode } from "react";
import { FiGlobe, FiLock, FiUsers } from "react-icons/fi";

import type { Column } from "../../../../shared/components/Table/types";
import type { Workspace } from "../../../user/types";

const STATUS_FACE: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: "Planning", color: "#d97706", bg: "rgba(245, 158, 11, 0.14)" },
  active: { label: "Active", color: "#16a34a", bg: "rgba(34, 197, 94, 0.14)" },
  on_hold: { label: "On Hold", color: "#64748b", bg: "rgba(100, 116, 139, 0.16)" },
  completed: { label: "Completed", color: "#2563eb", bg: "rgba(59, 130, 246, 0.14)" },
};

const showDate = (value?: string | null) => {
  if (!value) return "--";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "--"
    : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const countOf = (ws: Workspace, key: "room_count" | "member_count") =>
  ws[key] ?? (key === "room_count" ? ws.rooms?.length ?? 0 : 0);

const Dash = () => <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>;

function Pill({
  children,
  color,
  bg,
  style,
  title,
}: {
  children: ReactNode;
  color: string;
  bg: string;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <span
      title={title}
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        backgroundColor: bg,
        padding: "3px 10px",
        borderRadius: 8,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export const getWorkspaceColumns = (
  open: (ws: Workspace) => void
): Column<Workspace>[] => [
  {
    key: "name",
    header: "Workspace",
    width: "30%",
    render: (ws) => (
      <div className="um-user-name">
        <div className="um-avatar">{(ws.name[0] ?? "W").toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <button
            type="button"
            className="task-name-btn"
            title={`Open ${ws.name}`}
            onClick={() => open(ws)}
          >
            {ws.name}
          </button>
          {ws.description && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--text-faint)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "min(320px, 24vw)",
              }}
            >
              {ws.description}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "project",
    header: "Project",
    render: (ws) =>
      ws.project?.name ? (
        <Pill color="#7c3aed" bg="rgba(124, 58, 237, 0.12)">
          {ws.project.name}
        </Pill>
      ) : (
        <Dash />
      ),
  },
  {
    key: "status",
    header: "Status",
    render: (ws) => {
      const face = STATUS_FACE[ws.status] ?? {
        label: ws.status,
        color: "var(--text-muted)",
        bg: "var(--bg-hover)",
      };
      return (
        <Pill color={face.color} bg={face.bg} style={{ fontSize: 10.5, fontWeight: 700, borderRadius: 7 }}>
          {face.label}
        </Pill>
      );
    },
  },
  {
    key: "rooms",
    header: "Rooms",
    render: (ws) => {
      const names = (ws.rooms ?? []).map((r) => r.name);
      const shown = names.slice(0, 2);
      const total = countOf(ws, "room_count");
      if (!total) return <Dash />;
      return (
        <span
          className="d-flex align-items-center gap-1"
          style={{ flexWrap: "wrap" }}
          title={names.join(", ")}
        >
          {shown.map((n) => (
            <Pill
              key={n}
              color="var(--text-secondary)"
              bg="var(--bg-hover)"
              style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 6 }}
            >
              {n}
            </Pill>
          ))}
          {total > shown.length && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-faint)" }}>
              +{total - shown.length}
            </span>
          )}
        </span>
      );
    },
  },
  {
    key: "members",
    header: "People",
    render: (ws) => (
      <span
        className="d-flex align-items-center gap-1"
        style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}
        title="Distinct people across its rooms"
      >
        <FiUsers size={12} style={{ color: "var(--text-faint)" }} />
        {countOf(ws, "member_count")}
      </span>
    ),
  },
  {
    key: "visibility",
    header: "Access",
    render: (ws) => {
      const shut = ws.visibility === "private";
      return (
        <Pill
          color={shut ? "#d97706" : "#16a34a"}
          bg={shut ? "rgba(245, 158, 11, 0.14)" : "rgba(34, 197, 94, 0.14)"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 9px",
            borderRadius: 7,
            width: "fit-content",
          }}
          title={
            shut
              ? "Private — its members sign in with the workspace code"
              : "Public — anyone in the organisation can open it"
          }
        >
          {shut ? <FiLock size={11} /> : <FiGlobe size={11} />}
          {shut ? "Private" : "Public"}
        </Pill>
      );
    },
  },
  {
    key: "created",
    header: "Created",
    render: (ws) => (
      <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
        {showDate(ws.created_at)}
      </span>
    ),
  },
  {
    key: "action",
    header: "",
    width: 110,
    render: (ws) => (
      <button className="btn btn-sm um-view-tasks-btn" onClick={() => open(ws)}>
        Open
      </button>
    ),
  },
];
