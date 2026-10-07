import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiCheckSquare, FiClock } from "react-icons/fi";
import type { ReportDay, ReportTotals } from "../../../../core/actions/reportAction";
import { fmtDay, fmtDuration } from "../../data/reportMetrics";
import { AXIS, CHART_MARGIN, TOOLTIP_STYLE } from "./constants";
import { CardHead, Tiles } from "./ReportCardParts";

type Props = {
  totals: ReportTotals;
  daily: ReportDay[];
  delta: number | null;
};

const ACTIVE_DOT = { r: 4, strokeWidth: 2, stroke: "var(--bg-card)" };

export const TaskProductivityCard = ({ totals, daily, delta }: Props) => {
  const taskChart = useMemo(
    () =>
      daily.map((d) => ({
        label: fmtDay(d.date),
        Worked: d.tasks_worked,
        Completed: d.completed,
      })),
    [daily]
  );

  return (
    <section className="tr-card">
      <CardHead
        Icon={FiCheckSquare}
        title="Task Productivity Report"
        note="Track task completion and team productivity."
        delta={delta}
      />

      <Tiles
        items={[
          [totals.tasks_worked, "Tasks Worked"],
          [totals.completed, "Completed"],
          [totals.in_progress, "In Progress"],
          [totals.pending, "Pending"],
        ]}
      />

      <div className="tr-rate">
        <div className="tr-rate__row">
          <span>Completion Rate</span>
          <b>{totals.completion_rate}%</b>
        </div>
        <div className="tr-rate__track">
          <div className="tr-rate__fill" style={{ width: `${totals.completion_rate}%` }} />
        </div>
      </div>

      <div className="tr-chart">
        <div className="tr-chart__head">
          <p className="tr-chart__title">Tasks by Day</p>
          <div className="tr-legend">
            <span className="tr-legend__item">
              <span className="tr-legend__key tr-legend__key--worked" />
              Worked
            </span>
            <span className="tr-legend__item">
              <span className="tr-legend__key tr-legend__key--done" />
              Completed
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={168}>
          <LineChart data={taskChart} margin={CHART_MARGIN}>
            <CartesianGrid vertical={false} stroke="var(--border-light)" />
            <XAxis {...AXIS} dataKey="label" interval="preserveStartEnd" minTickGap={18} />
            <YAxis {...AXIS} width={44} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: "var(--border-light)", strokeWidth: 1 }}
              contentStyle={TOOLTIP_STYLE}
            />
            <Line
              type="monotone"
              dataKey="Worked"
              stroke="var(--chart-worked)"
              strokeWidth={2}
              dot={false}
              activeDot={ACTIVE_DOT}
            />
            <Line
              type="monotone"
              dataKey="Completed"
              stroke="var(--chart-completed)"
              strokeWidth={2}
              dot={false}
              activeDot={ACTIVE_DOT}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export const TimeEffortCard = ({ totals, daily, delta }: Props) => {
  const chart = useMemo(
    () =>
      daily.map((d) => ({
        label: fmtDay(d.date),
        hours: +(d.total_seconds / 3600).toFixed(2),
      })),
    [daily]
  );

  return (
    <section className="tr-card">
      <CardHead
        Icon={FiClock}
        title="Time & Effort Report"
        note="Analyze time spent and effort distribution."
        delta={delta}
      />

      <Tiles
        items={[
          [fmtDuration(totals.total_seconds), "Total Time"],
          [fmtDuration(totals.avg_seconds_per_task), "Avg / Task"],
          [`${totals.active_rate}%`, "Active Time"],
          [fmtDuration(totals.today_seconds), "Today"],
        ]}
      />

      <div className="tr-chart">
        <div className="tr-chart__head">
          <p className="tr-chart__title">Time Spent by Day</p>
        </div>
        <ResponsiveContainer width="100%" height={168}>
          <BarChart data={chart} margin={CHART_MARGIN}>
            <CartesianGrid vertical={false} stroke="var(--border-light)" />
            <XAxis {...AXIS} dataKey="label" interval="preserveStartEnd" minTickGap={18} />
            <YAxis {...AXIS} width={44} tickFormatter={(v: number) => `${v}h`} />
            <Tooltip
              cursor={{ fill: "rgba(124,58,237,0.07)" }}
              formatter={(v: number) => [`${v}h`, "Time"]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Bar dataKey="hours" fill="var(--chart-worked)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
