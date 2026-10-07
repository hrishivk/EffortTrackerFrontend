import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { updateProjectStatus } from "../../../../../core/actions/spAction";
import { useSnackbar } from "../../../../../contexts/SnackbarContext";
import { PROJECT_STATUS_OPTIONS } from "../constants";

export type StatusDialogState = {
  open: boolean;
  projectId: number | null;
  projectName: string;
  current: string;
};

export const CLOSED_STATUS_DIALOG: StatusDialogState = {
  open: false, projectId: null, projectName: "", current: "",
};

type Props = {
  state: StatusDialogState;
  onStateChange: Dispatch<SetStateAction<StatusDialogState>>;
  onUpdated: () => void;
};

const ProjectStatusDialog = ({ state, onStateChange, onUpdated }: Props) => {
  const { showSnackbar } = useSnackbar();
  const [statusLoading, setStatusLoading] = useState(false);
  const close = () => onStateChange(CLOSED_STATUS_DIALOG);

  const handleUpdate = async () => {
    if (!state.projectId) return;
    setStatusLoading(true);
    try {
      await updateProjectStatus(String(state.projectId), state.current);
      showSnackbar({ message: `Status updated to ${state.current.replace("_", " ").toUpperCase()}`, severity: "success" });
      close();
      onUpdated();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to update status";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <Dialog
      open={state.open}
      onClose={close}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "visible" } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
        Change Project Status
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
          Update status for <strong style={{ color: "var(--text-primary)" }}>{state.projectName}</strong>
        </p>
        <div className="d-flex flex-column gap-2">
          {PROJECT_STATUS_OPTIONS.map((opt) => {
            const isSelected = opt.value === state.current;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  if (!isSelected) onStateChange((prev) => ({ ...prev, current: opt.value }));
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: isSelected ? `2px solid ${opt.color}` : "1px solid var(--border-light)",
                  backgroundColor: isSelected ? opt.bg : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: isSelected ? `5px solid ${opt.color}` : "2px solid var(--border-light)",
                    backgroundColor: isSelected ? "#fff" : "transparent",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{opt.desc}</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: opt.color,
                    backgroundColor: opt.bg,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {opt.label.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={close}
          sx={{ color: "#6b7280", textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          disabled={statusLoading}
          onClick={handleUpdate}
          variant="contained"
          sx={{
            backgroundColor: "#7c3aed",
            "&:hover": { backgroundColor: "#6d28d9" },
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {statusLoading ? "Updating..." : "Update Status"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectStatusDialog;
