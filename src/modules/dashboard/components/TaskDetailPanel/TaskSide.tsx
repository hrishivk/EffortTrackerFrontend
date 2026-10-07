import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";

import { STATUS_ACCENT } from "../boardConstants";
import { STATUS_LABEL, initialsOf } from "./tdpUtils";
import type { Tally, TeamMember } from "./useTaskSummary";

function ProgressTrack({ units }: { units: { status: string; label: string }[] }) {
  return (
    <div
      className="tdp__track"
      role="img"
      aria-label={units.map((u) => `${u.label}: ${u.status}`).join(", ")}
    >
      {units.map((u, i) => (
        <span
          key={i}
          className="tdp__track-seg"
          title={`${u.label} — ${STATUS_LABEL[u.status] ?? u.status}`}
          style={{ backgroundColor: STATUS_ACCENT[u.status] ?? "var(--bg-hover)" }}
        />
      ))}
    </div>
  );
}

interface TaskSideProps {
  team: TeamMember[];
  tally: Tally;
  units: { status: string; label: string }[];
  total: number;
  percent: number;
}

export default function TaskSide({ team, tally, units, total, percent }: TaskSideProps) {
  const legend = [
    { label: "Completed", n: tally.completed, color: STATUS_ACCENT.completed },
    { label: "In Progress", n: tally.in_progress, color: STATUS_ACCENT.in_progress },
    { label: "Pending", n: tally.pending, color: STATUS_ACCENT.yet_to_start },
  ];

  return (
    <aside className="tdp__side">
      <div className="tdp__panel">
        <div className="tdp__panel-head">
          <GroupsOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
          <h4 className="tdp__panel-title">On this task ({team.length})</h4>
        </div>
        {team.length === 0 ? (
          <p className="tdp__note">Nobody is assigned yet.</p>
        ) : (
          <ul className="tdp__team">
            {team.map((m) => (
              <li key={m.id} className="tdp__team-row">
                <span className="tdp__who-avatar">{initialsOf(m.name)}</span>
                <span className="tdp__team-name" title={m.name}>
                  {m.name}
                  {m.owner && <span className="tdp__team-owner">owner</span>}
                </span>
                {m.total > 0 && (
                  <span
                    className="tdp__team-count"
                    title={`${m.done} of ${m.total} of their subtasks done`}
                  >
                    {m.done}/{m.total}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tdp__panel">
        <div className="tdp__panel-head">
          <BarChartRoundedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
          <h4 className="tdp__panel-title">Progress</h4>
        </div>
        <div className="tdp__progress">
          <div className="tdp__progress-top">
            <span className="tdp__progress-count">
              {tally.completed} of {total} done
            </span>
            <strong className="tdp__progress-pct">{percent}%</strong>
          </div>

          <ProgressTrack units={units} />

          <ul className="tdp__legend">
            {legend.map((l) => (
              <li key={l.label}>
                <span className="tdp__legend-dot" style={{ backgroundColor: l.color }} />
                <span className="tdp__legend-name">{l.label}</span>
                <span className="tdp__legend-n">{l.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
