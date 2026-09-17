import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import type {
  ReportDay,
  ReportTask,
  ReportTotals,
  TeamMemberRow,
} from "../../../core/actions/reportAction";
import { fmtDayLong, fmtDuration } from "./reportMetrics";

/**
 * The report as an .xlsx, built in the browser.
 *
 * The API has no export route yet (§5 is not built), and every figure is
 * already on the page, so the workbook is written here. If a server-side
 * `?format=xlsx` lands later this file goes and the button points at the blob
 * instead — the sheets below are the shape to match.
 */

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

/** `yyyy-mm-dd` as a local date, or an em dash where the task has no such date. */
const day = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return y ? new Date(y, m - 1, d).toLocaleDateString() : iso;
};

/** A timestamp as date and time, the way the List View shows it. */
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

  // ── Summary ──
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

  // ── Daily ──
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

  // ── Members — only on a team report. ──
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

  // ── Tasks — the rows behind the figures, when the API sent them. ──
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
        // `start_time` when the API sends it, falling back to the planned
        // date — which is NULL on every row today, so this reads as a dash
        // rather than a wrong value.
        start: r.start_time ? when(r.start_time) : day(r.start_date),
        end: when(r.end_time),
        done: day(r.completed_at),
        due: day(r.due_date),
      });
    }
    // The description column carries sentences; without this every row is one
    // line and the text runs under the column beside it.
    t.getColumn("description").alignment = { wrapText: true, vertical: "top" };

    /*
     * Say so on the sheet when the API capped the rows.
     *
     * A spreadsheet gives no clue that it stops short, and someone totalling a
     * column has no way to tell a complete export from a partial one. Better a
     * line they can see than a number they cannot trust.
     */
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
