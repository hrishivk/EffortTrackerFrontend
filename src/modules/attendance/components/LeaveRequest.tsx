import { useCallback, useEffect, useState } from "react";
import { TextField, FormControl, Select, MenuItem } from "@mui/material";
import { applyLeave, fetchLeaveBalance } from "../../../core/actions/leaveAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { leaveRequestValidationSchema } from "../../../utils/validation/Validation";
import type { LeaveBalance } from "../types";
import FormField from "./LeaveRequest/FormField";
import LeaveBalanceCard from "./LeaveRequest/LeaveBalanceCard";
import {
  EMPTY_FORM,
  balanceColorMap,
  defaultBalance,
  errorSx,
  leaveTypes,
  menuProps,
  selectSx,
  sessions,
  toValidationPayload,
  type LeaveForm,
} from "./LeaveRequest/leaveRequestConstants";

export default function LeaveRequest({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState<LeaveForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [balanceItems, setBalanceItems] = useState(defaultBalance);
  const { showSnackbar } = useSnackbar();

  const validateField = (field: string, nextForm: LeaveForm) => {
    const result = leaveRequestValidationSchema.safeParse(toValidationPayload(nextForm));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (!result.success) {
        const firstForField = result.error.errors.find(
          (err) => err.path[0] === field,
        );
        if (firstForField) next[field] = firstForField.message;
      }
      return next;
    });
  };

  const updateField = (field: keyof LeaveForm, value: string) => {
    setForm((prev) => {
      const nextForm = { ...prev, [field]: value };
      validateField(field, nextForm);
      if (field === "fromDate" && nextForm.toDate) validateField("toDate", nextForm);
      return nextForm;
    });
  };

  const sx = (field: string) => (errors[field] ? errorSx : selectSx);

  const loadBalance = useCallback(async () => {
    try {
      const res = await fetchLeaveBalance();
      if (res.data && res.data.length > 0) {
        setBalanceItems(
          res.data.map((b: LeaveBalance) => ({
            label: b.leave_type,
            days: b.remaining,
            color: balanceColorMap[b.leave_type.toLowerCase()] || "#7c3aed",
          }))
        );
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleSubmit = async () => {
    const result = leaveRequestValidationSchema.safeParse(toValidationPayload(form));
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      const firstError = result.error.errors[0]?.message;
      showSnackbar({ message: firstError || "Please fix the highlighted fields", severity: "error" });
      return;
    }
    setErrors({});
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
      setForm(EMPTY_FORM);
      onSuccess?.();
    } catch {
      showSnackbar({ message: "Failed to submit leave request", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
          Apply for Leave
        </h2>
        <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
          Please fill in the details below to submit your leave request.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div
          className="flex-1 rounded-2xl p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <FormField label="Leave Type" error={errors.leaveType}>
              <FormControl fullWidth size="small" error={!!errors.leaveType} sx={sx("leaveType")}>
                <Select
                  value={form.leaveType}
                  onChange={(e) => updateField("leaveType", e.target.value)}
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
            </FormField>

            <FormField label="Session">
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
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <FormField label="From Date" error={errors.fromDate}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={form.fromDate}
                onChange={(e) => updateField("fromDate", e.target.value)}
                error={!!errors.fromDate}
                sx={sx("fromDate")}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FormField>
            <FormField label="To Date" error={errors.toDate}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={form.toDate}
                onChange={(e) => updateField("toDate", e.target.value)}
                error={!!errors.toDate}
                inputProps={{ min: form.fromDate || undefined }}
                sx={sx("toDate")}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FormField>
          </div>

          <FormField label="Contact Number during leave" error={errors.contact} className="mb-5">
            <TextField
              fullWidth
              size="small"
              placeholder="10-digit mobile number"
              value={form.contact}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                updateField("contact", digits);
              }}
              inputProps={{ inputMode: "numeric", maxLength: 10 }}
              error={!!errors.contact}
              sx={sx("contact")}
            />
          </FormField>

          <FormField label="Reason for Leave" error={errors.reason} className="mb-5">
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="Briefly explain the reason for your leave request..."
              value={form.reason}
              onChange={(e) => updateField("reason", e.target.value)}
              error={!!errors.reason}
              sx={sx("reason")}
            />
          </FormField>

          <div className="d-flex justify-content-end gap-3">
            <button
              onClick={() => {
                setForm(EMPTY_FORM);
                setErrors({});
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

        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-5">
          {false && <LeaveBalanceCard items={balanceItems} />}

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
