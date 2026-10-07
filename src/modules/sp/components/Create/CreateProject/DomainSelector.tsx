import type { Domain } from "../../../../../shared/types/Domain";
import {
  CheckBadge,
  PlusMark,
  RequiredMark,
  SectionCard,
  gradientBtnStyle,
  sectionLabelStyle,
} from "./shared";

type Props = {
  domains: Domain[];
  selectedId: string;
  error?: string;
  onSelect: (id: string) => void;
  onCreateDomain: () => void;
};

const DomainSelector = ({ domains, selectedId, error, onSelect, onCreateDomain }: Props) => {
  const selected = selectedId
    ? domains.find((d) => String(d.id) === selectedId)
    : undefined;

  return (
    <SectionCard borderColor={error ? "#ef4444" : "var(--border-light)"}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 18, color: "#7c3aed" }}>🏷️</span>
          <h5 className="fw-bold mb-0">Select Department <RequiredMark /></h5>
        </div>
        <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 500 }}>
          {domains.length} Domains
        </span>
      </div>
      {error && (
        <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 500, margin: "-4px 0 8px" }}>{error}</p>
      )}

      {selected && (
        <div className="mb-3 p-3 rounded-3" style={{ backgroundColor: "#f5f3ff", border: "1px solid #e9d5ff" }}>
          <p className="mb-1" style={sectionLabelStyle}>
            Selected Department:
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
              onClick={() => onSelect("")}
              className="btn btn-sm p-0"
              style={{ color: "var(--text-faint)", fontSize: 16, lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="row g-2" style={{ maxHeight: 280, overflowY: "auto" }}>
        {domains.map((domain) => {
          const isSelected = selectedId === String(domain.id);
          return (
            <div key={domain.id} className="col-md-6">
              <div
                onClick={() => onSelect(String(domain.id))}
                className="d-flex align-items-center justify-content-between p-3 rounded-3"
                style={{
                  border: isSelected ? "2px solid #7c3aed" : "1px solid var(--border-light)",
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
                <div>{isSelected ? <CheckBadge /> : <PlusMark />}</div>
              </div>
            </div>
          );
        })}
      </div>

      {domains.length === 0 && (
        <div className="text-center py-4">
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
            No departments found. Create a department first.
          </p>
          <button onClick={onCreateDomain} className="btn text-white" style={gradientBtnStyle}>
            + Create Department
          </button>
        </div>
      )}
    </SectionCard>
  );
};

export default DomainSelector;
