import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Sector,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiPieChart, FiTrendingUp } from "react-icons/fi";
import type { ReportDay, ReportTotals } from "../../../../core/actions/reportAction";
import { fmtDay } from "../../data/reportMetrics";
import { AXIS, CHART_MARGIN, TOOLTIP_STYLE } from "./constants";
import { CardHead } from "./ReportCardParts";

const GainDot = (props: {
  cx?: number;
  cy?: number;
  payload?: { gained?: boolean };
}) => {
  const { cx, cy, payload } = props;
  if (!payload?.gained || cx === undefined || cy === undefined) {
    return <g />;
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--chart-trend)"
      stroke="var(--bg-card)"
      strokeWidth={2}
    />
  );
};

const RaisedSlice = (props: object) => {
  const p = props as { innerRadius?: number; outerRadius?: number };
  return (
    <Sector
      {...(props as Record<string, unknown>)}
      innerRadius={(p.innerRadius ?? 0) - 2}
      outerRadius={(p.outerRadius ?? 0) + 6}
    />
  );
};

export const CompletedOverTimeCard = ({ daily }: { daily: ReportDay[] }) => {
  const cumulative = useMemo(() => {
    let run = 0;
    return daily.map((d) => {
      run += d.completed;
      return { label: fmtDay(d.date), Completed: run, gained: d.completed > 0 };
    });
  }, [daily]);

  return (
    <section className="tr-card">
      <CardHead
        Icon={FiTrendingUp}
        title="Completed Over Time"
        note={
          <>
            Running total across the window — a flat stretch is a stall.
            Each bubble is a day something was completed.
          </>
        }
      />

      <ResponsiveContainer width="100%" height={196}>
        <AreaChart data={cumulative} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="trCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-trend)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-trend)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border-light)" />
          <XAxis {...AXIS} dataKey="label" interval="preserveStartEnd" minTickGap={18} />
          <YAxis {...AXIS} width={44} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "var(--border-light)", strokeWidth: 1 }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Area
            type="monotone"
            dataKey="Completed"
            stroke="var(--chart-trend)"
            strokeWidth={2}
            fill="url(#trCumulative)"
            dot={<GainDot />}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--bg-card)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
};

export const StatusBreakdownCard = ({ totals }: { totals: ReportTotals }) => {
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const statusSplit = useMemo(() => {
    const whole = Math.max(1, totals.tasks_worked);
    return [
      { name: "Pending", value: totals.pending, token: "var(--chart-pending)" },
      { name: "In Progress", value: totals.in_progress, token: "var(--chart-progress)" },
      { name: "Completed", value: totals.completed, token: "var(--chart-done)" },
    ]
      .filter((slice) => slice.value > 0)
      .map((slice) => ({ ...slice, pct: Math.round((slice.value / whole) * 100) }));
  }, [totals]);

  const active = activeSlice === null ? null : statusSplit[activeSlice] ?? null;

  return (
    <section className="tr-card">
      <CardHead
        Icon={FiPieChart}
        title="Status Breakdown"
        note={`Share of the ${totals.tasks_worked} tasks worked.`}
      />

      {statusSplit.length === 0 ? (
        <p className="tr-empty">No tasks in this period</p>
      ) : (
        <div className="tr-split">
          <div className="tr-split__chart" onMouseLeave={() => setActiveSlice(null)}>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={statusSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={80}
                  cornerRadius={4}
                  paddingAngle={3}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                  isAnimationActive={false}
                  activeShape={RaisedSlice}
                  onMouseEnter={(_, i) => setActiveSlice(i)}
                >
                  {statusSplit.map((slice) => (
                    <Cell key={slice.name} fill={slice.token} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="tr-split__centre">
              {active ? (
                <>
                  <b style={{ color: active.token }}>{active.pct}%</b>
                  <span>
                    {active.value} {active.name.toLowerCase()}
                  </span>
                </>
              ) : (
                <>
                  <b>{totals.tasks_worked}</b>
                  <span>tasks</span>
                </>
              )}
            </div>
          </div>

          <ul className="tr-split__keys">
            {statusSplit.map((slice, i) => (
              <li
                key={slice.name}
                className={activeSlice === i ? "is-on" : undefined}
                onMouseEnter={() => setActiveSlice(i)}
                onMouseLeave={() => setActiveSlice(null)}
              >
                <span className="tr-split__row">
                  <span className="tr-split__dot" style={{ backgroundColor: slice.token }} />
                  <span className="tr-split__name">{slice.name}</span>
                  <b className="tr-split__n">{slice.value}</b>
                  <span className="tr-split__pct">{slice.pct}%</span>
                </span>
                <span className="tr-split__bar">
                  <span style={{ width: slice.pct + "%", backgroundColor: slice.token }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
