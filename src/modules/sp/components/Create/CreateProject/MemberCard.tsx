import type { AvailableMember } from "../../../types";
import { CheckBadge, PlusMark, getInitials } from "./shared";

type Props = {
  member: AvailableMember;
  isSelected: boolean;
  onToggle: (id: string) => void;
};

const MemberCard = ({ member, isSelected, onToggle }: Props) => (
  <div className="col-md-6">
    <div
      onClick={() => !member.isOnLeave && onToggle(member.id)}
      className="d-flex align-items-center justify-content-between p-3 rounded-3"
      style={{
        border: isSelected ? "2px solid #7c3aed" : "1px solid var(--border-light)",
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
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
            {member.fullName}
          </div>
          <div className="d-flex align-items-center gap-1">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: member.isOnLeave ? "#9ca3af" : "#22c55e",
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
          <CheckBadge />
        ) : member.isOnLeave ? (
          <span style={{ color: "#9ca3af", fontSize: 18 }}>&#8856;</span>
        ) : (
          <PlusMark />
        )}
      </div>
    </div>
  </div>
);

export default MemberCard;
