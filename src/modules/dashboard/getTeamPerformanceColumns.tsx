import type { Column } from "../../shared/Table/types"

import { TrendingUp, TrendingDown } from "lucide-react"
import type { TeamPerformanceRow } from "./types"


export const getTeamPerformanceColumns = (): Column<TeamPerformanceRow>[] => [
  {
    key: "member",
    header: "Team Member",
    render: (u) => (
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold">{u.fullName}</span>
      </div>
    ),
  },

  {
    key: "projects",
    header: "Assigned Projects",
    render: (u) => (
      <div className="d-flex flex-wrap gap-1">
        {u.projects?.map((p, idx) => (
          <span
            key={idx}
            className="badge"
            style={{
              background: "#eef2ff",
              color: "#4338ca",
              fontSize: "11px",
              fontWeight: 500,
              padding: "6px 10px",
              borderRadius: "999px",
            }}
          >
            {p.name}
          </span>
        ))}
      </div>
    ),
  },

  {
    key: "yet",
    header: "Yet To Start",
    render: (u) => (
      <span className="fw-semibold text-muted">{u.yetToStart}</span>
    ),
  },

  {
    key: "progress",
    header: "In Progress",
    render: (u) => (
      <span className="fw-semibold text-muted">{u.inProgress}</span>
    ),
  },

  {
    key: "completed",
    header: "Completed",
    render: (u) => (
      <span className="fw-semibold text-muted">{u.completed}</span>
    ),
  },

  {
    key: "hours",
    header: "Total Hours",
    render: (u) => (
      <span className="fw-bold">{u.totalHours}h</span>
    ),
  },

  {
    key: "efficiency",
    header: "Efficiency",
    render: (u) => (
      <div className="d-flex align-items-center gap-2">
        <div
          style={{
            width: 60,
            height: 6,
            background: "#e5e7eb",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${u.efficiency}%`,
              height: "100%",
              background:
                u.efficiency >= 80 ? "#22c55e" : "#f59e0b",
            }}
          />
        </div>

        <span className="fw-semibold">{u.efficiency}%</span>

        {u.efficiency >= 80 ? (
          <TrendingUp size={14} color="#22c55e" />
        ) : (
          <TrendingDown size={14} color="#ef4444" />
        )}
      </div>
    ),
  },

  {
    key: "status",
    header: "Status",
    render: (u) => (
      <span
        className="status-badge"
        style={{
          background:
            u.status === "Active" ? "#ecfdf3" : "#f2f4f7",
          color:
            u.status === "Active" ? "#027a48" : "#667085",
        }}
      >
        <span className="status-dot" />
        {u.status}
      </span>
    ),
  },
]
