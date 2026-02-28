import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { TextField } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LinkIcon from "@mui/icons-material/Link";

import { addDomain, deleteDomain, fetchExistDomains } from "../../../core/actions/spAction";
import { Trash2 } from "lucide-react";
import { DomainValidationSchema } from "../../../utils/validation/Validation";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import Dialoge from "../../../presentation/Dialog/Dialog";
import type { Domain } from "../../../shared/types/Domain";

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
  "& .MuiInputBase-input": {
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
  },
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
  "& .MuiInputBase-input": {
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
  },
};

const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 500, margin: "4px 0 0" }}>{message}</p>
  ) : null;

const CreateDomain = () => {
  const navigate = useNavigate();
  const { role: urlRole } = useParams();
  const user = useSelector((state: any) => state.user.user);
  const role = user?.role;
  const isAM = role?.toUpperCase() === "AM";
  const currentRole = urlRole || (isAM ? "am" : "sp");
  const { showSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [domains, setDomains] = useState<Domain[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const listAllDomains = useCallback(async () => {
    try {
      const response = await fetchExistDomains();
      setDomains(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    listAllDomains();
  }, [listAllDomains]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDomain(String(deleteId));
      showSnackbar({ message: "Domain deleted successfully", severity: "success" });
      await listAllDomains();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to delete domain.";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSubmit = async () => {
    const result = DomainValidationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      const firstError = result.error.errors[0]?.message;
      showSnackbar({ message: firstError, severity: "error" });
      return;
    }

    setErrors({});
    try {
      await addDomain(formData);
      showSnackbar({
        message: "Domain Created Successfully",
        severity: "success",
      });
      navigate(`/${currentRole}/domain-project`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to create domain.";
      showSnackbar({ message: msg, severity: "error" });
    }
  };

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
            Create New Domain
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            Define a new domain to organize and categorize your projects.
          </p>
        </div>
      </div>
      <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="d-flex align-items-center gap-2 mb-4">
          <span style={{ fontSize: 18 }}>🏷️</span>
          <h5 className="fw-bold mb-0">Domain Information</h5>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
            Domain Name <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <TextField
            fullWidth
            size="small"
            name="name"
            placeholder="e.g. Finance, Engineering, Marketing"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            sx={sx("name")}
          />
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
              name="description"
              placeholder="Describe the purpose and scope of this domain..."
              value={formData.description}
              onChange={handleChange}
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
      </div>
      {domains.length > 0 && (
        <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ fontSize: 18, color: "#7c3aed" }}>📂</span>
            <h5 className="fw-bold mb-0">Existing Domains</h5>
            <span
              className="ms-auto"
              style={{ fontSize: 13, color: "#7c3aed", fontWeight: 500 }}
            >
              {domains.length} Domains
            </span>
          </div>

          <div
            className="d-flex flex-column gap-2"
            style={{ maxHeight: 320, overflowY: "auto" }}
          >
            {domains.map((item, index) => (
              <div
                key={index}
                className="d-flex align-items-center gap-3 p-3 rounded-3"
                style={{
                  border: "1px solid var(--border-light)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "#f3e8ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7c3aed",
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {item.description}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="btn btn-sm p-1"
                  style={{ color: "#dc3545", flexShrink: 0 }}
                  title="Delete domain"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center">
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          &#8505; Domains help organize projects into logical categories.
        </span>
        <div className="d-flex gap-3">
          <button
            onClick={() => navigate(`/${currentRole}/domain-project`)}
            className="btn"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 16px",
              color: "var(--text-secondary)",
              borderRadius: 8,
              border: "1px solid var(--border-light)",
            }}
          >
            Cancel
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
            Create Domain &rarr;
          </button>
        </div>
      </div>
      <Dialoge
        open={deleteId !== null}
        data="delete"
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default CreateDomain;
