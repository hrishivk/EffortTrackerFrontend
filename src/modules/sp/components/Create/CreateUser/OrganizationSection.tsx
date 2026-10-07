import { useState } from "react";
import { FormControl, MenuItem, Select, TextField } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import { Eye, EyeOff } from "lucide-react";
import type { Domain } from "../../../../../shared/types/Domain";
import {
  ErrorText,
  FieldLabel,
  LabeledSelect,
  LabeledTextField,
  SectionHeader,
  ToggleCard,
  fieldSx,
} from "./formControls";
import { WORK_SCHEDULES, type ChangeHandler, type FieldErrors, type UserForm } from "./createUserUtils";

type Props = {
  form: UserForm;
  errors: FieldErrors;
  canShare: boolean;
  roleOptions: string[];
  domainList: Domain[];
  onChange: ChangeHandler;
  onSharedToggle: (shared: boolean) => void;
  onDepartmentsChange: (names: string[]) => void;
};

const OrganizationSection = ({
  form,
  errors,
  canShare,
  roleOptions,
  domainList,
  onChange,
  onSharedToggle,
  onDepartmentsChange,
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <SectionHeader
        icon={<BusinessIcon sx={{ fontSize: 18, color: "#7c3aed" }} />}
        title="Organizational Details"
      />

      {canShare && (
        <ToggleCard
          icon={"\u{1F465}"}
          title="Shared across managers"
          description="For staff who work across departments (testers, QA, designers). Choose the departments below — every manager in those departments will see this user."
          checked={form.is_shared}
          onToggle={onSharedToggle}
          className="d-flex align-items-center justify-content-between p-3 mb-3 rounded-3"
          style={{
            backgroundColor: form.is_shared ? "#f5f3ff" : "var(--bg-surface)",
            border: form.is_shared ? "1px solid #ddd6fe" : "1px solid var(--border-light)",
          }}
        >
          {form.is_shared && (
            <div style={{ fontSize: 11, fontWeight: 500, color: "#d97706", marginTop: 4 }}>
              Only a super admin can change this later.
            </div>
          )}
        </ToggleCard>
      )}

      <div className="row mb-3">
        <div className="col-md-6">
          <LabeledSelect
            label="Role Assignment"
            required
            placeholder="Select Role"
            options={roleOptions}
            value={form.role}
            onValueChange={(v) => onChange("role", v)}
            error={errors.role}
          />
          {form.is_shared && (
            <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "4px 0 0" }}>
              Shared users are always created with the USER role.
            </p>
          )}
        </div>
        <div className="col-md-6">
          <FieldLabel label="Departments" required />
          <FormControl fullWidth size="small" error={!!errors.department} sx={fieldSx(errors.department)}>
            <Select
              multiple
              displayEmpty
              value={form.departments}
              onChange={(e) => {
                const v = e.target.value;
                onDepartmentsChange(typeof v === "string" ? v.split(",") : v);
              }}
              renderValue={(val) => (val.length ? val.join(", ") : "Select Departments")}
              sx={{ color: form.departments.length ? "var(--text-primary)" : "var(--text-faint)" }}
            >
              {domainList.length === 0 && (
                <MenuItem disabled value="">
                  No departments yet — create one first
                </MenuItem>
              )}
              {domainList.map((domain) => (
                <MenuItem key={domain.id} value={domain.name}>
                  <input
                    type="checkbox"
                    checked={form.departments.includes(domain.name)}
                    readOnly
                    style={{ width: 14, height: 14, marginRight: 8, accentColor: "#7c3aed" }}
                  />
                  {domain.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ErrorText message={errors.department} />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <LabeledSelect
            label="Work Schedule"
            required
            placeholder="Select Schedule"
            options={WORK_SCHEDULES}
            value={form.workSchedule}
            onValueChange={(v) => onChange("workSchedule", v)}
            error={errors.workSchedule}
          />
        </div>
        <div className="col-md-6">
          <LabeledTextField
            label="Joining Date"
            required
            type="date"
            value={form.joiningDate}
            onValueChange={(v) => onChange("joiningDate", v)}
            inputProps={{ max: todayStr }}
            error={errors.joiningDate}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <FieldLabel label="Password" required />
          <div style={{ position: "relative" }}>
            <TextField
              fullWidth
              size="small"
              type={showPassword ? "text" : "password"}
              name="newUserPassword"
              autoComplete="new-password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              sx={fieldSx(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              style={{
                position: "absolute",
                right: 10,
                top: errors.password ? "30%" : "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                color: "var(--text-muted)",
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationSection;
