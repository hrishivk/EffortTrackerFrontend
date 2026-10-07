import { ORBIT_MAX } from "./roomLayout";
import type { RoomLegendProps } from "../../types";

export default function RoomLegend({ byRole, total }: RoomLegendProps) {
  return (
    <aside className="rmo__legend">
      {byRole.length === 0 && (
        <p className="rmo__legend-empty">No members yet</p>
      )}
      {byRole.map(([roleName, n]) => (
        <div key={roleName} className="rmo__legend-row">
          <span className="rmo__legend-dot" />
          <span className="rmo__legend-name">{roleName}</span>
          <span className="rmo__legend-n">{n}</span>
        </div>
      ))}
      <div className="rmo__legend-row rmo__legend-row--total">
        <span className="rmo__legend-name">Total Members</span>
        <span className="rmo__legend-n">{total}</span>
      </div>
      {total > ORBIT_MAX && (
        <p className="rmo__legend-more">
          Showing {ORBIT_MAX} of {total} on the ring.
        </p>
      )}
    </aside>
  );
}
