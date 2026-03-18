import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface RawTask {
  id?: number | string;
  description: string;
  status?: string;
  priority?: string;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string;
  assigned_to?: string | number | null;
  project?: string | { id: string; name: string };
  progress?: number;
  dailyLog?: {
    assigned_to?: string;
    assignedUser?: { id: string; fullName: string; email: string };
    creator?: { id: string; fullName: string; email: string };
  };
}

interface ExportTaskData {
  tasks: RawTask[];
  projectName: string;
}

const BAR_COLOR = "FF7C3AED";
const STATUS_COLORS: Record<string, string> = {
  completed: "FF16A34A",
  done: "FF16A34A",
  in_progress: "FF2563EB",
  pending: "FF9333EA",
  yet_to_start: "FF9333EA",
  review: "FFD97706",
  blocked: "FFDC2626",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayCol {
  date: Date;
  day: number;
  dayName: string;
  year: number;
  month: number;
}

/** Strip time, return local midnight */
function toLocalDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function exportTaskReport({ tasks, projectName }: ExportTaskData) {
  try {
    if (tasks.length === 0) {
      alert("No tasks to export.");
      return;
    }

    // Resolve start/end for each task, using created_at as fallback
    const resolved = tasks.map((t) => {
      const start = t.start_time || t.created_at || null;
      const end = t.end_time || t.start_time || t.created_at || null;
      return { ...t, _start: start, _end: end };
    });

    // Tasks with dates for Gantt bars
    const withDates = resolved.filter((t) => t._start && t._end);

    if (withDates.length === 0) {
      alert("No tasks with dates to export.");
      return;
    }

    // Sort by start date
    withDates.sort((a, b) => new Date(a._start!).getTime() - new Date(b._start!).getTime());

    let earliest = toLocalDate(new Date(withDates[0]._start!));
    let latest = toLocalDate(new Date(withDates[0]._end!));
    for (const t of withDates) {
      const s = toLocalDate(new Date(t._start!));
      const e = toLocalDate(new Date(t._end!));
      if (s < earliest) earliest = s;
      if (e > latest) latest = e;
    }

    const rangeStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const rangeEnd = new Date(latest.getFullYear(), latest.getMonth() + 1, 0);

    const dayCols: DayCol[] = [];
    const cur = new Date(rangeStart);
    while (cur <= rangeEnd) {
      dayCols.push({
        date: new Date(cur),
        day: cur.getDate(),
        dayName: DAY_NAMES[cur.getDay()],
        year: cur.getFullYear(),
        month: cur.getMonth(),
      });
      cur.setDate(cur.getDate() + 1);
    }

    const FIXED_COLS = 3; // Task, Assignee, Status
    const HEADER_ROWS = 3;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Task Gantt Chart");

    ws.views = [{ state: "frozen", xSplit: FIXED_COLS, ySplit: HEADER_ROWS }];

    // ── Row 1: Month headers ──
    const row1 = ws.getRow(1);
    row1.height = 24;
    for (let c = 1; c <= FIXED_COLS; c++) {
      row1.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B21B6" } };
    }

    const monthGroups: { label: string; startCol: number; endCol: number }[] = [];
    for (let i = 0; i < dayCols.length; i++) {
      const dc = dayCols[i];
      const label = `${MONTH_NAMES[dc.month]} ${dc.year}`;
      const colNum = FIXED_COLS + 1 + i;
      if (monthGroups.length === 0 || monthGroups[monthGroups.length - 1].label !== label) {
        monthGroups.push({ label, startCol: colNum, endCol: colNum });
      } else {
        monthGroups[monthGroups.length - 1].endCol = colNum;
      }
    }
    for (const mg of monthGroups) {
      for (let c = mg.startCol; c <= mg.endCol; c++) {
        const fc = row1.getCell(c);
        fc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B21B6" } };
        fc.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
        fc.alignment = { horizontal: "center", vertical: "middle" };
      }
      if (mg.startCol !== mg.endCol) {
        ws.mergeCells(1, mg.startCol, 1, mg.endCol);
      }
      row1.getCell(mg.startCol).value = mg.label;
    }

    // ── Row 2: Column headers + Day numbers ──
    const row2 = ws.getRow(2);
    row2.height = 20;
    const headerLabels = ["Task", "Assignee", "Status"];
    for (let c = 0; c < FIXED_COLS; c++) {
      const cell = row2.getCell(c + 1);
      cell.value = headerLabels[c];
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAR_COLOR } };
      cell.border = { right: { style: "thin", color: { argb: "FFDDDDDD" } } };
    }

    for (let i = 0; i < dayCols.length; i++) {
      const cell = row2.getCell(FIXED_COLS + 1 + i);
      cell.value = dayCols[i].day;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 8 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAR_COLOR } };
    }

    // ── Row 3: Day names ──
    const row3 = ws.getRow(3);
    row3.height = 18;
    for (let c = 1; c <= FIXED_COLS; c++) {
      row3.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9F7AEA" } };
      row3.getCell(c).border = { right: { style: "thin", color: { argb: "FFDDDDDD" } } };
    }

    for (let i = 0; i < dayCols.length; i++) {
      const dc = dayCols[i];
      const cell = row3.getCell(FIXED_COLS + 1 + i);
      cell.value = dc.dayName;
      cell.font = { color: { argb: "FFFFFFFF" }, size: 7 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      const isSunSat = dc.date.getDay() === 0 || dc.date.getDay() === 6;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isSunSat ? "FF6D28D9" : "FF9F7AEA" },
      };
    }

    // ── Column widths ──
    ws.getColumn(1).width = 30; // Task
    ws.getColumn(2).width = 18; // Assignee
    ws.getColumn(3).width = 14; // Status
    for (let i = 0; i < dayCols.length; i++) {
      ws.getColumn(FIXED_COLS + 1 + i).width = 3.5;
    }

    // ── Data rows ──
    let currentRow = HEADER_ROWS + 1;
    const totalCols = FIXED_COLS + dayCols.length;

    for (let idx = 0; idx < withDates.length; idx++) {
      const t = withDates[idx];

      // Spacer row
      const spacer = ws.getRow(currentRow);
      spacer.height = 8;
      for (let c = 1; c <= totalCols; c++) {
        spacer.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      }
      currentRow++;

      // Task row
      const row = ws.getRow(currentRow);
      row.height = 28;

      // Task name
      const nameCell = row.getCell(1);
      nameCell.value = `${idx + 1}. ${t.description}`;
      nameCell.font = { size: 10, bold: true, color: { argb: "FF333333" } };
      nameCell.alignment = { vertical: "middle" };
      nameCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF5FF" } };
      nameCell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };

      // Assignee
      const assigneeCell = row.getCell(2);
      const assigneeName = t.dailyLog?.assignedUser?.fullName || "Unassigned";
      assigneeCell.value = assigneeName;
      assigneeCell.font = { size: 9, color: { argb: "FF555555" } };
      assigneeCell.alignment = { horizontal: "center", vertical: "middle" };
      assigneeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF5FF" } };
      assigneeCell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };

      // Status
      const statusCell = row.getCell(3);
      const statusKey = (t.status || "").toLowerCase().replace(/[\s_]+/g, "_");
      const statusLabel = statusKey === "in_progress" ? "In Progress"
        : statusKey === "completed" || statusKey === "done" ? "Completed"
        : statusKey === "pending" || statusKey === "yet_to_start" ? "Yet to Start"
        : statusKey === "review" ? "Review"
        : statusKey === "blocked" ? "Blocked"
        : (t.status || "Unknown");
      statusCell.value = statusLabel;
      statusCell.font = { size: 9, bold: true, color: { argb: STATUS_COLORS[statusKey] || "FF6B7280" } };
      statusCell.alignment = { horizontal: "center", vertical: "middle" };
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF5FF" } };
      statusCell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };

      // Gantt bar — use local dates for consistent comparison
      const tStart = toLocalDate(new Date(t._start!));
      const tEnd = toLocalDate(new Date(t._end!));

      const barColor = STATUS_COLORS[statusKey] || BAR_COLOR;

      for (let di = 0; di < dayCols.length; di++) {
        const dc = dayCols[di];
        const cell = row.getCell(FIXED_COLS + 1 + di);
        cell.border = { bottom: { style: "thin", color: { argb: "FFE5E5E5" } } };

        const inRange = dc.date >= tStart && dc.date <= tEnd;

        if (inRange) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: barColor } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
        }
      }

      currentRow++;
    }

    // ── Download ──
    const buffer = await wb.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().split("T")[0];
    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_");
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Task_Report_${safeName}_${dateStr}.xlsx`,
    );
  } catch (err) {
    console.error("Export failed:", err);
    alert("Export failed. Check console for details.");
  }
}
