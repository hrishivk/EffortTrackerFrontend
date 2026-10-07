import type { Dispatch, SetStateAction } from "react";
import { Switch } from "@mui/material";
import { FiCheck } from "react-icons/fi";
import type { project } from "../../../types/Project";
import type { Domain } from "../../../types/Domain";
import type { UserDetails } from "../../../types/User";
import EuField from "./EuField";
import ProjectPicker from "./ProjectPicker";
import type { EditUserForm, FieldErrors } from "./editUserUtils";

interface AccessSectionProps {
  form: EditUserForm;
  errors: FieldErrors;
  canShare: boolean;
  details: UserDetails | null;
  domainList: Domain[];
  projects: project[];
  selectedProjects: project[];
  pickerOpen: boolean;
  setPickerOpen: Dispatch<SetStateAction<boolean>>;
  onToggleProject: (id: string) => void;
  onToggleDomain: (id: string) => void;
  onSetShared: (shared: boolean) => void;
}

const AccessSection = ({
  form,
  errors,
  canShare,
  details,
  domainList,
  projects,
  selectedProjects,
  pickerOpen,
  setPickerOpen,
  onToggleProject,
  onToggleDomain,
  onSetShared,
}: AccessSectionProps) => (
  <>
    <p className="eu-section-title">Projects &amp; Access</p>
    <div className="eu-grid">
      {!form.is_shared && (
        <EuField label="Projects" full>
          <ProjectPicker
            projects={projects}
            selectedIds={form.projects}
            selectedProjects={selectedProjects}
            open={pickerOpen}
            setOpen={setPickerOpen}
            onToggle={onToggleProject}
          />
        </EuField>
      )}

      {form.is_shared && (
        <div className="eu-field-full">
          <label className="eu-label">
            Departments<span className="eu-req">*</span>
          </label>

          {!canShare ? (
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
          ) : domainList.length === 0 ? (
            <div className="eu-readonly">No departments available</div>
          ) : (
            <>
              <div className="eu-domains">
                {domainList.map((d) => {
                  const id = String(d.id);
                  const on = form.domains.includes(id);
                  return (
                    <button
                      type="button"
                      key={id}
                      className={`eu-domain${on ? " is-on" : ""}`}
                      onClick={() => onToggleDomain(id)}
                      aria-pressed={on}
                    >
                      <span className="eu-domain__box">{on && <FiCheck size={11} />}</span>
                      <span className="eu-domain__text">
                        <b>{d.name}</b>
                        <span>{d.description || "Department"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.domains && <p className="eu-error">{errors.domains}</p>}
            </>
          )}

          <p className="eu-hint">Managers in these departments can see this shared user.</p>
        </div>
      )}

      {canShare && (
        <div className="eu-field-full">
          <div className="eu-toggle-row">
            <label htmlFor="eu-is-shared" style={{ margin: 0 }}>
              <strong>Shared across all managers</strong>
              <span>
                For staff who work across every project (testers, QA, designers).
              </span>
            </label>
            <Switch
              id="eu-is-shared"
              size="small"
              checked={form.is_shared}
              onChange={(e) => onSetShared(e.target.checked)}
            />
          </div>
        </div>
      )}
    </div>
  </>
);

export default AccessSection;
