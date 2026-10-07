import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GroupsIcon from "@mui/icons-material/Groups";

import { adduser } from "../../../../core/actions/action";
import { fetchAllExistProjects, fetchExistDomains } from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { uservalidationSchema } from "../../../../utils/validation/Validation";
import type { project } from "../../../../shared/types/Project";
import type { Domain } from "../../../../shared/types/Domain";
import { useAppSelector } from "../../../../store/configureStore";
import PersonalInfoSection from "./CreateUser/PersonalInfoSection";
import OrganizationSection from "./CreateUser/OrganizationSection";
import TeamAssignmentSection from "./CreateUser/TeamAssignmentSection";
import { ToggleCard } from "./CreateUser/formControls";
import {
  buildValidationPayload,
  departmentOf,
  initialForm,
  normalize,
  type UserForm,
} from "./CreateUser/createUserUtils";

const toggleIn = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

const CreateUser = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const isAM = role?.toUpperCase() === "AM";
  const currentRole = urlRole || (isAM ? "am" : "sp");
  const backPath = role === "SP" ? "/sp/userMangement" : `/${currentRole}/TeamManagement`;

  const { showSnackbar } = useSnackbar();
  const roleOptionsFor = (shared: boolean) =>
    shared ? ["USER"] : role === "SP" ? ["AM"] : ["USER", "DEVLOPER"];

  const [form, setForm] = useState<UserForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projectList, setProjectList] = useState<project[]>([]);
  const [domainList, setDomainList] = useState<Domain[]>([]);

  const canShare = isAM;
  const isSharing = canShare && form.is_shared;

  const selectedDepartments = new Set(form.departments.map(normalize));
  const visibleProjects = projectList.filter((p) =>
    selectedDepartments.has(departmentOf(p))
  );

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetchAllExistProjects();
      const all = response.data || [];
      const activeProjects = all.filter((p: any) => (p.status || "").toLowerCase().replace(/\s+/g, "_") === "active");

      if (isAM) {
        setProjectList(
          activeProjects.filter((p: any) =>
            (p.teamAssigned || []).some((member: any) => String(member.id) === String(user?.id))
          )
        );
      } else {
        setProjectList(activeProjects);
      }
    } catch (error) {
      console.log(error);
    }
  }, [isAM, user?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const loadDomains = useCallback(async () => {
    try {
      const response = await fetchExistDomains(isSharing || undefined);
      setDomainList(response?.data || []);
    } catch (error) {
      console.log(error);
    }
  }, [isSharing]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const validateField = (field: string, nextForm: UserForm) => {
    const result = uservalidationSchema.safeParse(buildValidationPayload(nextForm));
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

  const handleDepartmentsChange = (names: string[]) => {
    setForm((prev) => {
      const before = new Set(prev.departments.map(normalize));
      const after = new Set(names.map(normalize));
      const kept = prev.projects.filter((id) => {
        const p = projectList.find((proj) => String(proj.id) === id);
        return p ? after.has(departmentOf(p)) : false;
      });
      const added = projectList
        .filter((p) => after.has(departmentOf(p)) && !before.has(departmentOf(p)))
        .map((p) => String(p.id));
      const nextForm = {
        ...prev,
        departments: names,
        projects: Array.from(new Set([...kept, ...added])),
      };
      validateField("department", nextForm);
      return nextForm;
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => {
      const nextForm = { ...prev, [field]: value };
      if (typeof value === "string") validateField(field, nextForm);
      return nextForm;
    });
  };

  const handleSharedToggle = (shared: boolean) => {
    const nextOptions = roleOptionsFor(shared);
    setForm((prev) => ({
      ...prev,
      is_shared: shared,
      projects: shared ? [] : prev.projects,
      domains: shared ? prev.domains : [],
      role: shared
        ? "USER"
        : nextOptions.includes(prev.role)
          ? prev.role
          : "",
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.role;
      return next;
    });
  };

  const handleSubmit = async () => {
    const primaryDepartment = form.departments[0] ?? "";
    const payload: Record<string, any> = {
      ...buildValidationPayload(form),
      projectCategory: primaryDepartment,
      departments: form.departments,
      manager_id: form.manager_id,
      sendWelcomeEmail: form.sendWelcomeEmail,
      requirePasswordChange: form.requirePasswordChange,
      is_shared: isSharing,
    };

    if (isSharing) {
      payload.domain_ids = form.domains;
      payload.projects = "";
    } else {
      payload.domain_ids = domainList
        .filter((d) => selectedDepartments.has(normalize(d.name)))
        .map((d) => String(d.id));
      payload.projects = form.projects.length > 0 ? form.projects.join(",") : "";
    }

    const result = uservalidationSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      const firstError = result.error.errors[0]?.message;
      showSnackbar({ message: firstError || "Validation failed", severity: "error" });
      return;
    }

    if (isSharing && form.domains.length === 0) {
      showSnackbar({
        message: "Pick at least one department — a shared user with no department is visible to nobody.",
        severity: "error",
      });
      return;
    }

    setErrors({});
    try {
      const response = await adduser(payload);
      if (response.success) {
        showSnackbar({ message: "User Created Successfully", severity: "success" });
        navigate(backPath);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "User creation failed";
      showSnackbar({ message: msg, severity: "error" });
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <div className="mb-4">
        <div className="d-flex align-items-center gap-1 mb-1">
          <button
            onClick={() => navigate(backPath)}
            className="btn btn-link p-0 text-decoration-none"
            style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}
          >
            {role === "SP" ? "User Management" : "Team Management"}
          </button>
          <span style={{ color: "var(--text-faint)", fontSize: 13 }}>&rsaquo;</span>
          <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>Create New User</span>
        </div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
          Create New User
        </h2>
        <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
          Add a new member with detailed profile information and organizational roles.
        </p>
      </div>

      <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <PersonalInfoSection form={form} errors={errors} onChange={handleChange} />

        <OrganizationSection
          form={form}
          errors={errors}
          canShare={canShare}
          roleOptions={roleOptionsFor(form.is_shared)}
          domainList={domainList}
          onChange={handleChange}
          onSharedToggle={handleSharedToggle}
          onDepartmentsChange={handleDepartmentsChange}
        />

        <TeamAssignmentSection
          form={form}
          isSharing={isSharing}
          domainList={domainList}
          projectList={projectList}
          visibleProjects={visibleProjects}
          onToggleDomain={(id) => setForm((prev) => ({ ...prev, domains: toggleIn(prev.domains, id) }))}
          onToggleProject={(id) => setForm((prev) => ({ ...prev, projects: toggleIn(prev.projects, id) }))}
          onClearDomains={() => setForm((prev) => ({ ...prev, domains: [] }))}
          onClearProjects={() => setForm((prev) => ({ ...prev, projects: [] }))}
        />

        <div className="d-flex flex-column gap-3 mb-2">
          <ToggleCard
            icon={"✉"}
            title="Send Welcome Email"
            description="Send an invitation to join the platform immediately."
            checked={form.sendWelcomeEmail}
            onToggle={(checked) => handleChange("sendWelcomeEmail", checked)}
          />
          <ToggleCard
            icon={"\u{1F512}"}
            title="Require Password Change"
            description="Force the user to set a new password on first login."
            checked={form.requirePasswordChange}
            onToggle={(checked) => handleChange("requirePasswordChange", checked)}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end gap-3">
        <button
          onClick={() => navigate(backPath)}
          className="btn"
          style={{ fontSize: 13, fontWeight: 600, padding: "6px 16px", color: "var(--text-secondary)", borderRadius: 8, border: "1px solid var(--border-light)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn text-white d-flex align-items-center gap-1"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            padding: "6px 16px",
          }}
        >
          <GroupsIcon sx={{ fontSize: 16 }} />
          Create User
        </button>
      </div>
    </div>
  );
};

export default CreateUser;
