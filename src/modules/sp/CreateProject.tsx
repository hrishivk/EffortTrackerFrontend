import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LinkIcon from "@mui/icons-material/Link";

import { addProject, fetchAllUsers, fetchExistDomains } from "../../core/actions/spAction";
import type { AvailableMember, ProjectFormData } from "./types";
import type { formUserData } from "../../shared/User/types";
import type { Domain } from "../../shared/Domain/types";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#D1D5DB" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
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

const CreateProject = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const user = useSelector((state: any) => state.user.user);
  const role = user?.role;
  const isAM = role?.toUpperCase() === "AM";
  const currentRole = urlRole || (isAM ? "am" : "sp");

  const [form, setForm] = useState<ProjectFormData>({
    name: "",
    category: "",
    description: "",
    startDate: "",
    endDate: "",
    domainId: "",
    teamMembers: [],
  });
  const [domains, setDomains] = useState<Domain[]>([]);

  const [members, setMembers] = useState<AvailableMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetchAllUsers();
      if (response?.data?.length) {
        setMembers(
          response.data.map((u: formUserData) => ({
            id: u.id || "",
            fullName: u.fullName,
            role: u.role,
            isOnLeave: u.isBlocked,
          }))
        );
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

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
    setForm((prev) => ({ ...prev, [field]: value }));
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

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const selectedMembers = members.filter((m) =>
    form.teamMembers.includes(m.id)
  );

  const handleSubmit = async () => {
    try {
      await addProject({
        name: form.name,
        description: form.description,
        domain_id: form.domainId,
        client_department: form.category,
        start_date: form.startDate,
        end_date: form.endDate,
      });
      navigate(`/${currentRole}/domain-project`);
    } catch (error) {
      console.log(error);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <button
        onClick={() => navigate(`/${currentRole}/domain-project`)}
        className="btn btn-link p-0 text-decoration-none mb-2"
        style={{ color: "#7c3aed", fontSize: 14, fontWeight: 500 }}
      >
        ← Back 
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

    
      <div className="bg-white rounded-3 border border-gray-200 p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 18, color: "#7c3aed" }}>🏷️</span>
            <h5 className="fw-bold mb-0">Select Domain</h5>
          </div>
          <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 500 }}>
            {domains.length} Domains
          </span>
        </div>

  
        {form.domainId && (() => {
          const selected = domains.find((d) => String(d.id) === form.domainId);
          return selected ? (
            <div className="mb-3 p-3 rounded-3" style={{ backgroundColor: "#f5f3ff", border: "1px solid #e9d5ff" }}>
              <p className="mb-1" style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{selected.name}</span>
                    {selected.description && (
                      <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>{selected.description}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleChange("domainId", "")}
                  className="btn btn-sm p-0"
                  style={{ color: "#9ca3af", fontSize: 16, lineHeight: 1 }}
                >
                  ×
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
                        : "1px solid #e5e7eb",
                      backgroundColor: isSelected ? "#f5f3ff" : "#fff",
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
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                          {domain.name}
                        </div>
                        {domain.description && (
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
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
                          ✓
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
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
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

      <div className="bg-white rounded-3 border border-gray-200 p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <span style={{ fontSize: 18 }}>📋</span>
          <h5 className="fw-bold mb-0">Project Information</h5>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Project Name
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Q4 Growth Strategy"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              sx={inputSx}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Project Category
            </label>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Select a category</InputLabel>
              <Select
                label="Select a category"
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                MenuProps={menuProps}
              >
                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Research">Research</MenuItem>
                <MenuItem value="Infrastructure">Infrastructure</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
            Description
          </label>
          <div
            className="border rounded-3"
            style={{ borderColor: "#e5e7eb", overflow: "hidden" }}
          >
            <div
              className="d-flex align-items-center gap-1 px-3 py-2"
              style={{
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#fafafa",
              }}
            >
              <button className="btn btn-sm p-1" style={{ color: "#6b7280" }}>
                <FormatBoldIcon sx={{ fontSize: 18 }} />
              </button>
              <button className="btn btn-sm p-1" style={{ color: "#6b7280" }}>
                <FormatItalicIcon sx={{ fontSize: 18 }} />
              </button>
              <button className="btn btn-sm p-1" style={{ color: "#6b7280" }}>
                <FormatListBulletedIcon sx={{ fontSize: 18 }} />
              </button>
              <button className="btn btn-sm p-1" style={{ color: "#6b7280" }}>
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
              }}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Start Date
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              sx={inputSx}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              End Date
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              sx={inputSx}
            />
          </div>
        </div>
      </div>

      {members.length > 0 && (
      <div className="bg-white rounded-3 border border-gray-200 p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 18, color: "#7c3aed" }}>👥</span>
            <h5 className="fw-bold mb-0">Assign Team Members</h5>
          </div>
          <span
            style={{ fontSize: 13, color: "#7c3aed", fontWeight: 500 }}
          >
            {members.length} Available Members
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
                      : "1px solid #e5e7eb",
                    backgroundColor: isSelected
                      ? "#f5f3ff"
                      : member.isOnLeave
                        ? "#f9fafb"
                        : "#fff",
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
                        backgroundColor: isSelected ? "#7c3aed" : "#e5e7eb",
                        color: isSelected ? "#fff" : "#6b7280",
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
                          color: "#111827",
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
                        <span style={{ fontSize: 11, color: "#6b7280" }}>
                          {member.role}
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
                        ✓
                      </div>
                    ) : member.isOnLeave ? (
                      <span style={{ color: "#9ca3af", fontSize: 18 }}>⊘</span>
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

        {/* Selected chips */}
        {selectedMembers.length > 0 && (
          <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: "#f9fafb" }}>
            <p
              className="mb-2"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6b7280",
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
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                >
                  {m.fullName}
                  <button
                    onClick={() => removeMember(m.id)}
                    className="btn btn-sm p-0 ms-1"
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Footer */}
      <div className="d-flex justify-content-between align-items-center">
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          ℹ You can add more team members later.
        </span>
        <div className="d-flex gap-3">
          <button
            onClick={() => navigate(`/${currentRole}/domain-project`)}
            className="btn"
            style={{ fontSize: 13, fontWeight: 600, padding: "6px 16px", color: "#374151", borderRadius: 8, border: "1px solid #e5e7eb" }}
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
            Save and Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
