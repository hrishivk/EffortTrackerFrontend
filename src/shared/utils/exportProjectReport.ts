import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface RawProject {
  id: number | string;
  name: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  dueDate?: string;
  status?: string;
  progress?: number;
}

interface ExportData {
  rawProjects: RawProject[];
}

const BAR_COLOR = "FF7C3AED";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayCol {
  date: Date;
  day: number;
  dayName: string;
  year: number;
  month: number;
}

export async function exportProjectReport({ rawProjects }: ExportData) {
  try {
    const getStart = (p: RawProject) => p.start_date || p.startDate;
    const getEnd = (p: RawProject) => p.end_date || p.dueDate;

    const projects = rawProjects
      .filter((p) => getStart(p) && getEnd(p))
      .sort((a, b) => new Date(getStart(a)!).getTime() - new Date(getStart(b)!).getTime());

    if (projects.length === 0) {
      alert("No projects with start/end dates to export.");
      return;
    }

    let earliest = new Date(getStart(projects[0])!);
    let latest = new Date(getEnd(projects[0])!);
    for (const p of projects) {
      const s = new Date(getStart(p)!);
      const e = new Date(getEnd(p)!);
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

    const FIXED_COLS = 1; // Activity only
    const HEADER_ROWS = 3;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Gantt Chart");

    ws.views = [{ state: "frozen", xSplit: FIXED_COLS, ySplit: HEADER_ROWS }];

    // ── Row 1: Month headers ──
    const row1 = ws.getRow(1);
    row1.height = 24;
    row1.getCell(1).value = "";
    row1.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B21B6" } };

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

    // ── Row 2: Day numbers ──
    const row2 = ws.getRow(2);
    row2.height = 20;
    row2.getCell(1).value = "Activity";
    row2.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    row2.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    row2.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAR_COLOR } };
    row2.getCell(1).border = { right: { style: "thin", color: { argb: "FFDDDDDD" } } };

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
    row3.getCell(1).value = "";
    row3.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9F7AEA" } };
    row3.getCell(1).border = { right: { style: "thin", color: { argb: "FFDDDDDD" } } };

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
    ws.getColumn(1).width = 30;
    for (let i = 0; i < dayCols.length; i++) {
      ws.getColumn(FIXED_COLS + 1 + i).width = 3.5;
    }

    // ── Data rows ──
    let currentRow = HEADER_ROWS + 1;
    const totalCols = FIXED_COLS + dayCols.length;

    for (let idx = 0; idx < projects.length; idx++) {
      const p = projects[idx];

      // Spacer row before every project (gap from headers / between projects)
      const spacer = ws.getRow(currentRow);
      spacer.height = 8;
      for (let c = 1; c <= totalCols; c++) {
        spacer.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      }
      currentRow++;

      // Project row
      const row = ws.getRow(currentRow);
      row.height = 28;

      // Activity name
      const nameCell = row.getCell(1);
      nameCell.value = `${idx + 1}. ${p.name}`;
      nameCell.font = { size: 10, bold: true, color: { argb: "FF333333" } };
      nameCell.alignment = { vertical: "middle" };
      nameCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF5FF" } };
      nameCell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };

      // Gantt bar with progress % in the middle
      const pStart = new Date(getStart(p)!);
      pStart.setHours(0, 0, 0, 0);
      const pEnd = new Date(getEnd(p)!);
      pEnd.setHours(23, 59, 59, 999);

      // Find which day columns fall in range
      const barStartIdx: number[] = [];
      for (let di = 0; di < dayCols.length; di++) {
        if (dayCols[di].date >= pStart && dayCols[di].date <= pEnd) {
          barStartIdx.push(di);
        }
      }
      const midIdx = barStartIdx.length > 0 ? barStartIdx[Math.floor(barStartIdx.length / 2)] : -1;

      for (let di = 0; di < dayCols.length; di++) {
        const dc = dayCols[di];
        const cell = row.getCell(FIXED_COLS + 1 + di);
        cell.border = { bottom: { style: "thin", color: { argb: "FFE5E5E5" } } };

        const inRange = dc.date >= pStart && dc.date <= pEnd;

        if (inRange) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAR_COLOR } };
          // Show progress % at the middle of the bar
          if (di === midIdx) {
            cell.value = `${p.progress ?? 0}%`;
            cell.font = { size: 7, bold: true, color: { argb: "FFFFFFFF" } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
        }
      }

      currentRow++;
    }

    // ── Download ──
    const buffer = await wb.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().split("T")[0];
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Project_Gantt_Report_${dateStr}.xlsx`,
    );
  } catch (err) {
    console.error("Export failed:", err);
 
  }
}
