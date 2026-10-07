import type { formUserData } from "../../../../../shared/types/User";
import { pdGetInitials } from "../utils";

type Props = {
  members: formUserData[];
  showOverflow?: boolean;
};

const StakeholderStack = ({ members, showOverflow = false }: Props) => (
  <div className="pd-stakeholder-stack">
    {members.slice(0, 3).map((m, i) => (
      <div key={m.id || i} className="pd-stakeholder-avatar"
        style={{ backgroundColor: "#7c3aed" }} title={m.fullName}>
        {pdGetInitials(m.fullName || "U")}
      </div>
    ))}
    {showOverflow && members.length > 3 && <div className="pd-stakeholder-overflow">+{members.length - 3}</div>}
    {showOverflow && members.length === 0 && <span style={{ fontSize: 12, color: "#9ca3af" }}>No members</span>}
  </div>
);

export default StakeholderStack;
