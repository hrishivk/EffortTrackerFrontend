import ExcelJS from "exceljs";
     import JSZip from "jszip";
import { saveAs } from "file-saver";

import type { BulkTaskItem } from "../../../../user/types";
import type { ProjectOption } from "./utils";

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const MAX_TEMPLATE_ROWS = 500;
const DATE_FORMAT = "dd-mmm-yyyy";
const DATE_LIST_DAYS_BACK = 30;
const DATE_LIST_DAYS_AHEAD = 365;

type ColumnKey = "taskName" | "assignee" | "project" | "priority" | "startDate" | "dueDate";

// Order here is the template's column order; parsing matches by header text,
// so a sheet with reordered columns still imports.
const COLUMNS: { key: ColumnKey; header: string; width: number; note: string }[] = [
  { key: "taskName", header: "Task Name", width: 40, note: "Required." },
  { key: "assignee", header: "Assigned To", width: 22, note: "Filled automatically. Every task in this file goes to this person." },
  { key: "project", header: "Project", width: 26, note: "Required. Must match a project name (see Lists sheet)." },
  { key: "priority", header: "Priority", width: 11, note: "LOW, MEDIUM or HIGH. Blank = HIGH." },
  { key: "startDate", header: "Start Date", width: 14, note: "Optional. Pick from the dropdown or type a date (e.g. 07-Oct-2026)." },
  { key: "dueDate", header: "Due Date", width: 14, note: "Optional. Pick from the dropdown or type a date. Must be on/after Start Date." },
];

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");
const HEADER_LOOKUP: Record<string, ColumnKey> = Object.fromEntries(
  COLUMNS.map((c) => [normalizeHeader(c.header), c.key])
);
// Accept a few obvious aliases people type by hand.
Object.assign(HEADER_LOOKUP, {
  task: "taskName",
  description: "taskName",
  assignee: "assignee",
  deadline: "dueDate",
});

export type ImportRow = {
  row: number;
  taskName: string;
  /** Name in the file's "Assigned To" column; informational only. */
  fileAssignee: string;
  projectName: string;
  priority: string;
  startDate: string;
  dueDate: string;
  projectId?: string;
  errors: string[];
};

/* ------------------------------------------------------------------ */
/* Template                                                            */
/* ------------------------------------------------------------------ */

