import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiEdit2, FiX } from "react-icons/fi";

import {
  assignProjectMembers,
  removeProjectMembers,
  updateProject,
} from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import type { ProjectActivityEntry } from "../../../../core/types";
import { NAME_MAX } from "./EditProjectModal/constants";
import { dayOf, toDateTimeInput } from "./EditProjectModal/dateUtils";
import { useProjectTeam } from "./EditProjectModal/useProjectTeam";
import ProjectTabs, { type ProjectTab } from "./EditProjectModal/ProjectTabs";
import ActivityTimeline from "./EditProjectModal/ActivityTimeline";
import DetailsForm, { type ProjectForm } from "./EditProjectModal/DetailsForm";
import TeamPicker from "./EditProjectModal/TeamPicker";

export interface EditProjectModalProps {
  open: boolean;
  project: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const EditProjectModal = ({
  open,
  project,
  onClose,
  onSaved,
}: EditProjectModalProps) => {
  const { showSnackbar } = useSnackbar();

  const [form, setForm] = useState<ProjectForm>({
    name: "",
    category: "",
    endDate: "",
  });
  const [tab, setTab] = useState<ProjectTab>("details");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const team = useProjectTeam(open, project);
  const { added, removed } = team;

  useEffect(() => {
    if (!open || !project) return;
    const edit = project.editValues ?? {};
    setErrors({});
    setReason("");
    setTab("details");
    setForm({
      name: edit.name ?? project.name ?? "",
      category: edit.client_department ?? project.client_department ?? "",
      endDate: toDateTimeInput(edit.end_date ?? project.end_date ?? project.dueDate),
    });
  }, [open, project]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const setField = (field: keyof ProjectForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    clearError("reason");
  };

  const savedDay = dayOf(project?.editValues?.end_date ?? project?.end_date ?? null);
  const formDay = form.endDate ? dayOf(new Date(form.endDate).toISOString()) : null;
  const extending = !!formDay && (!savedDay || formDay > savedDay);

  const activity: ProjectActivityEntry[] = Array.isArray(project?.activity)
    ? project.activity
    : [];
  const extensionCount: number = project?.extension_count ?? 0;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Project name is required";
    else if (form.name.trim().length > NAME_MAX)
      next.name = `Project name must be ${NAME_MAX} characters or fewer`;
    if (!form.category) next.category = "Project category is required";
    if (!form.endDate) next.endDate = "Due date is required";
    else if (extending && !reason.trim())
      next.reason = "Say why the due date is moving later";
    setErrors(next);
    if (Object.keys(next).length) {
      setTab("details");
      showSnackbar({ message: Object.values(next)[0], severity: "error" });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!project?.id || !validate()) return;

    setSaving(true);
    try {
      await updateProject(project.id, {
        name: form.name.trim(),
        client_department: form.category,
        end_date: new Date(form.endDate).toISOString(),
        ...(extending ? { extension_reason: reason.trim() } : {}),
      });

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

              <ProjectTabs tab={tab} onChange={setTab} activityCount={activity.length} />

              <div className="ep-body">
                {tab === "activity" ? (
                  <ActivityTimeline activity={activity} />
                ) : (
                  <div className="ep-cols">
                    <DetailsForm
                      form={form}
                      errors={errors}
                      setField={setField}
                      reason={reason}
                      onReasonChange={handleReasonChange}
                      extending={extending}
                      savedDay={savedDay}
                      extensionCount={extensionCount}
                    />
                    <TeamPicker
                      visibleUsers={team.visibleUsers}
                      memberIds={team.memberIds}
                      visibleMemberCount={team.visibleMemberCount}
                      rosterLoading={team.rosterLoading}
                      rosterEmpty={team.rosterEmpty}
                      onToggle={team.toggleMember}
                      onScroll={team.onRosterScroll}
                    />
                  </div>
                )}
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
                    {tab === "activity" ? "Close" : "Cancel"}
                  </button>
                  {tab === "details" && (
                    <button
                      type="button"
                      className="ep-btn-save"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      <FiCheck size={15} />
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  )}
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
