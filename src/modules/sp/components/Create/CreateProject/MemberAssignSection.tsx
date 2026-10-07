import { InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { AvailableMember } from "../../../types";
import MemberCard from "./MemberCard";
import { SectionCard, inputSx, sectionLabelStyle } from "./shared";

type Props = {
  isSP: boolean;
  domainId: string;
  category: string;
  teamMembers: string[];
  domainScopedMembers: AvailableMember[];
  categoryMembers: AvailableMember[];
  filteredMembers: AvailableMember[];
  selectedMembers: AvailableMember[];
  memberSearch: string;
  onSearchChange: (value: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

const Notice = ({ message, error }: { message: string; error?: boolean }) => (
  <div
    className="d-flex align-items-center justify-content-center p-4 rounded-3 mb-2"
    style={
      error
        ? { backgroundColor: "#fef2f2", border: "1px dashed #fecaca" }
        : { backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border-light)" }
    }
  >
    <p className="mb-0" style={{ fontSize: 13, color: error ? "#dc2626" : "var(--text-faint)" }}>
      {message}
    </p>
  </div>
);

const MemberAssignSection = ({
  isSP,
  domainId,
  category,
  teamMembers,
  domainScopedMembers,
  categoryMembers,
  filteredMembers,
  selectedMembers,
  memberSearch,
  onSearchChange,
  onToggle,
  onRemove,
}: Props) => (
  <SectionCard>
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div className="d-flex align-items-center gap-2">
        <span style={{ fontSize: 18, color: "#7c3aed" }}>👥</span>
        <h5 className="fw-bold mb-0">
          {isSP ? "Assign Managers (AM)" : "Assign Team Members"}
        </h5>
      </div>
      <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 500 }}>
        {categoryMembers.length} Available Members
      </span>
    </div>

    <TextField
      fullWidth
      size="small"
      placeholder="Search by name, role, or skillset..."
      value={memberSearch}
      onChange={(e) => onSearchChange(e.target.value)}
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

    {isSP && !domainId && (
      <Notice message="Select a department above to see managers assigned to it." />
    )}
    {isSP && domainId && domainScopedMembers.length === 0 && (
      <Notice error message="No Account Managers assigned to this department." />
    )}
    {!isSP && !category && (
      <Notice message="Select a project category above to see available team members." />
    )}
    {!isSP && category && categoryMembers.length === 0 && (
      <Notice error message={`No team members found in the "${category}" department.`} />
    )}
    {isSP && domainId && domainScopedMembers.length > 0 && category && categoryMembers.length === 0 && (
      <Notice error message={`No assigned managers match the "${category}" department.`} />
    )}

    <div className="row g-2">
      {filteredMembers.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isSelected={teamMembers.includes(member.id)}
          onToggle={onToggle}
        />
      ))}
    </div>

    {selectedMembers.length > 0 && (
      <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: "var(--bg-surface)" }}>
        <p className="mb-2" style={sectionLabelStyle}>
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
                onClick={() => onRemove(m.id)}
                className="btn btn-sm p-0 ms-1"
                style={{ color: "var(--text-faint)", fontSize: 14, lineHeight: 1 }}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>
    )}
  </SectionCard>
);

export default MemberAssignSection;
