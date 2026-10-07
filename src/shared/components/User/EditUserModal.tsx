import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiLock, FiUser, FiX } from "react-icons/fi";
import type { ZodError } from "zod";

import {
  edituser,
  fetchExistDomains,
  fetchUserDetails,
} from "../../../core/actions/spAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useAppSelector } from "../../../store/configureStore";
import {
  editUserValidationSchema,
  userPasswordValidationSchema,
} from "../../../utils/validation/Validation";
import type { formUserData, UserDetails } from "../../types/User";
import type { project } from "../../types/Project";
import type { Domain } from "../../types/Domain";
import DetailsTab from "./EditUserModal/DetailsTab";
import PasswordTab from "./EditUserModal/PasswordTab";
import {
  baseFields,
  collectFieldErrors,
  emptyForm,
  emptyPasswords,
  errorSx,
  formatCreatedOn,
  formatLastSeen,
  inputSx,
  toDateInput,
  toggleId,
  type EditUserForm,
  type Tab,
} from "./EditUserModal/editUserUtils";

export interface EditUserModalProps {
  open: boolean;
  user: formUserData | null;
  projects: project[];
  onClose: () => void;
  onSaved: () => void;
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "details", label: "User Details", icon: <FiUser size={15} /> },
  { key: "password", label: "Change Password", icon: <FiLock size={15} /> },
];

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

  const canShare = role === "SP" || role === "AM";

  const [tab, setTab] = useState<Tab>("details");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [domainList, setDomainList] = useState<Domain[]>([]);

  const [passwords, setPasswords] = useState(emptyPasswords);
  const [showPassword, setShowPassword] = useState(false);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRow, setLastRow] = useState<formUserData | null>(null);
  useEffect(() => {
    if (user) setLastRow(user);
  }, [user]);
  const row = user ?? lastRow;

  useEffect(() => {
    if (!open || !user) return;
    setTab("details");
    setErrors({});
    setPickerOpen(false);
    setPasswords(emptyPasswords);
    setShowPassword(false);
    setDetails(null);
    setForm({ ...emptyForm, ...baseFields(user) });

    if (!user.id) return;
    let cancelled = false;
    setLoading(true);
    fetchUserDetails(user.id)
      .then((data) => {
        if (cancelled || !data) return;
        setDetails(data);
        setForm({
          ...baseFields(data),
          employeeId: data.employeeId || "",
          dateOfBirth: toDateInput(data.dateOfBirth),
          bloodGroup: data.bloodGroup || "",
          joiningDate: toDateInput(data.joiningDate),
          domains: (data.domains || []).map((d) => String(d.id)),
        });
      })
      .catch((error: any) => {
        if (cancelled) return;
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

  useEffect(() => {
    if (!user || !canShare) return;
    let alive = true;
    fetchExistDomains(true)
      .then((res) => {
        if (alive) setDomainList(res?.data || []);
      })
      .catch(() => {
        if (alive) setDomainList([]);
      });
    return () => {
      alive = false;
    };
  }, [user, canShare]);

  const setShared = (shared: boolean) =>
    setForm((prev) => ({
      ...prev,
      is_shared: shared,
      projects: shared ? [] : prev.projects,
      domains: shared ? prev.domains : [],
      role: shared ? "USER" : prev.role,
    }));

  const toggleDomain = (id: string) =>
    setForm((prev) => ({ ...prev, domains: toggleId(prev.domains, id) }));

  const toggleProject = (id: string) =>
    setForm((prev) => ({ ...prev, projects: toggleId(prev.projects, id) }));

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

  const setField = (field: keyof EditUserForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const sx = (field: string) => (errors[field] ? errorSx : inputSx);

  const failValidation = (error: ZodError) => {
    setErrors(collectFieldErrors(error));
    showSnackbar({
      message: error.errors[0]?.message || "Validation failed",
      severity: "error",
    });
  };

  /** Shared save flow: clear errors, call the API, report, close. */
  const save = async (
    payload: Parameters<typeof edituser>[0],
    successMessage: string,
    fallbackError: string,
    afterSuccess?: () => void,
  ) => {
    setErrors({});
    setSaving(true);
    try {
      await edituser(payload);
      showSnackbar({ message: successMessage, severity: "success" });
      afterSuccess?.();
      onSaved();
      onClose();
    } catch (error: any) {
      showSnackbar({
        message: error?.response?.data?.message || error?.message || fallbackError,
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

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
    if (!result.success) return failValidation(result.error);

    if (canShare && form.is_shared && form.domains.length === 0) {
      setErrors({ domains: "Pick at least one department" });
      showSnackbar({
        message: "Pick at least one department — a shared user with no department is visible to nobody.",
        severity: "error",
      });
      return;
    }

    await save(
      {
        id: user.id,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        projects: form.projects.join(","),
        contactNumber: form.contactNumber,
        jobTitle: form.jobTitle,
        employeeId: form.employeeId,
        dateOfBirth: form.dateOfBirth,
        bloodGroup: form.bloodGroup,
        joiningDate: form.joiningDate,
        ...(details?.manager_id !== undefined ? { manager_id: details.manager_id } : {}),
        ...(canShare ? { is_shared: form.is_shared, domain_ids: form.domains } : {}),
      },
      "User updated successfully",
      "Failed to update user",
    );
  };

  const handleSavePassword = async () => {
    if (!user?.id) return;

    const result = userPasswordValidationSchema.safeParse(passwords);
    if (!result.success) return failValidation(result.error);

    await save(
      { id: user.id, password: passwords.password },
      "Password updated successfully",
      "Failed to update password",
      () => setPasswords(emptyPasswords),
    );
  };

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
                <button type="button" className="eu-close" onClick={onClose} aria-label="Close">
                  <FiX size={18} />
                </button>
              </header>

              <div className="eu-tabs">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`eu-tab ${tab === t.key ? "is-active" : ""}`}
                    onClick={() => {
                      setTab(t.key);
                      setErrors({});
                    }}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "details" ? (
                <DetailsTab
                  form={form}
                  errors={errors}
                  sx={sx}
                  loading={loading}
                  roleOptions={roleOptions}
                  setField={setField}
                  userId={row.id}
                  createdOn={formatCreatedOn(details?.createdAt)}
                  lastActive={formatLastSeen(details?.lastSeenAt ?? row?.lastSeenAt)}
                  canShare={canShare}
                  details={details}
                  domainList={domainList}
                  projects={projects}
                  selectedProjects={selectedProjects}
                  pickerOpen={pickerOpen}
                  setPickerOpen={setPickerOpen}
                  onToggleProject={toggleProject}
                  onToggleDomain={toggleDomain}
                  onSetShared={setShared}
                />
              ) : (
                <PasswordTab
                  passwords={passwords}
                  setPasswords={setPasswords}
                  showPassword={showPassword}
                  onToggleShow={() => setShowPassword((prev) => !prev)}
                  errors={errors}
                  clearErrors={() => setErrors({})}
                  sx={sx}
                  fullName={row.fullName}
                />
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
