import { FormControl, MenuItem, Select, TextField } from "@mui/material";
import { PROJECT_CATEGORIES } from "../../DomainProject/constants";
import type { ProjectFormData } from "../../../types";
import {
  ErrorText,
  RequiredMark,
  SectionCard,
  errorSx,
  inputSx,
  menuProps,
} from "./shared";

type Props = {
  form: ProjectFormData;
  errors: Record<string, string>;
  onChange: (field: keyof ProjectFormData, value: string) => void;
};

const labelStyle = { fontSize: 13 };

const ProjectInfoSection = ({ form, errors, onChange }: Props) => {
  const sx = (field: string) => (errors[field] ? errorSx : inputSx);

  const dateField = (field: "startDate" | "endDate", label: string) => (
    <div className="col-md-6">
      <label className="form-label fw-semibold" style={labelStyle}>
        {label} <RequiredMark />
      </label>
      <TextField
        fullWidth
        size="small"
        type="date"
        value={form[field]}
        onChange={(e) => onChange(field, e.target.value)}
        error={!!errors[field]}
        helperText={errors[field]}
        sx={sx(field)}
      />
    </div>
  );

  return (
    <SectionCard>
      <div className="d-flex align-items-center gap-2 mb-4">
        <span style={{ fontSize: 18 }}>📋</span>
        <h5 className="fw-bold mb-0">Project Information</h5>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold" style={labelStyle}>
            Project Name <RequiredMark />
          </label>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Q4 Growth Strategy"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            sx={sx("name")}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" style={labelStyle}>
            Project Category <RequiredMark />
          </label>
          <FormControl fullWidth size="small" error={!!errors.category} sx={sx("category")}>
            <Select
              displayEmpty
              value={form.category}
              onChange={(e) => onChange("category", e.target.value)}
              renderValue={(val) => val || "Select a category"}
              sx={{ color: form.category ? "#111827" : "#9ca3af" }}
              MenuProps={menuProps}
            >
              {PROJECT_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ErrorText message={errors.category} />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold" style={labelStyle}>
          Description <RequiredMark />
        </label>
        <div
          className="border rounded-3"
          style={{
            borderColor: errors.description ? "#ef4444" : "var(--border-light)",
            overflow: "hidden",
            backgroundColor: errors.description ? "#fef2f2" : "var(--bg-card)",
          }}
        >
          <textarea
            className="form-control border-0"
            rows={4}
            placeholder="Outline the project goals, scope, and key deliverables..."
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
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
        {dateField("startDate", "Start Date")}
        {dateField("endDate", "End Date")}
      </div>
    </SectionCard>
  );
};

export default ProjectInfoSection;
