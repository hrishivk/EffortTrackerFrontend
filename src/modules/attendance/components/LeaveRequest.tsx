import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TextField, FormControl, Select, MenuItem } from "@mui/material";
import { applyLeave, fetchLeaveBalance } from "../../../core/actions/leaveAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import type { LeaveBalance } from "../types";

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
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

const leaveTypes = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Leave Without Pay",
  "Compensatory Off",
  "On Duty",
];

const sessions = ["Full Day", "First Half", "Second Half"] as const;

const defaultBalance = [
  { label: "Casual Leave", days: 8, color: "#14b8a6" },
  { label: "Sick Leave", days: 5, color: "#f97316" },
  { label: "Earned Leave", days: 12, color: "#7c3aed" },
];

export default function LeaveRequest({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    leaveType: "",
    session: "Full Day" as string,
    fromDate: "",
    toDate: "",
    contact: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [balanceItems, setBalanceItems] = useState(defaultBalance);
  const { showSnackbar } = useSnackbar();

  const loadBalance = useCallback(async () => {
    try {
      const res = await fetchLeaveBalance();
      if (res.data && res.data.length > 0) {
        const colorMap: Record<string, string> = {
          casual: "#14b8a6", sick: "#f97316", earned: "#7c3aed",
          "leave without pay": "#ef4444", "compensatory off": "#a855f7", "on duty": "#3b82f6",
        };
        setBalanceItems(
          res.data.map((b: LeaveBalance) => ({
            label: b.leave_type,
            days: b.remaining,
            color: colorMap[b.leave_type.toLowerCase()] || "#7c3aed",
          }))
        );
      }
    } catch {
      /* API not ready, use defaults */
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleSubmit = async () => {
    if (!form.leaveType || !form.fromDate || !form.reason) {
      showSnackbar({ message: "Please fill in leave type, from date, and reason", severity: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await applyLeave({
        leave_type: form.leaveType,
        session: form.session,
        start_date: form.fromDate,
        end_date: form.toDate || form.fromDate,
        reason: form.reason,
        contact: form.contact || undefined,
      });
      showSnackbar({ message: "Leave request submitted successfully!", severity: "success" });
      setForm({ leaveType: "", session: "Full Day", fromDate: "", toDate: "", contact: "", reason: "" });
      onSuccess?.();
    } catch {
      showSnackbar({ message: "Failed to submit leave request", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Title */}
      <div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
          Apply for Leave
        </h2>
        <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
          Please fill in the details below to submit your leave request.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left — Form */}
        <div
          className="flex-1 rounded-2xl p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Leave Type & Session */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Leave Type
              </label>
              <FormControl fullWidth size="small" sx={selectSx}>
                <Select
                  value={form.leaveType}
                  onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))}
                  displayEmpty
                  renderValue={(val) =>
                    val ? val : <span style={{ color: "#9ca3af" }}>Select Leave Type</span>
                  }
                  MenuProps={menuProps}
                >
                  {leaveTypes.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Session
              </label>
              <div
                style={{
                  display: "flex",
                  borderRadius: 12,
                  border: "1px solid var(--border-light)",
                  overflow: "hidden",
                  backgroundColor: "var(--bg-hover)",
                }}
              >
                {sessions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm((f) => ({ ...f, session: s }))}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      backgroundColor: form.session === s ? "#7c3aed" : "transparent",
                      color: form.session === s ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* From Date & To Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                From Date
              </label>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={form.fromDate}
                onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))}
                sx={selectSx}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                To Date
              </label>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={form.toDate}
                onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))}
                sx={selectSx}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </div>
          </div>

          {/* Contact Number */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Contact Number during leave
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="+1 (555) 555-5555"
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              sx={selectSx}
            />
          </div>

          {/* Reason */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Reason for Leave
            </label>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="Briefly explain the reason for your leave request..."
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              sx={selectSx}
            />
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-3">
            <button
              onClick={() => {
                setForm({ leaveType: "", session: "Full Day", fromDate: "", toDate: "", contact: "", reason: "" });
              }}
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>

        {/* Right — Leave Balance */}
        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-5">
          {/* Balance card */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px" }}>
              Current Leave Balance
            </h3>

            <div className="flex flex-col gap-4">
              {balanceItems.map((item, i) => (
                <div key={i}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                      {item.days} Days
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "var(--bg-hover)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (item.days / 15) * 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="d-flex align-items-center gap-1 mt-4"
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                color: "#7c3aed",
                cursor: "pointer",
                padding: 0,
              }}
            >
              View Detailed Balance &rsaquo;
            </button>
          </div>

          {/* Info box */}
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "#fefce8",
              border: "1px solid #fde68a",
            }}
          >
            <div className="d-flex gap-2">
              <span style={{ fontSize: 16, lineHeight: 1.2 }}>&#9888;</span>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#92400e", margin: 0, lineHeight: 1.6 }}>
                Leave requests must be submitted at least <strong>3 working days</strong> in advance for non-emergency leaves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
