import { useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloseIcon from "@mui/icons-material/Close";

import { bulkCreateTasks } from "../../../../../core/actions/action";
import { useSnackbar } from "../../../../../contexts/SnackbarContext";
import SpinLoader from "../../../../../presentation/SpinLoader";
import { cardStyle, priorityColors } from "./constants";
import type { ProjectOption } from "./utils";
import {
  buildBulkPayload,
  downloadTaskTemplate,
  statusOf,
  parseTaskFile,
  type ImportRow,
} from "./bulkImport";

type Props = {
  projects: ProjectOption[];
  createdBy?: string;
  /** Every imported task goes to this person, e.g. the one whose tasks are being viewed. */
  assigneeId?: string;
  assigneeName?: string;
  onCreated: () => void;
  onClose?: () => void;
};

const headCellSx = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-secondary)",
  backgroundColor: "var(--bg-surface)",
  whiteSpace: "nowrap" as const,
};
const cellSx = { fontSize: 13, color: "var(--text-primary)", borderColor: "var(--border-light)" };

const BulkTaskImport = ({
  projects,
  createdBy,
  assigneeId,
  assigneeName,
  onCreated,
  onClose,
}: Props) => {
  const { showSnackbar } = useSnackbar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const payload = useMemo(
    () => buildBulkPayload(rows, assigneeId, createdBy),
    [rows, assigneeId, createdBy]
  );
  const errorCount = rows.filter((r) => r.errors.length).length;
  // The file's "Assigned To" column says who it was downloaded for; warn on a mismatch.
  const fileAssignee = rows.find((r) => r.fileAssignee)?.fileAssignee;
  const wrongPerson =
    fileAssignee && assigneeName && fileAssignee.toLowerCase() !== assigneeName.trim().toLowerCase()
      ? fileAssignee
      : undefined;

  const reset = () => {
    setRows([]);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleTemplate = async () => {
    setDownloading(true);
    try {
      await downloadTaskTemplate(projects, assigneeName);
    } catch {
      showSnackbar({ message: "Could not generate the template", severity: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      showSnackbar({ message: "Please upload an .xlsx file", severity: "error" });
      return;
    }
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseTaskFile(file, projects);
      if (!parsed.length) {
        showSnackbar({ message: "No task rows found in the file", severity: "warning" });
        reset();
        return;
      }
      setRows(parsed);
    } catch (e) {
      showSnackbar({ message: e instanceof Error ? e.message : "Could not read the Excel file", severity: "error" });
      reset();
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!assigneeId) {
      showSnackbar({ message: "No person to assign the tasks to", severity: "error" });
      return;
    }
    if (!payload.length) return;
    setSubmitting(true);
    try {
      const result = await bulkCreateTasks(payload);
      if (result.errors.length) {
        // Keep the failed rows on screen with the server's reason.
        const serverErrors = new Map(result.errors.map((e) => [e.row, e.message]));
        setRows((prev) =>
          prev
            .filter((r) => serverErrors.has(r.row) || r.errors.length)
            .map((r) =>
              serverErrors.has(r.row) ? { ...r, errors: [...r.errors, serverErrors.get(r.row)!] } : r
            )
        );
        showSnackbar({
          message: `${result.created} task(s) created, ${result.failed} failed`,
          severity: result.created ? "warning" : "error",
        });
      } else {
        showSnackbar({ message: `${result.created} task(s) created successfully`, severity: "success" });
        reset();
      }
      if (result.created) onCreated();
    } catch (error) {
      const msg = isAxiosError(error) ? error.response?.data?.message : undefined;
      showSnackbar({ message: msg || "Failed to import tasks", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={onClose ? "p-4" : "rounded-3 border p-4 mb-4"} style={onClose ? undefined : cardStyle}>
      <SpinLoader isLoading={parsing} delay={0} label="Reading Excel..." />
      <SpinLoader isLoading={submitting} delay={0} label="Creating tasks..." />
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UploadFileIcon sx={{ color: "#fff", fontSize: 16 }} />
          </div>
          <h5 className="fw-bold mb-0" style={{ fontSize: 16 }}>
            Import Tasks from Excel
          </h5>
        </div>
        <div className="d-flex gap-2">
          <Button
            size="small"
            variant="outlined"
            startIcon={downloading ? <CircularProgress size={14} /> : <DownloadIcon />}
            onClick={handleTemplate}
            disabled={downloading}
            sx={{ textTransform: "none", borderRadius: "8px", borderColor: "#7c3aed", color: "#7c3aed" }}
          >
            Download Template
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={() => inputRef.current?.click()}
            disabled={parsing || submitting}
            sx={{ textTransform: "none", borderRadius: "8px", backgroundColor: "#7c3aed", "&:hover": { backgroundColor: "#6d28d9" } }}
          >
            Upload Excel
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {onClose && (
            <IconButton size="small" onClick={onClose} disabled={submitting} aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </div>
      </div>
      <p className="mb-0" style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Download the template, fill one task per row, then upload it to preview and create all tasks at once.
        {assigneeName && (
          <>
            {" "}All tasks will be assigned to <b style={{ color: "var(--text-primary)" }}>{assigneeName}</b>.
          </>
        )}
      </p>
      {projects.length === 0 && (
        <p className="mb-0 mt-2" style={{ fontSize: 13, color: "#b45309" }}>
          You aren't assigned to any project yet, so there is nothing to import tasks into.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="d-flex flex-wrap align-items-center gap-2 mt-3 mb-2">
            <span style={{ fontSize: 13, fontWeight: 600 }}>{fileName}</span>
            <Chip size="small" label={`${rows.length} rows`} />
            <Chip size="small" color="success" variant="outlined" label={`${payload.length} tasks ready`} />
            {errorCount > 0 && <Chip size="small" color="error" variant="outlined" label={`${errorCount} with errors`} />}
          </div>

          {wrongPerson && (
            <div
              className="rounded-3 mb-2 px-3 py-2"
              style={{ fontSize: 13, color: "#b45309", backgroundColor: "rgba(245,158,11,0.1)" }}
            >
              This file was downloaded for <b>{wrongPerson}</b>, but these tasks will be assigned to{" "}
              <b>{assigneeName}</b>.
            </div>
          )}

          <TableContainer
            className="rounded-3 border"
            sx={{ maxHeight: 380, borderColor: "var(--border-light)" }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {["Row", "Task", "Project", "Priority", "Start", "Due", "Saves As", "Check"].map((h) => (
                    <TableCell key={h} sx={headCellSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const hasError = r.errors.length > 0;
                  const pColor = priorityColors[r.priority] || priorityColors.LOW;
                  return (
                    <TableRow
                      key={r.row}
                      sx={{ backgroundColor: hasError ? "rgba(220,38,38,0.06)" : undefined }}
                    >
                      <TableCell sx={cellSx}>{r.row}</TableCell>
                      <TableCell sx={{ ...cellSx, minWidth: 200 }}>
                        {r.taskName || <i style={{ color: "#9ca3af" }}>missing</i>}
                      </TableCell>
                      <TableCell sx={cellSx}>{r.projectName || "-"}</TableCell>
                      <TableCell sx={cellSx}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            backgroundColor: pColor.bg,
                            color: pColor.text,
                          }}
                        >
                          {r.priority}
                        </span>
                      </TableCell>
                      <TableCell sx={{ ...cellSx, whiteSpace: "nowrap" }}>{r.startDate || "-"}</TableCell>
                      <TableCell sx={{ ...cellSx, whiteSpace: "nowrap" }}>{r.dueDate || "-"}</TableCell>
                      <TableCell sx={{ ...cellSx, whiteSpace: "nowrap" }}>
                        {!hasError && (
                          <Chip
                            size="small"
                            label={statusOf(r) === "completed" ? "Completed" : "Yet to start"}
                            color={statusOf(r) === "completed" ? "success" : "default"}
                            variant="outlined"
                            sx={{ fontSize: 11, height: 22 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, minWidth: 180 }}>
                        {hasError ? (
                          <span className="d-inline-flex gap-1" style={{ color: "#dc2626", fontSize: 12 }}>
                            <ErrorIcon sx={{ fontSize: 16 }} />
                            <span>{r.errors.join("; ")}</span>
                          </span>
                        ) : (
                          <CheckCircleIcon sx={{ fontSize: 18, color: "#16a34a" }} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mt-3">
            {errorCount > 0 && payload.length > 0 && (
              <span style={{ fontSize: 12, color: "#d97706", marginRight: "auto" }}>
                Rows with errors will be skipped. Fix them in Excel and re-upload to include them.
              </span>
            )}
            <Button
              size="small"
              onClick={reset}
              disabled={submitting}
              sx={{ textTransform: "none", color: "var(--text-secondary)" }}
            >
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || payload.length === 0}
              sx={{ textTransform: "none", borderRadius: "8px", backgroundColor: "#16a34a", "&:hover": { backgroundColor: "#15803d" } }}
            >
              {submitting ? "Creating..." : `Create ${payload.length} Task${payload.length === 1 ? "" : "s"}${assigneeName ? ` for ${assigneeName}` : ""}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BulkTaskImport;
