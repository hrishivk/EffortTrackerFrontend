import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { initials } from "../../data/workspaceHelpers";
import type { RoomMemberNodeProps } from "../../types";

export default function RoomMemberNode({
  node: { member, left, top, side, dot },
  canManage,
  canOpen,
  tasksPath,
  onRemove,
}: RoomMemberNodeProps) {
  const inner = (
    <>
      <span className="rmo__avatar">
        {initials(member.fullName)}
        {canManage && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Remove ${member.fullName}`}
            title={`Remove ${member.fullName} from this room`}
            className="rmo__remove"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(member.id, member.fullName);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
              onRemove(member.id, member.fullName);
            }}
          >
            <CloseIcon sx={{ fontSize: 11 }} />
          </span>
        )}
      </span>
      <span className="rmo__label">
        <span className="rmo__label-name">{member.fullName}</span>
        <span className="rmo__label-role">{member.role}</span>
      </span>
    </>
  );

  const place = { left: `${left}%`, top: `${top}%` };

  return (
    <div>
      {dot && (
        <span
          className="rmo__dot"
          style={{ left: `${dot.left}%`, top: `${dot.top}%` }}
        />
      )}
      {canOpen ? (
        <Link
          to={tasksPath}
          title={`${member.fullName} — open their tasks`}
          className={`rmo__node rmo__node--${side}`}
          style={place}
        >
          {inner}
        </Link>
      ) : (
        <div
          title={`${member.fullName} — ${member.role}`}
          className={`rmo__node rmo__node--${side} rmo__node--static`}
          style={place}
        >
          {inner}
        </div>
      )}
    </div>
  );
}
