import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LinkIcon from "@mui/icons-material/Link";

import { addProject, assignProjectMembers, fetchUsers, fetchAllUsers, fetchExistDomains } from "../../../../core/actions/spAction";
import { ProjectValidationSchema } from "../../../../utils/validation/Validation";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import type { AvailableMember, ProjectFormData } from "../../types";
import type { formUserData } from "../../../../shared/types/User";
import type { Domain } from "../../../../shared/types/Domain";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-card)",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
    },
  },
  "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600 },
  "& .MuiSelect-select": { padding: "6px 12px" },
};

const errorSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#fef2f2",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "#ef4444" },
    "&:hover fieldset": { borderColor: "#dc2626" },
    "&.Mui-focused fieldset": {
      borderColor: "#dc2626",
      boxShadow: "0 0 0 2px rgba(239,68,68,0.12)",
    },
  },
  "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600 },
  "& .MuiSelect-select": { padding: "6px 12px" },
};

const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 500, margin: "4px 0 0" }}>{message}</p>
  ) : null;

const CreateProject = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const user = useSelector((state: any) => state.user.user);
  const role = user?.role;
  const isAM = role?.toUpperCase() === "AM";
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
      if (field === "category" && value !== prev.category) {
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

  const categoryMembers = form.category
    ? members.filter(
        (m) => m.department?.toLowerCase() === form.category.toLowerCase()
      )
    : members;

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
      navigate(`/${currentRole}/domain-project`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to create project";
      showSnackbar({ message: msg, severity: "error" });
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const sx = (field: string) => (errors[field] ? errorSx : inputSx);

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <button
        onClick={() => navigate(`/${currentRole}/domain-project`)}
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


      <div
        className="rounded-3 border p-4 mb-4"
        style={{ backgroundColor: "var(--bg-card)", borderColor: errors.domainId ? "#ef4444" : "var(--border-light)" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 18, color: "#7c3aed" }}>🏷️</span>
            <h5 className="fw-bold mb-0">Select Domain <span style={{ color: "#ef4444" }}>*</span></h5>
          </div>
          <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 500 }}>
            {domains.length} Domains
          </span>
        </div>
        {errors.domainId && (
          <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 500, margin: "-4px 0 8px" }}>{errors.domainId}</p>
        )}

        {form.domainId && (() => {
          const selected = domains.find((d) => String(d.id) === form.domainId);
          return selected ? (
            <div className="mb-3 p-3 rounded-3" style={{ backgroundColor: "#f5f3ff", border: "1px solid #e9d5ff" }}>
              <p className="mb-1" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Selected Domain:
              </p>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: "#7c3aed",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{selected.name}</span>
                    {selected.description && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{selected.description}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleChange("domainId", "")}
                  className="btn btn-sm p-0"
                  style={{ color: "var(--text-faint)", fontSize: 16, lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            </div>
          ) : null;
        })()}

        <div className="row g-2" style={{ maxHeight: 280, overflowY: "auto" }}>
          {domains.map((domain) => {
              const isSelected = form.domainId === String(domain.id);
              return (
                <div key={domain.id} className="col-md-6">
                  <div
                    onClick={() => handleChange("domainId", String(domain.id))}
                    className="d-flex align-items-center justify-content-between p-3 rounded-3"
                    style={{
                      border: isSelected
                        ? "2px solid #7c3aed"
                        : "1px solid var(--border-light)",
                      backgroundColor: isSelected ? "#f5f3ff" : "var(--bg-card)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isSelected ? "#7c3aed" : "#f3e8ff",
                          color: isSelected ? "#fff" : "#7c3aed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {domain.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                          {domain.name}
                        </div>
                        {domain.description && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {domain.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {isSelected ? (
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            backgroundColor: "#7c3aed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 14,
                          }}
                        >
                          &#10003;
                        </div>
                      ) : (
                        <span style={{ color: "#7c3aed", fontSize: 20, fontWeight: 300 }}>
                          +
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {domains.length === 0 && (
          <div className="text-center py-4">
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
              No domains found. Create a domain first.
            </p>
            <button
              onClick={() => navigate(`/${currentRole}/create-domain`)}
              className="btn text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 16px",
              }}
            >
              + Create Domain
            </button>
          </div>
        )}
      </div>


      <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="d-flex align-items-center gap-2 mb-4">
          <span style={{ fontSize: 18 }}>📋</span>
          <h5 className="fw-bold mb-0">Project Information</h5>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Project Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Q4 Growth Strategy"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              sx={sx("name")}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Project Category <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <FormControl fullWidth size="small" error={!!errors.category} sx={sx("category")}>
              <Select
                displayEmpty
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                renderValue={(val) => val || "Select a category"}
                sx={{ color: form.category ? "#111827" : "#9ca3af" }}
                MenuProps={menuProps}
              >
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
              </Select>
            </FormControl>
            <ErrorText message={errors.category} />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
            Description <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div
            className="border rounded-3"
            style={{
              borderColor: errors.description ? "#ef4444" : "var(--border-light)",
              overflow: "hidden",
              backgroundColor: errors.description ? "#fef2f2" : "var(--bg-card)",
            }}
          >
            <div
              className="d-flex align-items-center gap-1 px-3 py-2"
              style={{
                borderBottom: `1px solid ${errors.description ? "#ef4444" : "var(--border-light)"}`,
                backgroundColor: errors.description ? "#fef2f2" : "var(--bg-surface)",
              }}
            >
              <button className="btn btn-sm p-1" style={{ color: "var(--text-muted)" }}>
                <FormatBoldIcon sx={{ fontSize: 18 }} />
              </button>
              <button className="btn btn-sm p-1" style={{ color: "var(--text-muted)" }}>
                <FormatItalicIcon sx={{ fontSize: 18 }} />
              </button>
              <button className="btn btn-sm p-1" style={{ color: "var(--text-muted)" }}>
                <FormatListBulletedIcon sx={{ fontSize: 18 }} />
              </button>
              <button className="btn btn-sm p-1" style={{ color: "var(--text-muted)" }}>
                <LinkIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            <textarea
              className="form-control border-0"
              rows={4}
              placeholder="Outline the project goals, scope, and key deliverables..."
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              style={{
                resize: "none",
                fontSize: 14,
                boxShadow: "none",
                backgroundColor: errors.description ? "#fef2f2" : "var(--bg-card)",
              }}
            />
          </div>
          <ErrorText message={errors.description} />
        </div>

        <div className="row">
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Start Date <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              error={!!errors.startDate}
              helperText={errors.startDate}
              sx={sx("startDate")}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              End Date <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              error={!!errors.endDate}
              helperText={errors.endDate}
              sx={sx("endDate")}
            />
          </div>
        </div>
      </div>

      <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 18, color: "#7c3aed" }}>👥</span>
            <h5 className="fw-bold mb-0">
              {role?.toUpperCase() === "SP" ? "Assign Managers (AM)" : "Assign Team Members"}
            </h5>
          </div>
          <span
            style={{ fontSize: 13, color: "#7c3aed", fontWeight: 500 }}
          >
            {categoryMembers.length} Available Members
          </span>
        </div>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by name, role, or skillset..."
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          sx={{ ...inputSx, mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#9ca3af", fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Members Grid */}
        {!form.category && (
          <div
            className="d-flex align-items-center justify-content-center p-4 rounded-3 mb-2"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border-light)" }}
          >
            <p className="mb-0" style={{ fontSize: 13, color: "var(--text-faint)" }}>
              Select a project category above to see available team members.
            </p>
          </div>
        )}
        {form.category && categoryMembers.length === 0 && (
          <div
            className="d-flex align-items-center justify-content-center p-4 rounded-3 mb-2"
            style={{ backgroundColor: "#fef2f2", border: "1px dashed #fecaca" }}
          >
            <p className="mb-0" style={{ fontSize: 13, color: "#dc2626" }}>
              No team members found in the "{form.category}" department.
            </p>
          </div>
        )}
        <div className="row g-2">
          {filteredMembers.map((member) => {
            const isSelected = form.teamMembers.includes(member.id);
            return (
              <div key={member.id} className="col-md-6">
                <div
                  onClick={() => !member.isOnLeave && toggleMember(member.id)}
                  className="d-flex align-items-center justify-content-between p-3 rounded-3"
                  style={{
                    border: isSelected
                      ? "2px solid #7c3aed"
                      : "1px solid var(--border-light)",
                    backgroundColor: isSelected
                      ? "#f5f3ff"
                      : member.isOnLeave
                        ? "var(--bg-surface)"
                        : "var(--bg-card)",
                    cursor: member.isOnLeave ? "not-allowed" : "pointer",
                    opacity: member.isOnLeave ? 0.6 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: isSelected ? "#7c3aed" : "var(--border-light)",
                        color: isSelected ? "#fff" : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(member.fullName)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--text-primary)",
                        }}
                      >
                        {member.fullName}
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: member.isOnLeave
                              ? "#9ca3af"
                              : "#22c55e",
                            display: "inline-block",
                          }}
                        />
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {member.role}
                          {member.department && ` · ${member.department}`}
                          {member.isOnLeave && " (On Leave)"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {isSelected ? (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          backgroundColor: "#7c3aed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 14,
                        }}
                      >
                        &#10003;
                      </div>
                    ) : member.isOnLeave ? (
                      <span style={{ color: "#9ca3af", fontSize: 18 }}>&#8856;</span>
                    ) : (
                      <span
                        style={{
                          color: "#7c3aed",
                          fontSize: 20,
                          fontWeight: 300,
                        }}
                      >
                        +
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedMembers.length > 0 && (
          <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: "var(--bg-surface)" }}>
            <p
              className="mb-2"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Selected:
            </p>
            <div className="d-flex flex-wrap gap-2">
              {selectedMembers.map((m) => (
                <span
                  key={m.id}
                  className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                    fontSize: 13,
                  }}
                >
                  {m.fullName}
                  <button
                    onClick={() => removeMember(m.id)}
                    className="btn btn-sm p-0 ms-1"
                    style={{
                      color: "var(--text-faint)",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>


      <div className="d-flex justify-content-between align-items-center">
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          &#8505; You can add more team members later.
        </span>
        <div className="d-flex gap-3">
          <button
            onClick={() => navigate(`/${currentRole}/domain-project`)}
            className="btn"
            style={{ fontSize: 13, fontWeight: 600, padding: "6px 16px", color: "var(--text-secondary)", borderRadius: 8, border: "1px solid var(--border-light)" }}
          >
            Discard Draft
          </button>
          <button
            onClick={handleSubmit}
            className="btn text-white"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 16px",
            }}
          >
            Save and Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