export async function downloadTaskTemplate(projects: ProjectOption[], assigneeName?: string) {
  const wb = new ExcelJS.Workbook();
  // So the "Assigned To" formulas show the name as soon as the file opens.
  wb.calcProperties.fullCalcOnLoad = true;
  const ws = wb.addWorksheet("Tasks", { views: [{ state: "frozen", ySplit: 1 }] });
  // Examples live on their own sheet so they never get imported by accident.
  const example = wb.addWorksheet("Example");
  const lists = wb.addWorksheet("Lists");

  for (const sheet of [ws, example]) {
    sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
    header.height = 20;
    COLUMNS.forEach((c, i) => {
      header.getCell(i + 1).note = c.note;
    });
  }

  const name = assigneeName?.trim() || "";
  const today = new Date();
  const utcDay = (offset: number) =>
    new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + offset));

  const sampleProject = projects[0]?.name || "Project Name";
  example.addRow({ taskName: "Build login API", assignee: name, project: sampleProject, priority: "HIGH", startDate: utcDay(0), dueDate: utcDay(7) });
  example.addRow({ taskName: "Write unit tests", assignee: name, project: sampleProject, priority: "MEDIUM", dueDate: utcDay(5) });
  example.addRow({ taskName: "Standalone task (blank priority = HIGH)", assignee: name, project: sampleProject });
  example.getColumn("startDate").numFmt = DATE_FORMAT;
  example.getColumn("dueDate").numFmt = DATE_FORMAT;

  // Lists sheet feeds the dropdowns and doubles as a reference for valid values.
  lists.columns = [
    { header: "Projects", key: "project", width: 30 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Dates", key: "date", width: 14 },
  ];
  lists.getRow(1).font = { bold: true };
  lists.getColumn("date").numFmt = DATE_FORMAT;
  const dateCount = DATE_LIST_DAYS_BACK + DATE_LIST_DAYS_AHEAD + 1;
  const rowCount = Math.max(projects.length, PRIORITIES.length, dateCount);
  for (let i = 0; i < rowCount; i++) {
    lists.addRow({
      project: projects[i]?.name ?? "",
      priority: PRIORITIES[i] ?? "",
      date: i < dateCount ? utcDay(i - DATE_LIST_DAYS_BACK) : null,
    });
  }

  const colLetter = (key: ColumnKey) =>
    String.fromCharCode(65 + COLUMNS.findIndex((c) => c.key === key));
  const listRange = (col: string, count: number) => `Lists!$${col}$2:$${col}$${count + 1}`;
  const taskCol = colLetter("taskName");
  const escapedName = name.replace(/"/g, '""');

  ws.getColumn("startDate").numFmt = DATE_FORMAT;
  ws.getColumn("dueDate").numFmt = DATE_FORMAT;
  ws.getColumn("assignee").font = { color: { argb: "FF6B7280" } };

  for (let r = 2; r <= MAX_TEMPLATE_ROWS + 1; r++) {
    // Shows the assignee's name as soon as a task name is typed in the row.
    ws.getCell(`${colLetter("assignee")}${r}`).value = {
      formula: `IF(${taskCol}${r}="","","${escapedName}")`,
      result: "",
    };
    ws.getCell(`${colLetter("priority")}${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [listRange("B", PRIORITIES.length)],
    };
    if (projects.length) {
      ws.getCell(`${colLetter("project")}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        formulae: [listRange("A", projects.length)],
      };
    }
    for (const key of ["startDate", "dueDate"] as const) {
      // No error message, so a date outside the dropdown can still be typed.
      ws.getCell(`${colLetter(key)}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: false,
        formulae: [listRange("C", dateCount)],
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const prefix = name ? `${name.replace(/[^\w-]+/g, "-")}-` : "";
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${prefix}task-import-template.xlsx`
  );
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

const isValidYmd = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Returns YYYY-MM-DD, "" for blank, or null when the value isn't a date. */
const parseDate = (value: ExcelJS.CellValue): string | null => {
  if (value === null || value === undefined || value === "") return "";
  // ExcelJS reads real date cells as UTC-midnight Dates.
  if (value instanceof Date) {
    return toIso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === "number") {
    const dt = new Date(Math.round((value - 25569) * 86400000));
    return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  const text = cellText(value);
  if (!text) return "";
  let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return isValidYmd(y, mo, d) ? toIso(y, mo, d) : null;
  }
  m = text.match(/^(\d{1,2})[-\s/.]([A-Za-z]{3})[A-Za-z]*[-\s/.,]+(\d{4})$/);
  if (m) {
    // DD-MMM-YYYY, the format the template's date dropdown uses
    const mo = MONTHS.indexOf(m[2].toLowerCase()) + 1;
    const [d, y] = [Number(m[1]), Number(m[3])];
    return mo && isValidYmd(y, mo, d) ? toIso(y, mo, d) : null;
  }
  m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    // DD-MM-YYYY (day first, as used in India)
    const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return isValidYmd(y, mo, d) ? toIso(y, mo, d) : null;
  }
  return null;
};

const cellText = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((t) => t.text).join("").trim();
    if ("text" in value) return cellText(value.text as ExcelJS.CellValue);
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    return "";
  }
  return String(value).trim();
};

/**
 * Drops cell notes/comments from an .xlsx before ExcelJS reads it. Files re-saved by
 * other tools (Google Sheets, scripts, etc.) store them at paths ExcelJS can't
 * resolve, which crashes it with "Cannot read properties of undefined (reading
 * 'comments')". Notes aren't needed to read tasks, so it's safe to remove them.
 */
async function stripComments(data: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(data);
  const relFiles = zip.file(/^xl\/worksheets\/_rels\/[^/]+\.rels$/);
  let changed = false;

  for (const rel of relFiles) {
    const xml = await rel.async("string");
    const cleaned = xml.replace(
      /<Relationship\b[^>]*Type="[^"]*\/(?:comments|vmlDrawing)"[^>]*\/>/g,
      ""
    );
    if (cleaned === xml) continue;
    changed = true;
    zip.file(rel.name, cleaned);

    // The sheet points at the removed VML drawing; drop that reference too.
    const sheetPath = rel.name.replace("/_rels/", "/").replace(/\.rels$/, "");
    const sheet = zip.file(sheetPath);
    if (sheet) {
      const sheetXml = await sheet.async("string");
      zip.file(sheetPath, sheetXml.replace(/<legacyDrawing\b[^>]*\/>/g, ""));
    }
  }

  return changed ? zip.generateAsync({ type: "arraybuffer" }) : data;
}

