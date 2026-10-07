import { pdAvatarColors } from "../constants";
import { pdGetInitials, pdFormatDate, pdGetTaskStatus, pdGetDaysLeft } from "../utils";
import type { GroupedPdTask } from "../../../types";
import type { formUserData } from "../../../../../shared/types/User";

type Props = {
  group: GroupedPdTask;
  users: formUserData[];
  onClick: () => void;
};

const GroupedTaskCard = ({ group, users, onClick }: Props) => {
  const st = pdGetTaskStatus(group.status || "");
  const daysLeft = pdGetDaysLeft(group.end_time);
  const assignees = group.assignees;
  const total = assignees.length;
  const avatarColor = (userId: string | number | null | undefined) => {
    const idx = users.findIndex((u) => String(u.id) === String(userId));
    return pdAvatarColors[Math.max(0, idx) % pdAvatarColors.length];
  };

  return (
    <div className="pd-task-card" onClick={onClick}>
      <div className="pd-task-card-top">
        <span className="pd-task-status-badge" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
        {total === 1 ? (
          <div className="pd-task-assignee-avatar"
            style={{ backgroundColor: avatarColor(assignees[0].userId) }}
            title={assignees[0].name}>
            {pdGetInitials(assignees[0].name)}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center" }}>
            {assignees.slice(0, 3).map((a, i) => (
              <div key={i} className="pd-task-assignee-avatar"
                style={{
                  backgroundColor: avatarColor(a.userId),
                  marginLeft: i > 0 ? -8 : 0,
                  zIndex: total - i,
                  border: "2px solid #fff",
                }}
                title={a.name}>
                {pdGetInitials(a.name)}
              </div>
            ))}
            {total > 3 && (
              <div className="pd-task-assignee-avatar"
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#6b7280",
                  marginLeft: -8,
                  border: "2px solid #fff",
                }}>
                +{total - 3}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="pd-task-description">{group.description}</p>
      <p className="pd-task-detail">
        {group.priority && `Priority: ${group.priority}`}
        {group.start_time && ` | Started: ${pdFormatDate(group.start_time)}`}
      </p>
      <div className="pd-task-card-footer">
        <span>{pdFormatDate(group.end_time)}</span>
        {daysLeft && st.label !== "COMPLETED" && (
          <span className="pd-task-due" style={{
            color: daysLeft === "Overdue" ? "#dc2626" : daysLeft === "Due today" ? "#d97706" : "#16a34a",
          }}>{daysLeft}</span>
        )}
      </div>
    </div>
  );
};

export default GroupedTaskCard;
