import type { GanttChartProps, GanttProject, ProjectStatus } from "../../../types/GanttChart";
import type { ColDef } from "./ganttColumns";

export type MappedProject = GanttProject & { rawStart: Date | null };

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

function mapStatus(status: string, progress: number, endDate?: string): ProjectStatus {
  if (progress >= 100) return "COMPLETED";
  if (status?.toUpperCase() === "COMPLETED") return "COMPLETED";
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (end < startOfToday() && progress < 100) return "DELAYED";
  }
  if (status?.toUpperCase() === "ON HOLD") return "DELAYED";
  return "ON TRACK";
}

const BAR_TYPE: Record<ProjectStatus, "active" | "completed" | "delayed"> = {
  "ON TRACK": "active",
  COMPLETED: "completed",
  DELAYED: "delayed",
};

export function mapProjects(
  projects: GanttChartProps["projects"],
  cols: ColDef[],
): MappedProject[] {
  const rangeStart = cols[0].start;
  const rangeEnd = cols[cols.length - 1].end;
  const totalCols = cols.length;

  return projects.map((p) => {
    const pStart = p.start_date ? new Date(p.start_date) : null;
    const pEnd = p.end_date ? new Date(p.end_date) : null;
    const ganttStatus = mapStatus(p.status, p.progress, p.end_date);
    const base = { id: p.id, name: p.name, status: ganttStatus, rawStart: pStart };

    if ((pStart && pStart > rangeEnd) || (pEnd && pEnd < rangeStart)) {
      return { ...base, bars: [] };
    }

    let startCol = 1;
    if (pStart) {
      const idx = cols.findIndex((c) => pStart <= c.end);
      startCol = idx === -1 ? 1 : idx + 1;
    }

    let endCol = totalCols;
    if (pEnd) {
      for (let i = totalCols - 1; i >= 0; i--) {
        if (pEnd >= cols[i].start) {
          endCol = i + 1;
          break;
        }
      }
    }

    let overdueCols = 0;
    let hasFlag = false;
    if (pEnd && ganttStatus === "DELAYED") {
      const today = startOfToday();
      if (today > pEnd) {
        hasFlag = true;
        for (let i = endCol; i < totalCols; i++) {
          if (today >= cols[i].start) overdueCols++;
          else break;
        }
      }
    }

    return {
      ...base,
      bars: [
        {
          startDay: startCol,
          endDay: endCol,
          label: ganttStatus === "COMPLETED" ? "Done" : `${p.progress}%`,
          progress: p.progress,
          type: BAR_TYPE[ganttStatus],
          overdueDays: overdueCols > 0 ? overdueCols : undefined,
          hasFlag,
        },
      ],
    };
  });
}
