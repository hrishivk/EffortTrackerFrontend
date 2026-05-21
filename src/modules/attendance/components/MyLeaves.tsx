import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FormControl, Select, MenuItem } from "@mui/material";
import { fetchMyLeaves, cancelLeave } from "../../../core/actions/leaveAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import SpinLoader from "../../../presentation/SpinLoader";
import type { LeaveRequest } from "../types";

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": { borderColor: "#7c3aed", boxShadow: "0 0 0 2px rgba(124,58,237,0.1)" },
  },
  "& .MuiInputBase-input": { padding: "8px 14px", fontSize: 13, color: "var(--text-primary)" },
};

const menuProps = {
  PaperProps: { sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" } },
};

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
  manager_approved: { label: "Manager Approved", color: "#2563eb", bg: "#dbeafe" },
  manager_rejected: { label: "Manager Rejected", color: "#dc2626", bg: "#fee2e2" },
  approved: { label: "Approved", color: "#16a34a", bg: "#dcfce7" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fee2e2" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },
};

const thStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#000",
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

export default function MyLeaves() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyLeaves({ status: statusFilter || undefined });
      setLeaves(res.data || []);
    } catch {
      /* API not ready */
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleCancel = async (id: string) => {
    try {
      await cancelLeave(id);
      showSnackbar({ message: "Leave cancelled successfully", severity: "success" });
      loadLeaves();
    } catch {
      showSnackbar({ message: "Failed to cancel leave", severity: "error" });
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "--";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  return (
    <>
      <SpinLoader isLoading={loading} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>My Leaves</h2>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
            Track your leave requests and their approval status.
          </p>
        </div>
        <FormControl size="small" sx={{ minWidth: 160, ...selectSx }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty MenuProps={menuProps}
            renderValue={(val) => val ? statusBadge[val]?.label || val : <span style={{ color: "#9ca3af" }}>All Status</span>}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="manager_approved">Manager Approved</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)" }}
      >
        {/* Header */}
        <div
          className="grid items-center px-6 py-3"
          style={{ gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 1.2fr", borderBottom: "1px solid var(--border-light)" }}
        >
          <span style={thStyle}>Leave Type</span>
          <span style={thStyle}>From</span>
          <span style={thStyle}>To</span>
          <span style={thStyle}>Days</span>
          <span style={thStyle}>Status</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Loading...</span>
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span style={{ fontSize: 13, color: "var(--text-faint)" }}>No leave requests found.</span>
          </div>
        ) : (
          leaves.map((leave, i) => {
            const badge = statusBadge[leave.status || "pending"];
            return (
              <motion.div
                key={leave.id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="grid items-center px-6"
                style={{
                  gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 1.2fr",
                  height: 60,
                  borderBottom: i < leaves.length - 1 ? "1px solid var(--border-light)" : "none",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {leave.leave_type}
                  <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block" }}>{leave.session}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                  {formatDate(leave.start_date)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                  {formatDate(leave.end_date)}
                </span>
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
                  {leave.manager_remarks && (
                    <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block", marginTop: 2 }}>
                      Manager: {leave.manager_remarks}
                    </span>
                  )}
                  {leave.admin_remarks && (
                    <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block", marginTop: 1 }}>
                      Admin: {leave.admin_remarks}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </>
  );
}
