import { useCallback, useEffect, useMemo, useState } from "react";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
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
import { GRID, PAGE_SIZE, cardStyle, thStyle } from "./TeamLeaveHistory/constants";
import LeaveFilters from "./TeamLeaveHistory/LeaveFilters";
import LeaveHistoryRow from "./TeamLeaveHistory/LeaveHistoryRow";
import LeavePagination from "./TeamLeaveHistory/LeavePagination";

const COLUMNS = ["Employee", "Leave Type", "From", "To", "Days", "Status", "Applied"];

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

  const exportDisabled = exporting || leaves.length === 0;

  return (
    <>
      <SpinLoader isLoading={loading} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>Team Leave History</h2>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
            All leave requests from users and developers under you. Filter and download as Excel.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportDisabled}
          className="d-flex align-items-center gap-2 text-white"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 18px",
            border: "none",
            cursor: exportDisabled ? "not-allowed" : "pointer",
            opacity: exportDisabled ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
          {exporting ? "Exporting..." : "Download Excel"}
        </button>
      </div>

      <LeaveFilters
        filters={filters}
        members={members}
        onFilterChange={updateFilter}
        onClear={clearFilters}
      />

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div
          className="grid items-center px-6 py-3"
          style={{ gridTemplateColumns: GRID, borderBottom: "1px solid var(--border-light)" }}
        >
          {COLUMNS.map((col) => (
            <span key={col} style={thStyle}>{col}</span>
          ))}
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
          leaves.map((leave, i) => (
            <LeaveHistoryRow
              key={leave.id || i}
              leave={leave}
              index={i}
              isLast={i === leaves.length - 1}
            />
          ))
        )}

        <LeavePagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}