export async function parseTaskFile(file: File, projects: ProjectOption[]): Promise<ImportRow[]> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await stripComments(await file.arrayBuffer()));
  } catch {
    throw new Error("Could not read this Excel file. Open it in Excel, save it as .xlsx, and upload again.");
  }
  const ws = wb.getWorksheet("Tasks") ?? wb.worksheets[0];
  if (!ws) throw new Error("The file has no sheets.");

  const colIndex: Partial<Record<ColumnKey, number>> = {};
  ws.getRow(1).eachCell((cell, col) => {
    const key = HEADER_LOOKUP[normalizeHeader(cellText(cell.value))];
    if (key && colIndex[key] === undefined) colIndex[key] = col;
  });
  if (!colIndex.taskName) {
    throw new Error('Header row must include a "Task Name" column. Download the template to see the format.');
  }

  const projectByName = new Map(projects.map((p) => [String(p.name).trim().toLowerCase(), p]));
  const projectById = new Map(projects.map((p) => [String(p.id), p]));

  const rows: ImportRow[] = [];
  ws.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = (key: ColumnKey) =>
      colIndex[key] ? excelRow.getCell(colIndex[key]!).value : null;
    const text = (key: ColumnKey) => cellText(raw(key));

    if (COLUMNS.every((c) => c.key === "assignee" || !text(c.key))) return;

    const r: ImportRow = {
      row: rowNumber,
      taskName: text("taskName"),
      fileAssignee: text("assignee"),
      projectName: text("project"),
      priority: text("priority").toUpperCase() || "HIGH",
      startDate: "",
      dueDate: "",
      errors: [],
    };

    if (!r.taskName) r.errors.push("Task Name is required");

    if (!(PRIORITIES as readonly string[]).includes(r.priority)) {
      r.errors.push(`Priority "${r.priority}" must be LOW, MEDIUM or HIGH`);
    }

    const start = parseDate(raw("startDate"));
    const due = parseDate(raw("dueDate"));
    if (start === null) r.errors.push(`Start Date "${text("startDate")}" is not a valid date`);
    else r.startDate = start;
    if (due === null) r.errors.push(`Due Date "${text("dueDate")}" is not a valid date`);
    else r.dueDate = due;
    if (r.startDate && r.dueDate && r.dueDate < r.startDate) {
      r.errors.push("Due Date is before Start Date");
    }

    if (!r.projectName) {
      r.errors.push("Project is required");
    } else {
      const p = projectByName.get(r.projectName.toLowerCase()) ?? projectById.get(r.projectName);
      if (p) r.projectId = String(p.id);
      else r.errors.push(`"${r.projectName}" is not one of your projects`);
    }

    rows.push(r);
  });

  return rows;
}

/* ------------------------------------------------------------------ */
/* Payload                                                             */
/* ------------------------------------------------------------------ */

const localToday = () => {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

/** The day a row is saved under: its start date, else its due date, else today. */
export const taskDateOf = (r: ImportRow) => r.startDate || r.dueDate || localToday();

/** Tasks dated before today are imported as already done. */
export const statusOf = (r: ImportRow) =>
  taskDateOf(r) < localToday() ? "completed" : "yet_to_start";

/** One payload per valid row, all assigned to `assigneeId`. Invalid rows are skipped. */
export function buildBulkPayload(
  rows: ImportRow[],
  assigneeId: string | undefined,
  createdBy?: string
): BulkTaskItem[] {
  if (!assigneeId) return [];
  return rows
    .filter((r) => r.errors.length === 0)
    .map((r) => ({
      row: r.row,
      description: r.taskName,
      project: r.projectId!,
      project_id: r.projectId,
      assigned_to: assigneeId,
      created_by: createdBy,
      priority: r.priority,
      status: statusOf(r),
      task_date: taskDateOf(r),
      start_date: r.startDate || undefined,
      due_date: r.dueDate || undefined,
      end_time: r.dueDate || undefined,
    }));
}
