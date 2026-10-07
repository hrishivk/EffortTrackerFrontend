import BadgeIcon from "@mui/icons-material/Badge";
import { LabeledSelect, LabeledTextField, SectionHeader } from "./formControls";
import { BLOOD_GROUPS, getInitials, type ChangeHandler, type FieldErrors, type UserForm } from "./createUserUtils";

type Props = {
  form: UserForm;
  errors: FieldErrors;
  onChange: ChangeHandler;
};

const AvatarPreview = ({ fullName }: { fullName: string }) => (
  <div className="text-center mb-4">
    <div
      style={{
        width: 90,
        height: 90,
        borderRadius: "50%",
        background: fullName ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#f3f4f6",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: fullName ? "3px solid #7c3aed" : "2px dashed #d1d5db",
      }}
    >
      <span
        style={{
          fontSize: fullName ? 32 : 14,
          fontWeight: 700,
          color: fullName ? "#fff" : "#9ca3af",
        }}
      >
        {fullName ? getInitials(fullName) : "?"}
      </span>
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginTop: 8 }}>
      {fullName || "New User"}
    </div>
  </div>
);

const PersonalInfoSection = ({ form, errors, onChange }: Props) => (
  <>
    <AvatarPreview fullName={form.fullName} />

    <SectionHeader
      className="d-flex align-items-center gap-2 mb-3"
      icon={<BadgeIcon sx={{ fontSize: 18, color: "#7c3aed" }} />}
      title="Personal Information"
    />

    <div className="mb-3">
      <LabeledTextField
        label="Full Name"
        required
        placeholder="e.g. John Doe"
        value={form.fullName}
        onValueChange={(v) => onChange("fullName", v)}
        error={errors.fullName}
      />
    </div>

    <div className="row mb-3">
      <div className="col-md-6">
        <LabeledTextField
          label="Professional Email"
          required
          placeholder="john.doe@company.com"
          value={form.email}
          onValueChange={(v) => onChange("email", v)}
          error={errors.email}
        />
      </div>
      <div className="col-md-6">
        <LabeledTextField
          label="Job Title"
          required
          placeholder="e.g. Senior Product Designer"
          value={form.jobTitle}
          onValueChange={(v) => onChange("jobTitle", v)}
          error={errors.jobTitle}
        />
      </div>
    </div>

    <div className="row mb-3">
      <div className="col-md-6">
        <LabeledTextField
          label="Employee ID"
          required
          placeholder="e.g. RRX-001"
          value={form.employeeId}
          onValueChange={(v) => onChange("employeeId", v)}
          error={errors.employeeId}
        />
      </div>
      <div className="col-md-6">
        <LabeledTextField
          label="Contact Number"
          required
          placeholder="10-digit mobile number"
          value={form.contactNumber}
          onValueChange={(v) => onChange("contactNumber", v.replace(/\D/g, "").slice(0, 10))}
          inputProps={{ inputMode: "numeric", maxLength: 10 }}
          error={errors.contactNumber}
        />
      </div>
    </div>

    <div className="row mb-3">
      <div className="col-md-6">
        <LabeledTextField
          label="Date of Birth"
          required
          type="date"
          value={form.dateOfBirth}
          onValueChange={(v) => onChange("dateOfBirth", v)}
          error={errors.dateOfBirth}
        />
      </div>
      <div className="col-md-6">
        <LabeledSelect
          label="Blood Group"
          placeholder="Select Blood Group"
          options={BLOOD_GROUPS}
          value={form.bloodGroup}
          onValueChange={(v) => onChange("bloodGroup", v)}
          error={errors.bloodGroup}
        />
      </div>
    </div>
  </>
);

export default PersonalInfoSection;
