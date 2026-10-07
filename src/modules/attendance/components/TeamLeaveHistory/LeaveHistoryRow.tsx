import { motion } from "framer-motion";
import type { LeaveRequest } from "../../types";
import { GRID, formatDate, statusBadge } from "./constants";

type Props = {
  leave: LeaveRequest;
  index: number;
  isLast: boolean;
};

const dateStyle = { fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" };
const subStyle = { fontSize: 10, color: "var(--text-faint)", display: "block" };

export default function LeaveHistoryRow({ leave, index, isLast }: Props) {
  const badge = statusBadge[leave.status || "pending"] || statusBadge.pending;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="grid items-center px-6"
      style={{
        gridTemplateColumns: GRID,
        minHeight: 64,
        paddingTop: 10,
        paddingBottom: 10,
        borderBottom: isLast ? "none" : "1px solid var(--border-light)",
      }}
    >
      <div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {leave.applicant?.fullName || leave.user?.fullName || "--"}
        </span>
        <span style={subStyle}>
          {leave.applicant?.employee_id ? `${leave.applicant.employee_id} • ` : ""}
          {leave.applicant?.role || ""}
        </span>
      </div>
      <div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
          {leave.leave_type}
        </span>
        <span style={subStyle}>{leave.session}</span>
      </div>
      <span style={dateStyle}>{formatDate(leave.start_date)}</span>
      <span style={dateStyle}>{formatDate(leave.end_date)}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
        {leave.total_days || 1}
      </span>
      <div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: badge.color,
            backgroundColor: badge.bg,
            padding: "3px 10px",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          {badge.label}
        </span>
      </div>
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        {formatDate(leave.applied_at || leave.created_at)}
      </span>
    </motion.div>
  );
}
