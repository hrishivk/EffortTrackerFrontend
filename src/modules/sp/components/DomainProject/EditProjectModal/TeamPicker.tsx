import { CircularProgress } from "@mui/material";
import { FiCheck, FiUsers } from "react-icons/fi";

import { pdGetInitials } from "../utils";
import type { formUserData } from "../../../../../shared/types/User";

interface TeamPickerProps {
  visibleUsers: formUserData[];
  memberIds: string[];
  visibleMemberCount: number;
  rosterLoading: boolean;
  rosterEmpty: boolean;
  onToggle: (id: string) => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

const TeamPicker = ({
  visibleUsers,
  memberIds,
  visibleMemberCount,
  rosterLoading,
  rosterEmpty,
  onToggle,
  onScroll,
}: TeamPickerProps) => (
  <div className="ep-team">
    <div className="ep-team-head">
      <h4>
        <FiUsers size={14} />
        Team Assigned
      </h4>
      <span className="ep-team-count">{visibleMemberCount}</span>
    </div>
    <p className="ep-team-sub">
      Tap a row to add or remove them from this project.
    </p>

    {rosterLoading && rosterEmpty ? (
      <div className="ep-team-loading">
        <CircularProgress size={22} thickness={4} sx={{ color: "#7c3aed" }} />
        <span>Loading team…</span>
      </div>
    ) : visibleUsers.length === 0 ? (
      <div className="ep-team-empty">
        No one is available to assign yet.
      </div>
    ) : (
      <div className="ep-team-list" onScroll={onScroll}>
        {visibleUsers.map((user) => {
          const uid = String(user.id);
          const assigned = memberIds.includes(uid);
          return (
            <button
              key={uid}
              type="button"
              className={`ep-member ${assigned ? "is-assigned" : ""}`}
              aria-pressed={assigned}
              onClick={() => onToggle(uid)}
            >
              <span className="ep-member-avatar">
                {pdGetInitials(user.fullName)}
              </span>
              <span className="ep-member-info">
                <span className="ep-member-name">{user.fullName}</span>
                <span className="ep-member-role">{user.role}</span>
              </span>
              <span className="ep-member-state">
                {assigned ? (
                  <>
                    <FiCheck size={11} />
                    Added
                  </>
                ) : (
                  "Add"
                )}
              </span>
            </button>
          );
        })}

        {rosterLoading && (
          <div className="ep-team-more">
            <CircularProgress
              size={14}
              thickness={5}
              sx={{ color: "#7c3aed" }}
            />
            <span>Loading more…</span>
          </div>
        )}
      </div>
    )}
  </div>
);

export default TeamPicker;
