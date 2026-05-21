import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TextField } from "@mui/material";
import { useAppSelector } from "../../../store/configureStore";
import {
  fetchPendingForManager,
  fetchPendingForAdmin,
  managerLeaveAction,
  adminLeaveAction,
} from "../../../core/actions/leaveAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import SpinLoader from "../../../presentation/SpinLoader";
import type { LeaveRequest } from "../types";

const thStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#000",
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

export default function TeamLeaves() {
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const isManager = role === "AM";
  const isAdmin = role === "SP";

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = isManager
        ? await fetchPendingForManager()
        : await fetchPendingForAdmin();
      setLeaves(res.data || []);
    } catch {
      /* API not ready */
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleAction = async (leaveId: string, action: "approve" | "reject") => {
    setActionLoading(leaveId);
    try {
      if (isManager) {
        await managerLeaveAction(leaveId, action, remarks[leaveId]);
      } else {
        await adminLeaveAction(leaveId, action, remarks[leaveId]);
      }
      showSnackbar({
        message: `Leave ${action === "approve" ? "approved" : "rejected"} successfully`,
        severity: "success",
      });
      loadLeaves();
    } catch {
      showSnackbar({ message: "Action failed. Please try again.", severity: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "--";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  return (
    <>
      <SpinLoader isLoading={loading} />
      <div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
          {isManager ? "Team Leave Requests" : "Leave Approvals"}
        </h2>
        <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
          {isManager
            ? "Review and approve/reject leave requests from your team."
            : "Final approval for manager-approved leave requests."}
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)" }}
      >
        {/* Header */}
        <div
          className="grid items-center px-6 py-3"
          style={{ gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.6fr 1.5fr 1fr", borderBottom: "1px solid var(--border-light)" }}
        >
          <span style={thStyle}>Employee</span>
          <span style={thStyle}>Leave Type</span>
          <span style={thStyle}>From</span>
          <span style={thStyle}>To</span>
          <span style={thStyle}>Days</span>
          <span style={thStyle}>Reason</span>
          <span style={{ ...thStyle, textAlign: "right" }}>Action</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Loading...</span>
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span style={{ fontSize: 13, color: "var(--text-faint)" }}>No pending leave requests.</span>
          </div>
        ) : (
          leaves.map((leave, i) => (
            <motion.div
              key={leave.id || i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="px-6 py-4"
              style={{ borderBottom: i < leaves.length - 1 ? "1px solid var(--border-light)" : "none" }}
            >
              {/* Main row */}
              <div
                className="grid items-center"
                style={{ gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.6fr 1.5fr 1fr" }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {leave.applicant?.fullName || leave.user?.fullName || "--"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block" }}>
                    {leave.applicant?.email || leave.user?.email || ""}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {leave.leave_type}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block" }}>{leave.session}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                  {formatDate(leave.start_date)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                  {formatDate(leave.end_date)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
                  {leave.total_days || 1}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {leave.reason}
                </span>
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    onClick={() => leave.id && handleAction(leave.id, "approve")}
                    disabled={actionLoading === leave.id}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                      background: "linear-gradient(135deg, #16a34a, #22c55e)",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      opacity: actionLoading === leave.id ? 0.6 : 1,
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => leave.id && handleAction(leave.id, "reject")}
                    disabled={actionLoading === leave.id}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#dc2626",
                      backgroundColor: "#fee2e2",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      opacity: actionLoading === leave.id ? 0.6 : 1,
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Remarks input */}
              <div className="mt-2" style={{ maxWidth: 400, marginLeft: "auto" }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add remarks (optional)"
                  value={remarks[leave.id || ""] || ""}
                  onChange={(e) =>
                    setRemarks((prev) => ({ ...prev, [leave.id || ""]: e.target.value }))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      fontSize: 12,
                      "& fieldset": { borderColor: "var(--border-light)" },
                    },
                    "& .MuiInputBase-input": { padding: "6px 10px", fontSize: 12 },
                  }}
                />
              </div>

              {/* Show manager remarks for admin view */}
              {isAdmin && leave.manager_remarks && (
                <div className="mt-2" style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
                    Manager remarks: <em>{leave.manager_remarks}</em>
                  </span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </>
  );
}
