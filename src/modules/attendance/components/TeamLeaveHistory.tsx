import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FormControl, Select, MenuItem, TextField } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  fetchTeamLeaves,
  exportTeamLeavesXlsx,
  fetchTeamMembers,
} from "../../../core/actions/leaveAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import SpinLoader from "../../../presentation/SpinLoader";
import type {
  LeaveRequest,
  TeamLeavesFilters,
  TeamMember,
} from "../types";

const PAGE_SIZE = 10;

const leaveTypes = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Leave Without Pay",
  "Compensatory Off",
  "On Duty",
];

const statusOptions: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "manager_approved", label: "Manager Approved" },
  { value: "manager_rejected", label: "Manager Rejected" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
  manager_approved: { label: "Manager Approved", color: "#2563eb", bg: "#dbeafe" },
  manager_rejected: { label: "Manager Rejected", color: "#dc2626", bg: "#fee2e2" },
  approved: { label: "Approved", color: "#16a34a", bg: "#dcfce7" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fee2e2" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },
};

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiInputBase-input": { padding: "8px 14px", fontSize: 13, color: "var(--text-primary)" },
};

const menuProps = {
  PaperProps: { sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" } },
};

const thStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#000",
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

const GRID = "1.3fr 1fr 0.9fr 0.9fr 0.5fr 1.1fr 0.9fr";

export default function TeamLeaveHistory() {
  const { showSnackbar } = useSnackbar();

  const [filters, setFilters] = useState<TeamLeavesFilters>({});
  const [page, setPage] = useState(1);

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [members, setMembers] = useState<TeamMember[]>([]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeamLeaves({ ...filters, page, limit: PAGE_SIZE });
      setLeaves(res?.data || []);
      setTotal(res?.total || 0);
    } catch {
      setLeaves([]);
      setTotal(0);
      showSnackbar({ message: "Failed to load team leaves", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [filters, page, showSnackbar]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchTeamMembers();
        setMembers(res?.data || res || []);
      } catch {
        /* silent — Employee filter will just be empty */
      }
    })();
  }, []);

  const updateFilter = (key: keyof TeamLeavesFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportTeamLeavesXlsx(filters);
      const blob = new Blob([res.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Try to read filename from Content-Disposition; fall back to date-stamped default
      const disp = (res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"])) || "";
      const match = /filename="?([^"]+)"?/i.exec(disp);
      const filename = match?.[1] || `team-leaves-${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSnackbar({ message: "Export downloaded", severity: "success" });
    } catch {
      showSnackbar({ message: "Failed to export team leaves", severity: "error" });
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "--";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const hasFilters =
    !!filters.status || !!filters.leave_type || !!filters.user_id ||
    !!filters.from_date || !!filters.to_date;

  return (
    <>
      <SpinLoader isLoading={loading} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>Team Leave History</h2>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
            All leave requests from users and developers under you. Filter and download as Excel.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || leaves.length === 0}
          className="d-flex align-items-center gap-2 text-white"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 18px",
            border: "none",
            cursor: exporting || leaves.length === 0 ? "not-allowed" : "pointer",
            opacity: exporting || leaves.length === 0 ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
          {exporting ? "Exporting..." : "Download Excel"}
        </button>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              Status
            </label>
            <FormControl fullWidth size="small" sx={selectSx}>
              <Select
                value={filters.status || ""}
                onChange={(e) => updateFilter("status", e.target.value)}
                displayEmpty
                MenuProps={menuProps}
                renderValue={(val) =>
                  val ? statusBadge[val as string]?.label || (val as string)
                      : <span style={{ color: "#9ca3af" }}>All Status</span>
                }
              >
                <MenuItem value="">All Status</MenuItem>
                {statusOptions.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              Leave Type
            </label>
            <FormControl fullWidth size="small" sx={selectSx}>
              <Select
                value={filters.leave_type || ""}
                onChange={(e) => updateFilter("leave_type", e.target.value)}
                displayEmpty
                MenuProps={menuProps}
                renderValue={(val) =>
                  val ? (val as string) : <span style={{ color: "#9ca3af" }}>All Types</span>
                }
              >
                <MenuItem value="">All Types</MenuItem>
                {leaveTypes.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              Employee
            </label>
            <FormControl fullWidth size="small" sx={selectSx}>
              <Select
                value={filters.user_id || ""}
                onChange={(e) => updateFilter("user_id", e.target.value)}
                displayEmpty
                MenuProps={menuProps}
                renderValue={(val) => {
                  if (!val) return <span style={{ color: "#9ca3af" }}>All Employees</span>;
                  const m = members.find((x) => x.id === val);
                  return m?.fullName || (val as string);
                }}
              >
                <MenuItem value="">All Employees</MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.fullName}
                    {m.employee_id ? ` (${m.employee_id})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              From
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={filters.from_date || ""}
              onChange={(e) => updateFilter("from_date", e.target.value)}
              sx={selectSx}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              To
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={filters.to_date || ""}
              onChange={(e) => updateFilter("to_date", e.target.value)}
              inputProps={{ min: filters.from_date || undefined }}
              sx={selectSx}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </div>
        </div>

        {hasFilters && (
          <div className="d-flex justify-content-end mt-3">
            <button
              onClick={clearFilters}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#7c3aed",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          className="grid items-center px-6 py-3"
          style={{ gridTemplateColumns: GRID, borderBottom: "1px solid var(--border-light)" }}
        >
          <span style={thStyle}>Employee</span>
          <span style={thStyle}>Leave Type</span>
          <span style={thStyle}>From</span>
          <span style={thStyle}>To</span>
          <span style={thStyle}>Days</span>
          <span style={thStyle}>Status</span>
          <span style={thStyle}>Applied</span>
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
            const badge = statusBadge[leave.status || "pending"] || statusBadge.pending;
            return (
              <motion.div
                key={leave.id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="grid items-center px-6"
                style={{
                  gridTemplateColumns: GRID,
                  minHeight: 64,
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderBottom: i < leaves.length - 1 ? "1px solid var(--border-light)" : "none",
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {leave.applicant?.fullName || leave.user?.fullName || "--"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block" }}>
                    {leave.applicant?.employee_id ? `${leave.applicant.employee_id} • ` : ""}
                    {leave.applicant?.role || ""}
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
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="d-flex align-items-center justify-content-between px-6"
            style={{ padding: "12px 24px", borderTop: "1px solid var(--border-light)" }}
          >
            <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 500 }}>
              Page {page} of {totalPages} • {total} total
            </span>
            <div className="d-flex align-items-center" style={{ gap: 4 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: "1px solid var(--border-light)",
                  background: page <= 1 ? "var(--bg-hover)" : "var(--bg-card)",
                  cursor: page <= 1 ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: page <= 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  style={{
                    width: 28, height: 28, borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: pg === page ? "1.5px solid #7c3aed" : "1px solid var(--border-light)",
                    background: pg === page ? "#f5f3ff" : "var(--bg-card)",
                    color: pg === page ? "#7c3aed" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: "1px solid var(--border-light)",
                  background: page >= totalPages ? "var(--bg-hover)" : "var(--bg-card)",
                  cursor: page >= totalPages ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: page >= totalPages ? 0.4 : 1,
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
