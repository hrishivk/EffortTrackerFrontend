import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress, MenuItem, Select, TextField } from "@mui/material";
import { FiCheck, FiCalendar, FiEdit2, FiUsers, FiX } from "react-icons/fi";

import {
  assignProjectMembers,
  removeProjectMembers,
  updateProject,
} from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { pdGetInitials, isUserInProject } from "./utils";
import { PROJECT_CATEGORIES } from "./constants";
import type { Domain } from "../../../../shared/types/Domain";
import type { formUserData } from "../../../../shared/types/User";

const NAME_MAX = 100;

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

/**
 * `datetime-local` needs `YYYY-MM-DDTHH:mm` in *local* time. The API sends UTC
 * with an offset, so read it through the Date constructor rather than slicing
 * the string — slicing shows the wrong day either side of midnight.
 */
const toDateTimeInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

export interface EditProjectModalProps {
  open: boolean;
  /** The raw project record from list-projects, not the mapped table row. */
  project: any | null;
  domains: Domain[];
  /**
   * The assignable roster, owned and cached by the parent screen. The table row
   * cannot stand in for it: its `teamAssigned` drops the user ids, and it lists
   * only current members, not everyone who could be added.
   */
  users: formUserData[];
  usersLoading: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EditProjectModal = ({
  open,
  project,
  domains,
  users,
  usersLoading,
  onClose,
  onSaved,
}: EditProjectModalProps) => {
  const { showSnackbar } = useSnackbar();

  const [form, setForm] = useState({
    name: "",
    domainId: "",
    category: "",
    endDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Members have their own endpoints, so they are tracked as a diff against
  // what the project started with and applied separately on save.
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const initialMemberIds = useRef<string[]>([]);
  /** Guards against re-seeding over the manager's toggles if `users` arrives late. */
  const membersSeeded = useRef(false);

  // Every field comes off the record we were handed, so this is synchronous.
  useEffect(() => {
    if (!open || !project) {
      membersSeeded.current = false;
      return;
    }
    setErrors({});
    setForm({
      name: project.name || "",
      domainId: String(project.domain_id ?? project.domain?.id ?? ""),
      category: project.project_category || project.client_department || "",
      endDate: toDateTimeInput(project.end_date || project.dueDate),
    });
    membersSeeded.current = false;
    setMemberIds([]);
  }, [open, project]);

  // Who is already on the project comes from each user's projects[], so it can
  // only be worked out once the roster is in. Seeded once per open.
  useEffect(() => {
    if (!open || !project || usersLoading || membersSeeded.current) return;
    const assigned = users
      .filter((u) => isUserInProject(u, project.id))
      .map((u) => String(u.id));
    setMemberIds(assigned);
    initialMemberIds.current = assigned;
    membersSeeded.current = true;
  }, [open, project, users, usersLoading]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleMember = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );

  /** Assigned first, so the current team is always what you see without scrolling. */
  const visibleUsers = useMemo(() => {
    const assigned = users.filter((u) => memberIds.includes(String(u.id)));
    const rest = users.filter((u) => !memberIds.includes(String(u.id)));
    return [...assigned, ...rest];
  }, [users, memberIds]);

  /** An older project may carry a category no longer on the list; keep it selectable. */
  const categoryOptions = useMemo(
    () =>
      form.category && !PROJECT_CATEGORIES.includes(form.category)
        ? [form.category, ...PROJECT_CATEGORIES]
        : PROJECT_CATEGORIES,
    [form.category],
  );

  const sx = (field: string) => (errors[field] ? errorSx : inputSx);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Project name is required";
    else if (form.name.trim().length > NAME_MAX)
      next.name = `Project name must be ${NAME_MAX} characters or fewer`;
    if (!form.domainId) next.domainId = "Department is required";
    if (!form.category) next.category = "Project category is required";
    if (!form.endDate) next.endDate = "Due date is required";
    setErrors(next);
    if (Object.keys(next).length) {
      showSnackbar({ message: Object.values(next)[0], severity: "error" });
      return false;
    }
    return true;
  };

  const added = memberIds.filter((id) => !initialMemberIds.current.includes(id));
  const removed = initialMemberIds.current.filter((id) => !memberIds.includes(id));

  const handleSave = async () => {
    if (!project?.id || !validate()) return;

    setSaving(true);
    try {
      await updateProject(project.id, {
        name: form.name.trim(),
        domain_id: form.domainId,
        // add-project writes the category to both columns; kept in step with it.
        project_category: form.category,
        client_department: form.category,
        end_date: new Date(form.endDate).toISOString(),
      });

      // Members are separate routes, so they only run once the record itself saved.
      if (added.length) await assignProjectMembers(String(project.id), added);
      if (removed.length) await removeProjectMembers(String(project.id), removed);

      showSnackbar({ message: "Project updated successfully", severity: "success" });
      onSaved();
      onClose();
    } catch (error: any) {
      showSnackbar({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update project",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && project && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="ep-backdrop"
            onClick={onClose}
          />

          <div className="ep-wrap">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="ep-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Edit project"
            >
              <header className="ep-head">
                <div className="ep-head-left">
                  <div className="ep-icon">
                    <FiEdit2 size={19} />
                  </div>
                  <div className="ep-head-text">
                    <h3>Edit Project</h3>
                    <p>Update project details and save your changes.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="ep-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <FiX size={19} />
                </button>
              </header>

              <div className="ep-body">
                  <div className="ep-cols">
                    <div>
                      <div className="ep-field">
                        <label className="ep-label">
                          Project Name<span className="ep-req">*</span>
                        </label>
                        <TextField
                          fullWidth
                          size="small"
                          sx={sx("name")}
                          value={form.name}
                          slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
                          onChange={(e) => setField("name", e.target.value)}
                        />
                        {errors.name ? (
                          <p className="ep-error">{errors.name}</p>
                        ) : (
                          <p className="ep-count">
                            {form.name.length} / {NAME_MAX}
                          </p>
                        )}
                      </div>

                      <div className="ep-grid">
                        <div>
                          <label className="ep-label">
                            Department<span className="ep-req">*</span>
                          </label>
                          <Select
                            fullWidth
                            size="small"
                            displayEmpty
                            sx={sx("domainId")}
                            value={form.domainId}
                            onChange={(e) => setField("domainId", e.target.value)}
                            renderValue={(value) =>
                              value ? (
                                domains.find((d) => String(d.id) === value)?.name || "—"
                              ) : (
                                <span style={{ color: "var(--text-faint)" }}>Select</span>
                              )
                            }
                          >
                            {domains.map((d) => (
                              <MenuItem
                                key={d.id}
                                value={String(d.id)}
                                sx={{ fontSize: 13 }}
                              >
                                {d.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.domainId ? (
                            <p className="ep-error">{errors.domainId}</p>
                          ) : (
                            <p className="ep-hint">The department this project sits under</p>
                          )}
                        </div>

                        <div>
                          <label className="ep-label">
                            Project Category<span className="ep-req">*</span>
                          </label>
                          <Select
                            fullWidth
                            size="small"
                            displayEmpty
                            sx={sx("category")}
                            value={form.category}
                            onChange={(e) => setField("category", e.target.value)}
                            renderValue={(value) =>
                              value ? (
                                (value as string)
                              ) : (
                                <span style={{ color: "var(--text-faint)" }}>
                                  Select a category
                                </span>
                              )
                            }
                          >
                            {categoryOptions.map((c) => (
                              <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>
                                {c}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.category ? (
                            <p className="ep-error">{errors.category}</p>
                          ) : (
                            <p className="ep-hint">Shown as Client / Department</p>
                          )}
                        </div>
                      </div>

                      <div className="ep-field">
                        <label className="ep-label">
                          Due Date<span className="ep-req">*</span>
                        </label>
                        <TextField
                          fullWidth
                          size="small"
                          type="datetime-local"
                          sx={sx("endDate")}
                          value={form.endDate}
                          onChange={(e) => setField("endDate", e.target.value)}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <FiCalendar
                                  size={15}
                                  style={{
                                    marginRight: 10,
                                    color: "var(--text-muted)",
                                  }}
                                />
                              ),
                            },
                          }}
                        />
                        {errors.endDate ? (
                          <p className="ep-error">{errors.endDate}</p>
                        ) : (
                          <p className="ep-hint">Select project due date and time</p>
                        )}
                      </div>
                    </div>

                    <div className="ep-team">
                      <div className="ep-team-head">
                        <h4>
                          <FiUsers size={14} />
                          Team Assigned
                        </h4>
                        <span className="ep-team-count">{memberIds.length}</span>
                      </div>
                      <p className="ep-team-sub">
                        Tap a row to add or remove them from this project.
                      </p>

                      {usersLoading ? (
                        <div className="ep-team-loading">
                          <CircularProgress size={22} thickness={4} sx={{ color: "#7c3aed" }} />
                          <span>Loading team…</span>
                        </div>
                      ) : visibleUsers.length === 0 ? (
                        <div className="ep-team-empty">
                          No one is available to assign yet.
                        </div>
                      ) : (
                        <div className="ep-team-list">
                          {visibleUsers.map((user) => {
                            const uid = String(user.id);
                            const assigned = memberIds.includes(uid);
                            return (
                              <button
                                key={uid}
                                type="button"
                                className={`ep-member ${assigned ? "is-assigned" : ""}`}
                                aria-pressed={assigned}
                                onClick={() => toggleMember(uid)}
                              >
                                <span className="ep-member-avatar">
                                  {pdGetInitials(user.fullName)}
                                </span>
                                <span className="ep-member-info">
                                  <span className="ep-member-name">{user.fullName}</span>
                                  <span className="ep-member-role">{user.role}</span>
                                </span>
                                <span className="ep-member-state">
                                  {assigned ? (
                                    <>
                                      <FiCheck size={11} />
                                      Added
                                    </>
                                  ) : (
                                    "Add"
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
              </div>

              <footer className="ep-foot">
                {added.length || removed.length ? (
                  <span className="ep-foot-note">
                    {added.length > 0 && `${added.length} to add`}
                    {added.length > 0 && removed.length > 0 && " · "}
                    {removed.length > 0 && `${removed.length} to remove`}
                  </span>
                ) : null}
                <div className="ep-foot-actions">
                  <button type="button" className="ep-btn-cancel" onClick={onClose}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ep-btn-save"
                    disabled={saving || usersLoading}
                    title={usersLoading ? "Waiting for the team list to load" : undefined}
                    onClick={handleSave}
                  >
                    <FiCheck size={15} />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </footer>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditProjectModal;
