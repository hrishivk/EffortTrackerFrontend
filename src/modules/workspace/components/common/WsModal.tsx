import Dialog from "@mui/material/Dialog";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import type { WsModalProps } from "../../types";

export default function WsModal({
  open,
  onClose,
  busy = false,
  size = "sm",
  icon,
  title,
  caption,
  showClose = true,
  cancelLabel = "Cancel",
  primaryLabel,
  primaryIcon,
  primaryDisabled = false,
  primaryBusy,
  onPrimary,
  paperClassName,
  children,
}: WsModalProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      maxWidth={size}
      fullWidth
      slotProps={{
        paper: {
          className: paperClassName,
          sx: {
            borderRadius: 4,
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
          },
        },
      }}
    >
      <div className="wsd__modal">
        <div className="wsd__modal-head">
          <span className="cws__tile cws__tile--project">{icon}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="wsd__modal-title">{title}</h3>
            {caption && <p className="wsd__modal-caption">{caption}</p>}
          </div>
          {showClose && (
            <button
              type="button"
              className="cws__icon-btn"
              title="Close"
              disabled={busy}
              onClick={onClose}
            >
              <CloseIcon sx={{ fontSize: 19 }} />
            </button>
          )}
        </div>

        {children}

        <div className="wsd__modal-foot">
          <button type="button" className="cws__ghost" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="cws__primary"
            disabled={primaryDisabled || busy}
            onClick={onPrimary}
          >
            {(primaryBusy ?? busy) ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : primaryIcon}
            {primaryLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
