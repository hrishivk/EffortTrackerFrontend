import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";

import { cardStyle } from "./constants";

type Props = {
  pendingCount: number;
};

const TeamInsights = ({ pendingCount }: Props) => (
  <div className="row g-3">
    <div className="col-md-8">
      <div className="rounded-3 border p-4 text-center" style={cardStyle}>
        <InfoOutlinedIcon sx={{ fontSize: 32, color: "#9ca3af", mb: 1 }} />
        <h6 className="fw-bold mb-1" style={{ fontSize: 15 }}>
          Team Load Status
        </h6>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Design department is currently at 90% capacity. Consider
          redistributing creative tasks.
        </p>
        <button
          className="btn btn-sm"
          style={{
            border: "1px solid var(--border-light)",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 16px",
            color: "var(--text-secondary)",
          }}
        >
          View Capacity Planner
        </button>
      </div>
    </div>
    <div className="col-md-4">
      <div
        className="rounded-3 border p-4"
        style={{
          borderColor: "#e9d5ff",
          backgroundColor: "#faf5ff",
          height: "100%",
        }}
      >
        <h6 className="fw-bold mb-1" style={{ fontSize: 14, color: "#7c3aed" }}>
          Pending Assignments
        </h6>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
          {pendingCount} tasks in the backlog need attention before end of
          week.
        </p>
        <div className="d-flex justify-content-between align-items-end">
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#7c3aed",
              lineHeight: 1,
            }}
          >
            {String(pendingCount).padStart(2, "0")}
          </span>
          <ContentCopyOutlinedIcon sx={{ fontSize: 28, color: "#a78bfa" }} />
        </div>
      </div>
    </div>
  </div>
);

export default TeamInsights;
