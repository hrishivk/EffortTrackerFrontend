import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FormControl,
  MenuItem,
  Select,
  TextField,
  Switch,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import { Eye, EyeOff } from "lucide-react";

import { adduser } from "../../core/actions/action";
import { fetchAllExistProjects } from "../../core/actions/spAction";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { uservalidationSchema } from "../../utils/validation/Validation";
import type { project } from "../../shared/Project/types";
import { useAppSelector } from "../../store/configureStore";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "#e5e7eb" },
    "&:hover fieldset": { borderColor: "#D1D5DB" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
    },
  },
  "& .MuiInputBase-input": { padding: "10px 14px", fontSize: 13, fontWeight: 600 },
  "& .MuiSelect-select": { padding: "10px 14px" },
};

const CreateUser = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const isAM = role?.toUpperCase() === "AM";
  const currentRole = urlRole || (isAM ? "am" : "sp");
  const backPath = role === "SP" ? "/sp/userMangement" : `/${currentRole}/TeamManagement`;

  const { showSnackbar } = useSnackbar();
  const roleOptions = role === "SP" ? ["AM"] : ["USER", "DEVLOPER"];

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    jobTitle: "",
    employeeId: "",
    contactNumber: "",
    dateOfBirth: "",
    bloodGroup: "",
    role: "",
    department: "",
    workSchedule: "",
    joiningDate: "",
    projects: [] as string[],
    sendWelcomeEmail: true,
    requirePasswordChange: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [projectList, setProjectList] = useState<project[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetchAllExistProjects();
      setProjectList(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProject = (id: string) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.includes(id)
        ? prev.projects.filter((p) => p !== id)
        : [...prev.projects, id],
    }));
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleSubmit = async () => {
    const payload: Record<string, any> = {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      role: form.role,
      jobTitle: form.jobTitle,
      employeeId: form.employeeId,
      contactNumber: form.contactNumber,
      dateOfBirth: form.dateOfBirth,
      bloodGroup: form.bloodGroup,
      department: form.department,
      workSchedule: form.workSchedule,
      joiningDate: form.joiningDate,
      sendWelcomeEmail: form.sendWelcomeEmail,
      requirePasswordChange: form.requirePasswordChange,
    };

    // Only include projects if user selected any
    if (form.projects.length > 0) {
      payload.projects = form.projects;
    }

    const result = uservalidationSchema.safeParse(payload);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message;
      showSnackbar({ message: firstError || "Validation failed", severity: "error" });
      return;
    }

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
      {/* Breadcrumb + Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-1 mb-1">
          <button
            onClick={() => navigate(backPath)}
            className="btn btn-link p-0 text-decoration-none"
            style={{ color: "#6b7280", fontSize: 13, fontWeight: 500 }}
          >
            {role === "SP" ? "User Management" : "Team Management"}
          </button>
          <span style={{ color: "#9ca3af", fontSize: 13 }}>&rsaquo;</span>
          <span style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>Create New User</span>
        </div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
          Create New User
        </h2>
        <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
          Add a new member with detailed profile information and organizational roles.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3 border border-gray-200 p-4 mb-4">
        {/* ─── Avatar ─────────────────────────────────────── */}
        <div className="text-center mb-4">
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: form.fullName
                ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                : "#f3f4f6",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: form.fullName ? "3px solid #7c3aed" : "2px dashed #d1d5db",
            }}
          >
            <span
              style={{
                fontSize: form.fullName ? 32 : 14,
                fontWeight: 700,
                color: form.fullName ? "#fff" : "#9ca3af",
              }}
            >
              {form.fullName ? getInitials(form.fullName) : "?"}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 8 }}>
            {form.fullName || "New User"}
          </div>
        </div>

        {/* ─── Personal Information ──────────────────────────── */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <BadgeIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
          <h5 className="fw-bold mb-0" style={{ fontSize: 15 }}>Personal Information</h5>
        </div>

        {/* Full Name */}
        <div className="mb-3">
          <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            Full Name
          </label>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. John Doe"
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            sx={inputSx}
          />
        </div>

        {/* Email + Job Title */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Professional Email
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="john.doe@company.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              sx={inputSx}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Job Title
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Senior Product Designer"
              value={form.jobTitle}
              onChange={(e) => handleChange("jobTitle", e.target.value)}
              sx={inputSx}
            />
          </div>
        </div>

        {/* Employee ID + Contact */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Employee ID
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. RRX-001"
              value={form.employeeId}
              onChange={(e) => handleChange("employeeId", e.target.value)}
              sx={inputSx}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Contact Number
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="+1 (555) 000-0000"
              value={form.contactNumber}
              onChange={(e) => handleChange("contactNumber", e.target.value)}
              sx={inputSx}
            />
          </div>
        </div>

        {/* DOB + Blood Group */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Date of Birth
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              sx={inputSx}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Blood Group
            </label>
            <FormControl fullWidth size="small" sx={inputSx}>
              <Select
                displayEmpty
                value={form.bloodGroup}
                onChange={(e) => handleChange("bloodGroup", e.target.value)}
                renderValue={(val) => val || "Select Blood Group"}
                sx={{ color: form.bloodGroup ? "#111827" : "#9ca3af" }}
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        {/* ─── Organizational Details ────────────────────────── */}
        <div className="d-flex align-items-center gap-2 mb-3 mt-4">
          <BusinessIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
          <h5 className="fw-bold mb-0" style={{ fontSize: 15 }}>Organizational Details</h5>
        </div>

        {/* Role + Department */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Role Assignment
            </label>
            <FormControl fullWidth size="small" sx={inputSx}>
              <Select
                displayEmpty
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                renderValue={(val) => val || "Select Role"}
                sx={{ color: form.role ? "#111827" : "#9ca3af" }}
              >
                {roleOptions.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Department
            </label>
            <FormControl fullWidth size="small" sx={inputSx}>
              <Select
                displayEmpty
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                renderValue={(val) => val || "Select Department"}
                sx={{ color: form.department ? "#111827" : "#9ca3af" }}
              >
                {["Engineering", "Design", "Marketing", "Finance", "HR", "Operations"].map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Work Schedule + Joining Date */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Work Schedule
            </label>
            <FormControl fullWidth size="small" sx={inputSx}>
              <Select
                displayEmpty
                value={form.workSchedule}
                onChange={(e) => handleChange("workSchedule", e.target.value)}
                renderValue={(val) => val || "Select Schedule"}
                sx={{ color: form.workSchedule ? "#111827" : "#9ca3af" }}
              >
                {["Full-Time (9 AM - 5 PM)", "Part-Time", "Flexible", "Remote"].map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Joining Date
            </label>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={form.joiningDate}
              onChange={(e) => handleChange("joiningDate", e.target.value)}
              sx={inputSx}
            />
          </div>
        </div>

        {/* Password */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                sx={inputSx}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  color: "#6b7280",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Team Assignment (Optional) ─────────────────────── */}
        <div className="d-flex align-items-center gap-2 mb-1 mt-4">
          <GroupsIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
          <h5 className="fw-bold mb-0" style={{ fontSize: 15 }}>Team Assignment</h5>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9ca3af",
              backgroundColor: "#f3f4f6",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            Optional
          </span>
        </div>
        <p className="mb-3" style={{ fontSize: 12, color: "#6b7280" }}>
          You can assign projects now or do it later from the project page.
        </p>

        {projectList.length > 0 ? (
          <div className="row g-2 mb-4">
            {projectList.map((proj) => {
              const isSelected = form.projects.includes(proj.id);
              return (
                <div key={proj.id} className="col-md-6">
                  <div
                    onClick={() => toggleProject(proj.id)}
                    className="d-flex align-items-center gap-3 p-3 rounded-3"
                    style={{
                      border: isSelected ? "2px solid #7c3aed" : "1px solid #e5e7eb",
                      backgroundColor: isSelected ? "#f5f3ff" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: "#7c3aed",
                        cursor: "pointer",
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                        {proj.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        {proj.description || proj.domain || "Project"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center p-4 mb-4 rounded-3"
            style={{ backgroundColor: "#f9fafb", border: "1px dashed #e5e7eb" }}
          >
            <p className="mb-0" style={{ fontSize: 13, color: "#9ca3af" }}>
              No projects available. You can assign projects later.
            </p>
          </div>
        )}

        {/* ─── Settings Toggles ──────────────────────────────── */}
        <div className="d-flex flex-column gap-3 mb-2">
          <div
            className="d-flex align-items-center justify-content-between p-3 rounded-3"
            style={{ backgroundColor: "#f9fafb" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: 16, color: "#7c3aed" }}>&#9993;</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  Send Welcome Email
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  Send an invitation to join the platform immediately.
                </div>
              </div>
            </div>
            <Switch
              checked={form.sendWelcomeEmail}
              onChange={(e) => handleChange("sendWelcomeEmail", e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#7c3aed" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7c3aed" },
              }}
            />
          </div>

          <div
            className="d-flex align-items-center justify-content-between p-3 rounded-3"
            style={{ backgroundColor: "#f9fafb" }}
          >
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: 16, color: "#7c3aed" }}>&#128274;</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  Require Password Change
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  Force the user to set a new password on first login.
                </div>
              </div>
            </div>
            <Switch
              checked={form.requirePasswordChange}
              onChange={(e) => handleChange("requirePasswordChange", e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#7c3aed" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7c3aed" },
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="d-flex justify-content-end gap-3">
        <button
          onClick={() => navigate(backPath)}
          className="btn"
          style={{ fontSize: 13, fontWeight: 600, padding: "6px 16px", color: "#374151", borderRadius: 8, border: "1px solid #e5e7eb" }}
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
