import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { addProject, assignProjectMembers, fetchUsers, fetchAllUsers, fetchExistDomains } from "../../../../core/actions/spAction";
import { ProjectValidationSchema } from "../../../../utils/validation/Validation";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import type { AvailableMember, ProjectFormData } from "../../types";
import type { formUserData } from "../../../../shared/types/User";
import type { Domain } from "../../../../shared/types/Domain";
import DomainSelector from "./CreateProject/DomainSelector";
import ProjectInfoSection from "./CreateProject/ProjectInfoSection";
import MemberAssignSection from "./CreateProject/MemberAssignSection";
import { gradientBtnStyle } from "./CreateProject/shared";

const CreateProject = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const user = useSelector((state: any) => state.user.user);
  const role = user?.role;
  const isAM = role?.toUpperCase() === "AM";
  const isSP = role?.toUpperCase() === "SP";
  const currentRole = urlRole || (isAM ? "am" : "sp");
  const { showSnackbar } = useSnackbar();

  const [form, setForm] = useState<ProjectFormData>({
    name: "",
    category: "",
    description: "",
    startDate: "",
    endDate: "",
    domainId: "",
    teamMembers: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [domains, setDomains] = useState<Domain[]>([]);

  const [members, setMembers] = useState<AvailableMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const goToProjects = () => navigate(`/${currentRole}/domain-project`);

  const fetchMembers = useCallback(async () => {
    try {
      const isSP = role?.toUpperCase() === "SP";
      const response = isSP
        ? await fetchUsers({ role: "AM" })
        : await fetchAllUsers();

      const allUsers: formUserData[] = isSP ? (response as any)?.users : (response as any)?.data;
      if (allUsers?.length) {
        const filtered = isSP
          ? allUsers
          : allUsers.filter(
              (u) => u.role === "USER" || u.role === "DEVLOPER"
            );
        setMembers(
          filtered.map((u: formUserData) => ({
            id: u.id || "",
            fullName: u.fullName,
            role: u.role,
            department: u.department || "",
            isOnLeave: u.isBlocked,
          }))
        );
      }
    } catch (error) {
      console.log(error);
    }
  }, [role]);

  const fetchDomains = useCallback(async () => {
    try {
      const response = await fetchExistDomains();
      setDomains(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchDomains();
  }, [fetchMembers, fetchDomains]);

  const handleChange = (field: keyof ProjectFormData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if ((field === "category" || field === "domainId") && value !== prev[field]) {
        next.teamMembers = [];
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleMember = (id: string) => {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(id)
        ? prev.teamMembers.filter((m) => m !== id)
        : [...prev.teamMembers, id],
    }));
  };

  const removeMember = (id: string) => {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((m) => m !== id),
    }));
  };

  const domainScopedMembers = (() => {
    if (!isSP) return members;
    if (!form.domainId) return [];
    const selectedDomain = domains.find((d) => String(d.id) === form.domainId);
    const allowedIds = new Set(
      (selectedDomain?.assignedUsers || []).map((u) => String(u.id))
    );
    return members.filter((m) => allowedIds.has(String(m.id)));
  })();

  const categoryMembers = form.category
    ? domainScopedMembers.filter(
        (m) => m.department?.toLowerCase() === form.category.toLowerCase()
      )
    : domainScopedMembers;

  const filteredMembers = categoryMembers.filter(
    (m) =>
      m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const selectedMembers = members.filter((m) =>
    form.teamMembers.includes(m.id)
  );

  const handleSubmit = async () => {
    const result = ProjectValidationSchema.safeParse({
      name: form.name,
      category: form.category,
      description: form.description,
      domainId: form.domainId,
      startDate: form.startDate,
      endDate: form.endDate,
    });

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

    setErrors({});
    try {
      const res = await addProject({
        name: form.name,
        description: form.description,
        domain_id: form.domainId,
        project_category: form.category,
        client_department: form.category,
        start_date: form.startDate,
        end_date: form.endDate,
        status: "active",
      });

      const projectId = res?.data?.id || res?.id;
      if (projectId && form.teamMembers.length > 0) {
        await assignProjectMembers(String(projectId), form.teamMembers);
      }

      showSnackbar({ message: "Project created successfully", severity: "success" });
      goToProjects();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to create project";
      showSnackbar({ message: msg, severity: "error" });
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <button
        onClick={goToProjects}
        className="btn btn-link p-0 text-decoration-none mb-2"
        style={{ color: "#7c3aed", fontSize: 14, fontWeight: 500 }}
      >
        &larr; Back
      </button>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
            Create New Project
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            Set up your project details and assemble your high-performing team.
          </p>
        </div>
      </div>

      <DomainSelector
        domains={domains}
        selectedId={form.domainId}
        error={errors.domainId}
        onSelect={(id) => handleChange("domainId", id)}
        onCreateDomain={() => navigate(`/${currentRole}/create-domain`)}
      />

      <ProjectInfoSection form={form} errors={errors} onChange={handleChange} />

      <MemberAssignSection
        isSP={isSP}
        domainId={form.domainId}
        category={form.category}
        teamMembers={form.teamMembers}
        domainScopedMembers={domainScopedMembers}
        categoryMembers={categoryMembers}
        filteredMembers={filteredMembers}
        selectedMembers={selectedMembers}
        memberSearch={memberSearch}
        onSearchChange={setMemberSearch}
        onToggle={toggleMember}
        onRemove={removeMember}
      />

      <div className="d-flex justify-content-between align-items-center">
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          &#8505; You can add more team members later.
        </span>
        <div className="d-flex gap-3">
          <button
            onClick={goToProjects}
            className="btn"
            style={{ fontSize: 13, fontWeight: 600, padding: "6px 16px", color: "var(--text-secondary)", borderRadius: 8, border: "1px solid var(--border-light)" }}
          >
            Discard Draft
          </button>
          <button onClick={handleSubmit} className="btn text-white" style={gradientBtnStyle}>
            Save and Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
