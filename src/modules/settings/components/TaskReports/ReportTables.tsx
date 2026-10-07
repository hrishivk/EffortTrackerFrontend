import { useMemo } from "react";
import { FiClock, FiUsers } from "react-icons/fi";
import type { ReportDay, TeamMemberRow } from "../../../../core/actions/reportAction";
import { fmtDayLong, fmtDuration } from "../../data/reportMetrics";
import { PRINT_ROWS, SCREEN_ROWS } from "./constants";
import { CardHead } from "./ReportCardParts";

const TableHead = ({ columns }: { columns: string[] }) => (
  <thead>
    <tr>
      {columns.map((c) => (
        <th key={c}>{c}</th>
      ))}
    </tr>
  </thead>
);

const EmptyRow = ({ colSpan, text }: { colSpan: number; text: string }) => (
  <tr>
    <td colSpan={colSpan} className="tr-table__empty">{text}</td>
  </tr>
);

const MEMBER_COLUMNS = [
  "Member",
  "Tasks Worked",
  "Completed",
  "In Progress",
  "Pending",
  "Completion",
  "Time Spent",
];

export const MembersCard = ({
  members,
  memberCount,
}: {
  members: TeamMemberRow[];
  memberCount: number;
}) => (
  <section className="tr-card tr-members">
    <CardHead
      Icon={FiUsers}
      title="By Member"
      note={`${memberCount} member${memberCount === 1 ? "" : "s"}, most time logged first.`}
    />

    <div className="tr-table-wrap">
      <table className="tr-table">
        <TableHead columns={MEMBER_COLUMNS} />
        <tbody>
          {members.length === 0 && (
            <EmptyRow colSpan={MEMBER_COLUMNS.length} text="No members in this period" />
          )}
          {members.map((m) => (
            <tr key={m.user.id}>
              <td>{m.user.fullName}</td>
              <td>{m.tasks_worked}</td>
              <td>{m.completed}</td>
              <td>{m.in_progress}</td>
              <td>{m.pending}</td>
              <td>{m.completion_rate}%</td>
              <td>{fmtDuration(m.total_seconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const ACTIVITY_COLUMNS = ["Date", "Tasks Worked", "Completed", "Time Spent", "Productivity"];

export const RecentActivityCard = ({ daily }: { daily: ReportDay[] }) => {
  const activity = useMemo(
    () => daily.filter((d) => d.tasks_worked > 0).slice().reverse().slice(0, PRINT_ROWS),
    [daily]
  );

  return (
    <section className="tr-card">
      <CardHead Icon={FiClock} title="Recent Activity" />

      <div className="tr-table-wrap">
        <table className="tr-table">
          <TableHead columns={ACTIVITY_COLUMNS} />
          <tbody>
            {activity.length === 0 && (
              <EmptyRow colSpan={ACTIVITY_COLUMNS.length} text="No activity in this period" />
            )}
            {activity.map((d, i) => (
              <tr key={d.date} className={i >= SCREEN_ROWS ? "tr-row--print" : undefined}>
                <td>{fmtDayLong(d.date)}</td>
                <td>{d.tasks_worked}</td>
                <td>{d.completed}</td>
                <td>{fmtDuration(d.total_seconds)}</td>
                <td>{d.productivity}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
