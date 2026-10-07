import type { ComponentProps } from "react";
import { CircularProgress, MenuItem, Select, TextField } from "@mui/material";
import { FiInfo } from "react-icons/fi";
import EuField from "./EuField";
import AccessSection from "./AccessSection";
import { BLOOD_GROUPS, ROLE_LABELS, type EditUserForm, type FieldErrors } from "./editUserUtils";

type SxFor = (field: string) => object;

interface DetailsTabProps extends Omit<ComponentProps<typeof AccessSection>, "form" | "errors"> {
  form: EditUserForm;
  errors: FieldErrors;
  sx: SxFor;
  loading: boolean;
  roleOptions: string[];
  setField: (field: keyof EditUserForm, value: string | boolean) => void;
  userId?: string;
  createdOn: string;
  lastActive: string;
}

const DetailsTab = ({
  form,
  errors,
  sx,
  loading,
  roleOptions,
  setField,
  userId,
  createdOn,
  lastActive,
  ...access
}: DetailsTabProps) => {
  /** A plain text input bound to one form field. */
  const text = (
    field: keyof EditUserForm,
    extra: Partial<ComponentProps<typeof TextField>> = {},
    map: (value: string) => string = (v) => v,
  ) => (
    <TextField
      fullWidth
      size="small"
      sx={sx(field)}
      value={form[field] as string}
      onChange={(e) => setField(field, map(e.target.value))}
      {...extra}
    />
  );

  return (
    <div className="eu-body">
      <p className="eu-section-title">Basic Information</p>
      <div className="eu-grid">
        <EuField label="Full Name" required error={errors.fullName}>
          {text("fullName")}
        </EuField>

        <EuField label="Email Address" required error={errors.email}>
          {text("email", {}, (v) => v.trim())}
        </EuField>

        <EuField label="Role" required error={errors.role}>
          <Select
            fullWidth
            size="small"
            sx={sx("role")}
            value={form.role}
            onChange={(e) => setField("role", e.target.value)}
          >
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r] || r}
              </MenuItem>
            ))}
          </Select>
        </EuField>

        <EuField label="Phone Number" error={errors.contactNumber}>
          {text("contactNumber", { placeholder: "10-digit number" }, (v) =>
            v.replace(/\D/g, "").slice(0, 10),
          )}
        </EuField>

        <EuField label="Designation" error={errors.jobTitle}>
          {text("jobTitle", { placeholder: "e.g. Intern" })}
        </EuField>
      </div>

      <p className="eu-section-title eu-section-title-row">
        Employment
        {loading && (
          <span className="eu-section-loading">
            <CircularProgress size={13} thickness={5} sx={{ color: "#6d28d9" }} />
            Loading…
          </span>
        )}
      </p>
      <div className={`eu-grid ${loading ? "is-loading" : ""}`}>
        <EuField label="Employee ID" error={errors.employeeId}>
          {text("employeeId", { disabled: loading })}
        </EuField>

        <EuField label="Date of Birth" error={errors.dateOfBirth}>
          {text("dateOfBirth", { type: "date", disabled: loading })}
        </EuField>

        <EuField label="Blood Group" error={errors.bloodGroup}>
          <Select
            fullWidth
            size="small"
            displayEmpty
            disabled={loading}
            sx={sx("bloodGroup")}
            value={form.bloodGroup}
            onChange={(e) => setField("bloodGroup", e.target.value)}
          >
            <MenuItem value="">
              <span style={{ color: "var(--text-muted)" }}>Not set</span>
            </MenuItem>
            {BLOOD_GROUPS.map((group) => (
              <MenuItem key={group} value={group}>
                {group}
              </MenuItem>
            ))}
          </Select>
        </EuField>

        <EuField label="Joining Date" error={errors.joiningDate}>
          {text("joiningDate", { type: "date", disabled: loading })}
        </EuField>
      </div>

      <AccessSection form={form} errors={errors} {...access} />

      <p className="eu-section-title">Account Information</p>
      <div className="eu-grid">
        <EuField label="User ID">
          <div className="eu-readonly">{userId}</div>
        </EuField>
        <EuField label="Created On">
          <div className="eu-readonly">{createdOn}</div>
        </EuField>
        <EuField label="Last Active" full>
          <div className="eu-readonly">{lastActive}</div>
        </EuField>
      </div>

      <p className="eu-note">
        <FiInfo size={13} />
        A role change takes effect the next time the user loads the app.
      </p>
    </div>
  );
};

export default DetailsTab;
