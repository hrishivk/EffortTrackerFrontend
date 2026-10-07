import { useEffect, useState } from "react";
import { isTaskRunning, trackedSeconds } from "../../../shared/utils/taskTime";


const splitDuration = (totalSeconds: number) => ({
  days: Math.floor(totalSeconds / 86400),
  hours: Math.floor((totalSeconds % 86400) / 3600),
  minutes: Math.floor((totalSeconds % 3600) / 60),
  seconds: totalSeconds % 60,
});

const formatDuration = (totalSeconds: number, withSeconds: boolean) => {
  const { days, hours, minutes, seconds } = splitDuration(Math.max(0, totalSeconds));
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (withSeconds || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
};

const badgeStyle = (color: string, bg: string, dense: boolean) => ({
  fontSize: dense ? 10 : 12,
  fontWeight: 600,
  color,
  backgroundColor: bg,
  padding: dense ? "2px 6px" : "3px 8px",
  borderRadius: 6,
  whiteSpace: "nowrap" as const,
  display: "inline-block",
});

const emDash = (dense: boolean) => (
  <span style={{ fontSize: dense ? 10 : 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>
    --
  </span>
);

interface TaskTimerProps {
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  totalSeconds?: number;
  dense?: boolean;
}

export default function TaskTimer({
  status,
  startTime,
  endTime,
  totalSeconds = 0,
  dense = false,
}: TaskTimerProps) {
  const task = {
    status,
    start_time: startTime,
    end_time: endTime,
    total_seconds: totalSeconds,
  };
  const running = isTaskRunning(task);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const seconds = trackedSeconds(task, now);

  if (seconds <= 0) return running ? <span /> : emDash(dense);

  return running ? (
    <span style={badgeStyle("#2563eb", "#dbeafe", dense)}>
      {formatDuration(seconds, true)} &#9201;
    </span>
  ) : (
    <span style={badgeStyle("#7c3aed", "#f5f3ff", dense)}>
      {formatDuration(seconds, false)}
    </span>
  );
}
