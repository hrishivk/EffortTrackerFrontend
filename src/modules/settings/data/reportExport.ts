import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import type {
  ReportDay,
  ReportTask,
  ReportTotals,
  TeamMemberRow,
} from "../../../core/actions/reportAction";
import { fmtDayLong, fmtDuration } from "./reportMetrics";


export interface ExportMeta {
  member: string;
  project: string;
  from: Date;
  to: Date;
}

const HEAD_FONT = { bold: true, color: { argb: "FFFFFFFF" } } as const;
const HEAD_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF7C3AED" },
} as const;

const styleHeader = (sheet: ExcelJS.Worksheet) => {
  const row = sheet.getRow(1);
  row.font = HEAD_FONT;
  row.eachCell((c) => {
    c.fill = HEAD_FILL as never;
  });
};

const day = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return y ? new Date(y, m - 1, d).toLocaleDateString() : iso;
};

const when = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? day(iso) : d.toLocaleString();
};

export async function exportReportXlsx(
  meta: ExportMeta,
  totals: ReportTotals,
  daily: ReportDay[],
  members: TeamMemberRow[] = [],
  tasks: ReportTask[] = [],
  tasksTruncated = false
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const s = wb.addWorksheet("Summary");
  s.columns = [{ width: 24 }, { width: 30 }];
  s.addRow(["Task Report"]).font = { bold: true, size: 14 };
  s.addRow([]);
  for (const [k, v] of [
    ["Scope", meta.member],
    ["Project", meta.project],
    ["From", meta.from.toLocaleDateString()],
    ["To", meta.to.toLocaleDateString()],
    ["Generated", new Date().toLocaleString()],
  ]) {
    s.addRow([k, v]).getCell(1).font = { bold: true };
  }
  s.addRow([]);
  for (const [k, v] of [
    ["Tasks worked", totals.tasks_worked],
    ["Completed", totals.completed],
    ["In progress", totals.in_progress],
    ["Pending", totals.pending],
    ["Completion rate", `${totals.completion_rate}%`],
    ["Total time", fmtDuration(totals.total_seconds)],
    ["Average per task", fmtDuration(totals.avg_seconds_per_task)],
    ["Active rate", `${totals.active_rate}%`],
  ] as [string, string | number][]) {
    s.addRow([k, v]).getCell(1).font = { bold: true };
  }

  const d = wb.addWorksheet("Daily");
  d.columns = [
    { header: "Date", key: "date", width: 18 },
    { header: "Tasks Worked", key: "worked", width: 14 },
    { header: "Completed", key: "completed", width: 12 },
    { header: "Time Spent", key: "time", width: 14 },
    { header: "Productivity", key: "prod", width: 14 },
  ];
  styleHeader(d);
  for (const r of daily) {
    d.addRow({
      date: fmtDayLong(r.date),
      worked: r.tasks_worked,
      completed: r.completed,
      time: fmtDuration(r.total_seconds),
      prod: `${r.productivity}%`,
    });
  }

  if (members.length) {
    const m = wb.addWorksheet("Members");
    m.columns = [
      { header: "Member", key: "name", width: 26 },
      { header: "Tasks Worked", key: "worked", width: 14 },
      { header: "Completed", key: "completed", width: 12 },
      { header: "In Progress", key: "running", width: 13 },
      { header: "Pending", key: "pending", width: 11 },
      { header: "Completion", key: "rate", width: 13 },
      { header: "Time Spent", key: "time", width: 14 },
    ];
    styleHeader(m);
    for (const r of members) {
      m.addRow({
        name: r.user.fullName,
        worked: r.tasks_worked,
        completed: r.completed,
        running: r.in_progress,
        pending: r.pending,
        rate: `${r.completion_rate}%`,
        time: fmtDuration(r.total_seconds),
      });
    }
  }

  if (tasks.length) {
    const t = wb.addWorksheet("Tasks");
    t.columns = [
      { header: "Description", key: "description", width: 46 },
      { header: "Project", key: "project", width: 24 },
      { header: "Status", key: "status", width: 16 },
      { header: "Start Time", key: "start", width: 20 },
      { header: "End Time", key: "end", width: 20 },
      { header: "Completed Date", key: "done", width: 16 },
      { header: "Due Date", key: "due", width: 14 },
    ];
    styleHeader(t);
    for (const r of tasks) {
      t.addRow({
        description: r.description,
        project: r.project || "—",
        status: r.status || "—",
        start: r.start_time ? when(r.start_time) : day(r.start_date),
        end: when(r.end_time),
        done: day(r.completed_at),
        due: day(r.due_date),
      });
    }
    t.getColumn("description").alignment = { wrapText: true, vertical: "top" };

    if (tasksTruncated) {
      const note = t.addRow([
        `Showing the first ${tasks.length} tasks — there were more in this period than the export returns.`,
      ]);
      note.font = { italic: true, color: { argb: "FF9A3412" } };
      t.mergeCells(note.number, 1, note.number, 7);
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  const stamp = `${meta.from.getFullYear()}-${String(meta.from.getMonth() + 1).padStart(2, "0")}-${String(meta.from.getDate()).padStart(2, "0")}`;
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `task-report-${stamp}.xlsx`
  );
}
