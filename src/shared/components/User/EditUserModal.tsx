 import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress, MenuItem, Select, Switch, TextField } from "@mui/material";
import { FiCheck, FiChevronDown, FiInfo, FiLock, FiUser, FiX } from "react-icons/fi";
import { Eye, EyeOff } from "lucide-react";
import dayjs from "dayjs";

import { edituser, fetchUserDetails } from "../../../core/actions/spAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useAppSelector } from "../../../store/configureStore";
import {
  editUserValidationSchema,
  userPasswordValidationSchema,
} from "../../../utils/validation/Validation";
import type { formUserData, UserDetails } from "../../types/User";
import type { project } from "../../types/Project";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-surface)",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
    },
  },
  "& .MuiInputBase-input": {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  "& .MuiSelect-select": { padding: "10px 14px", color: "var(--text-primary)" },
  "& .MuiSelect-icon": { color: "var(--text-muted)" },
};

const errorSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    backgroundColor: "#fef2f2",
    "& fieldset": { borderColor: "#ef4444" },
    "&:hover fieldset": { borderColor: "#dc2626" },
    "&.Mui-focused fieldset": {
      borderColor: "#dc2626",
      boxShadow: "0 0 0 2px rgba(239,68,68,0.12)",
    },
  },
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const ROLE_LABELS: Record<string, string> = {
  SP: "Super Admin",
  AM: "Manager",
  USER: "User",
  DEVLOPER: "Developer",
};

/** How many project chips fit before the rest collapse into a "+n" pill. */
const VISIBLE_CHIPS = 3;

type Tab = "details" | "password";

export interface EditUserModalProps {
  open: boolean;
  /** The row being edited; null while closed. */
  user: formUserData | null;
  /** Projects to choose from — already loaded by the list screen. */
  projects: project[];
  onClose: () => void;
  /** Called after a successful save so the list can refetch. */
  onSaved: () => void;
}

const emptyForm = {
  fullName: "",
  email: "",
  role: "",
  contactNumber: "",
  jobTitle: "",
  employeeId: "",
  dateOfBirth: "",
  bloodGroup: "",
  joiningDate: "",
  projects: [] as string[],
  is_shared: false,
};

/**
 * list-users keeps lastSeenAt as free text: an ISO string, null, or the literal
 * "No login activity recorded" for someone who never signed in. user-details
 * normalises it, but the row fallback still carries the raw value, so both
 * paths go through here.
 */
const formatLastSeen = (value?: string | Date | null) => {
  if (!value) return "Active now";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY, h:mm A") : "No login activity";
};

const formatCreatedOn = (value?: string | null) => {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY, h:mm A") : "—";
};

/** Date-only fields feed <input type="date">, which only accepts YYYY-MM-DD. */
const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const EditUserModal: React.FC<EditUserModalProps> = ({
  open,
  user,
  projects,
  onClose,
  onSaved,
}) => {
  const { showSnackbar } = useSnackbar();
  const { user: currentUser } = useAppSelector((state) => state.user);
  const role = currentUser?.role?.toUpperCase();

  const [tab, setTab] = useState<Tab>("details");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  /**
   * The caller drops `user` to null on close, which would yank the panel out
   * mid-animation. Render the last row we saw until the exit finishes.
   */
  const [lastRow, setLastRow] = useState<formUserData | null>(null);
  useEffect(() => {
    if (user) setLastRow(user);
  }, [user]);
  const row = user ?? lastRow;

  /**
   * Two-step fill. The list-users row we were handed paints the form instantly,
   * so the modal opens with no wait, then user-details replaces it with the full
   * record and is what the form falls back to if that call fails.
   *
   * Only Employee ID / DOB / Blood Group / Joining Date genuinely need the call
   * — the row carries no value for them, and handleSaveDetails PATCHes every
   * field, so saving before they arrive would blank them. Those four inputs and
   * the Update button stay disabled until `loading` clears.
   */
  useEffect(() => {
    if (!open || !user) return;
    setTab("details");
    setErrors({});
    setPickerOpen(false);
    setPasswords({ password: "", confirmPassword: "" });
    setShowPassword(false);
    setDetails(null);
    setForm({
      ...emptyForm,
      fullName: user.fullName || "",
      email: user.email || "",
      role: (user.role || "").toUpperCase(),
      contactNumber: user.contactNumber || "",
      jobTitle: user.jobTitle || "",
      projects: (user.projects || []).map((p) => String(p.id)),
      is_shared: Boolean(user.is_shared),
    });

    if (!user.id) return;
    let cancelled = false;
    setLoading(true);
    fetchUserDetails(user.id)
      .then((data) => {
        if (cancelled || !data) return;
        setDetails(data);
        setForm({
          fullName: data.fullName || "",
          email: data.email || "",
          role: (data.role || "").toUpperCase(),
          contactNumber: data.contactNumber || "",
          jobTitle: data.jobTitle || "",
          employeeId: data.employeeId || "",
          dateOfBirth: toDateInput(data.dateOfBirth),
          bloodGroup: data.bloodGroup || "",
          joiningDate: toDateInput(data.joiningDate),
          projects: (data.projects || []).map((p) => String(p.id)),
          is_shared: Boolean(data.is_shared),
        });
      })
      .catch((error: any) => {
        if (cancelled) return;
        // The row data is already on screen, so this degrades rather than blocks.
        showSnackbar({
          message:
            error?.response?.data?.message ||
            "Could not load the full profile — showing what the list had.",
          severity: "error",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // showSnackbar is stable; depending on it would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Click-away for the project dropdown, which floats over the section below it.
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [pickerOpen]);

  /**
   * SP manages managers, AM manages its own team. The user's current role is
   * always listed so an existing value is never silently dropped on save.
   */
  const roleOptions = useMemo(() => {
    const base = role === "SP" ? ["AM"] : ["USER", "DEVLOPER"];
    const current = (user?.role || "").toUpperCase();
    return current && !base.includes(current) ? [current, ...base] : base;
  }, [role, user?.role]);

  const selectedProjects = useMemo(
    () =>
      form.projects
        .map((id) => projects.find((p) => String(p.id) === id))
        .filter((p): p is project => Boolean(p)),
    [form.projects, projects],
  );

  const setField = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleProject = (id: string) =>
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.includes(id)
        ? prev.projects.filter((p) => p !== id)
        : [...prev.projects, id],
    }));

  const sx = (field: string) => (errors[field] ? errorSx : inputSx);

  const handleSaveDetails = async () => {
    if (!user?.id) return;

    const result = editUserValidationSchema.safeParse({
      fullName: form.fullName,
      email: form.email,
      role: form.role,
      contactNumber: form.contactNumber || undefined,
      jobTitle: form.jobTitle || undefined,
      employeeId: form.employeeId || undefined,
      bloodGroup: form.bloodGroup || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      joiningDate: form.joiningDate || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      showSnackbar({
        message: result.error.errors[0]?.message || "Validation failed",
        severity: "error",
      });
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await edituser({
        id: user.id,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        // Comma-separated ids, the same shape add-user takes.
        projects: form.projects.join(","),
        contactNumber: form.contactNumber,
        jobTitle: form.jobTitle,
        employeeId: form.employeeId,
        dateOfBirth: form.dateOfBirth,
        bloodGroup: form.bloodGroup,
        joiningDate: form.joiningDate,
        // Carried back untouched so a save never re-parents the user.
        ...(details?.manager_id !== undefined
          ? { manager_id: details.manager_id }
          : {}),
        ...(role === "SP" ? { is_shared: form.is_shared } : {}),
      });

      showSnackbar({ message: "User updated successfully", severity: "success" });
      onSaved();
      onClose();
    } catch (error: any) {
      showSnackbar({
        message:
          error?.response?.data?.message || error?.message || "Failed to update user",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!user?.id) return;

    const result = userPasswordValidationSchema.safeParse(passwords);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      showSnackbar({
        message: result.error.errors[0]?.message || "Validation failed",
        severity: "error",
      });
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await edituser({ id: user.id, password: passwords.password });
      showSnackbar({ message: "Password updated successfully", severity: "success" });
      setPasswords({ password: "", confirmPassword: "" });
      onSaved();
      onClose();
    } catch (error: any) {
      showSnackbar({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update password",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const lastActive = formatLastSeen(details?.lastSeenAt ?? row?.lastSeenAt);
  const createdOn = formatCreatedOn(details?.createdAt);

  return (
    <AnimatePresence>
      {open && row && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="eu-backdrop"
            onClick={onClose}
          />

          <div className="eu-wrap">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="eu-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Edit user"
            >
              <header className="eu-head">
                <h3>Edit User</h3>
                <button
                  type="button"
                  className="eu-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </header>

              <div className="eu-tabs">
                <button
                  type="button"
                  className={`eu-tab ${tab === "details" ? "is-active" : ""}`}
                  onClick={() => {
                    setTab("details");
                    setErrors({});
                  }}
                >
                  <FiUser size={15} />
                  User Details
                </button>
                <button
                  type="button"
                  className={`eu-tab ${tab === "password" ? "is-active" : ""}`}
                  onClick={() => {
                    setTab("password");
                    setErrors({});
                  }}
                >
                  <FiLock size={15} />
                  Change Password
                </button>
              </div>

              {tab === "details" ? (
                <div className="eu-body">
                  <p className="eu-section-title">Basic Information</p>
                  <div className="eu-grid">
                    <div>
                      <label className="eu-label">
                        Full Name<span className="eu-req">*</span>
                      </label>
                      <TextField
                        fullWidth
                        size="small"
                        sx={sx("fullName")}
                        value={form.fullName}
                        onChange={(e) => setField("fullName", e.target.value)}
                      />
                      {errors.fullName && <p className="eu-error">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="eu-label">
                        Email Address<span className="eu-req">*</span>
                      </label>
                      <TextField
                        fullWidth
                        size="small"
                        sx={sx("email")}
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value.trim())}
                      />
                      {errors.email && <p className="eu-error">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="eu-label">
                        Role<span className="eu-req">*</span>
                      </label>
                      <Select
                        fullWidth
                        size="small"
                        sx={sx("role")}
                        value={form.role}
                        onChange={(e) => setField("role", e.target.value)}
                      >
                        {roleOptions.map((r) => (
                          <MenuItem key={r} value={r}>
                            {ROLE_LABELS[r] || r}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.role && <p className="eu-error">{errors.role}</p>}
                    </div>

                    <div>
                      <label className="eu-label">Phone Number</label>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="10-digit number"
                        sx={sx("contactNumber")}
                        value={form.contactNumber}
                        onChange={(e) =>
                          setField("contactNumber", e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                      />
                      {errors.contactNumber && (
                        <p className="eu-error">{errors.contactNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="eu-label">Designation</label>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Intern"
                        sx={sx("jobTitle")}
                        value={form.jobTitle}
                        onChange={(e) => setField("jobTitle", e.target.value)}
                      />
                      {errors.jobTitle && <p className="eu-error">{errors.jobTitle}</p>}
                    </div>
                  </div>

                  <p className="eu-section-title eu-section-title-row">
                    Employment
                    {loading && (
                      <span className="eu-section-loading">
                        <CircularProgress size={13} thickness={5} sx={{ color: "#6d28d9" }} />
                        Loading…
                      </span>
                    )}
                  </p>
                  <div className={`eu-grid ${loading ? "is-loading" : ""}`}>
                    <div>
                      <label className="eu-label">Employee ID</label>
                      <TextField
                        fullWidth
                        size="small"
                        disabled={loading}
                        sx={sx("employeeId")}
                        value={form.employeeId}
                        onChange={(e) => setField("employeeId", e.target.value)}
                      />
                      {errors.employeeId && <p className="eu-error">{errors.employeeId}</p>}
                    </div>

                    <div>
                      <label className="eu-label">Date of Birth</label>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        disabled={loading}
                        sx={sx("dateOfBirth")}
                        value={form.dateOfBirth}
                        onChange={(e) => setField("dateOfBirth", e.target.value)}
                      />
                      {errors.dateOfBirth && <p className="eu-error">{errors.dateOfBirth}</p>}
                    </div>

                    <div>
                      <label className="eu-label">Blood Group</label>
                      <Select
                        fullWidth
                        size="small"
                        displayEmpty
                        disabled={loading}
                        sx={sx("bloodGroup")}
                        value={form.bloodGroup}
                        onChange={(e) => setField("bloodGroup", e.target.value)}
                      >
                        <MenuItem value="">
                          <span style={{ color: "var(--text-muted)" }}>Not set</span>
                        </MenuItem>
                        {BLOOD_GROUPS.map((group) => (
                          <MenuItem key={group} value={group}>
                            {group}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.bloodGroup && <p className="eu-error">{errors.bloodGroup}</p>}
                    </div>

                    <div>
                      <label className="eu-label">Joining Date</label>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        disabled={loading}
                        sx={sx("joiningDate")}
                        value={form.joiningDate}
                        onChange={(e) => setField("joiningDate", e.target.value)}
                      />
                      {errors.joiningDate && <p className="eu-error">{errors.joiningDate}</p>}
                    </div>
                  </div>

                  <p className="eu-section-title">Projects &amp; Access</p>
                  <div className="eu-grid">
                    <div className="eu-field-full">
                      <label className="eu-label">Projects</label>
                      <div className="eu-picker" ref={pickerRef}>
                        <div
                          className={`eu-picker-control ${pickerOpen ? "is-open" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setPickerOpen((prev) => !prev)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setPickerOpen((prev) => !prev);
                            }
                          }}
                        >
                          {selectedProjects.length === 0 ? (
                            <span className="eu-picker-placeholder">No projects assigned</span>
                          ) : (
                            <>
                              <span className="eu-chips">
                                {selectedProjects.slice(0, VISIBLE_CHIPS).map((p) => (
                                  <span key={p.id} className="eu-chip">
                                    {p.name}
                                    <button
                                      type="button"
                                      aria-label={`Remove ${p.name}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleProject(String(p.id));
                                      }}
                                    >
                                      <FiX size={12} />
                                    </button>
                                  </span>
                                ))}
                              </span>
                              {selectedProjects.length > VISIBLE_CHIPS && (
                                <span className="eu-chip-more">
                                  +{selectedProjects.length - VISIBLE_CHIPS}
                                </span>
                              )}
                            </>
                          )}
                          <FiChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                        </div>

                        {pickerOpen && (
                          <div className="eu-picker-menu">
                            {projects.length === 0 ? (
                              <p className="eu-picker-empty">No projects available</p>
                            ) : (
                              projects.map((p) => {
                                const isActive = form.projects.includes(String(p.id));
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className={`eu-picker-option ${isActive ? "is-active" : ""}`}
                                    onClick={() => toggleProject(String(p.id))}
                                  >
                                    <span>{p.name}</span>
                                    {isActive && <FiCheck size={15} />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Domains decide which managers see a shared user; they are
                        assigned at creation and not editable here yet. */}
                    {form.is_shared && (
                      <div className="eu-field-full">
                        <label className="eu-label">Departments</label>
                        <div className="eu-readonly eu-readonly-chips">
                          {details?.domains?.length ? (
                            details.domains.map((d) => (
                              <span key={d.id} className="eu-chip">
                                {d.name}
                              </span>
                            ))
                          ) : (
                            <span>No departments assigned</span>
                          )}
                        </div>
                        <p className="eu-hint">
                          Managers in these departments can see this shared user.
                        </p>
                      </div>
                    )}

                    {/* Only a super admin may flip sharing on an existing user. */}
                    {role === "SP" && (
                      <div className="eu-field-full">
                        <div className="eu-toggle-row">
                          <label htmlFor="eu-is-shared" style={{ margin: 0 }}>
                            <strong>Shared across all managers</strong>
                            <span>
                              For staff who work across every project (testers, QA,
                              designers).
                            </span>
                          </label>
                          <Switch
                            id="eu-is-shared"
                            size="small"
                            checked={form.is_shared}
                            onChange={(e) => setField("is_shared", e.target.checked)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="eu-section-title">Account Information</p>
                  <div className="eu-grid">
                    <div>
                      <label className="eu-label">User ID</label>
                      <div className="eu-readonly">{row.id}</div>
                    </div>
                    <div>
                      <label className="eu-label">Created On</label>
                      <div className="eu-readonly">{createdOn}</div>
                    </div>
                    <div className="eu-field-full">
                      <label className="eu-label">Last Active</label>
                      <div className="eu-readonly">{lastActive}</div>
                    </div>
                  </div>

                  <p className="eu-note">
                    <FiInfo size={13} />
                    A role change takes effect the next time the user loads the app.
                  </p>
                </div>
              ) : (
                <div className="eu-body">
                  <p className="eu-section-title">Set a New Password</p>
                  <div className="eu-grid">
                    <div className="eu-field-full">
                      <label className="eu-label">
                        New Password<span className="eu-req">*</span>
                      </label>
                      <TextField
                        fullWidth
                        size="small"
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        autoComplete="new-password"
                        sx={sx("password")}
                        value={passwords.password}
                        onChange={(e) => {
                          setPasswords((prev) => ({ ...prev, password: e.target.value }));
                          setErrors({});
                        }}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "var(--text-muted)",
                                  display: "flex",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            ),
                          },
                        }}
                      />
                      {errors.password && <p className="eu-error">{errors.password}</p>}
                      <p className="eu-hint">
                        At least 8 characters, with an uppercase letter, a number and a
                        special character.
                      </p>
                    </div>

                    <div className="eu-field-full">
                      <label className="eu-label">
                        Confirm Password<span className="eu-req">*</span>
                      </label>
                      <TextField
                        fullWidth
                        size="small"
                        type={showPassword ? "text" : "password"}
                        name="confirmNewPassword"
                        autoComplete="new-password"
                        sx={sx("confirmPassword")}
                        value={passwords.confirmPassword}
                        onChange={(e) => {
                          setPasswords((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }));
                          setErrors({});
                        }}
                      />
                      {errors.confirmPassword && (
                        <p className="eu-error">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <p className="eu-note">
                    <FiInfo size={13} />
                    {row.fullName} is not notified automatically — pass the new password on
                    yourself.
                  </p>
                </div>
              )}

              <footer className="eu-foot">
                <button type="button" className="eu-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="eu-btn-save"
                  disabled={saving || loading}
                  title={loading ? "Waiting for the full profile to load" : undefined}
                  onClick={tab === "details" ? handleSaveDetails : handleSavePassword}
                >
                  <FiCheck size={15} />
                  {saving
                    ? "Saving…"
                    : tab === "details"
                      ? "Update User"
                      : "Update Password"}
                </button>
              </footer>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditUserModal;
