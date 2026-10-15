import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import CloseIcon from "@mui/icons-material/Close";

import { BOARD_COLUMNS, DEFAULT_LANE_KEYS, GROUP_COLORS } from "./boardConstants";

interface BoardSetupModalProps {
  open: boolean;
  onClose: () => void;
  onUseDefault: () => Promise<void>;
  onCreateOwn: () => void;
}

const defaultLanes = DEFAULT_LANE_KEYS.map((key) => BOARD_COLUMNS.find((c) => c.key === key)!);

function Choice({
  title,
  description,
  swatches,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  swatches: { label: string; color: string }[];
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "14px 15px",
        borderRadius: 12,
        border: "1px solid var(--border-light)",
        backgroundColor: "var(--bg-surface)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
        {title}
      </span>
      <span style={{ display: "block", margin: "3px 0 10px", fontSize: 12, color: "var(--text-muted)" }}>
        {description}
      </span>
      <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {swatches.map((s) => (
          <span
            key={s.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 9px",
              borderRadius: 999,
              border: "1px solid var(--border-light)",
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </span>
    </button>
  );
}

export default function BoardSetupModal({
  open,
  onClose,
  onUseDefault,
  onCreateOwn,
}: BoardSetupModalProps) {
  const [saving, setSaving] = useState(false);

  const applyDefault = async () => {
    setSaving(true);
    try {
      await onUseDefault();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
          },
        },
      }}
    >
      <div style={{ padding: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Set up your board
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            title="Close"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              border: "none",
              borderRadius: 8,
              background: "none",
              color: "var(--text-faint)",
              cursor: "pointer",
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--text-muted)" }}>
          Do you need the Yet to Start flow, or do you want to create your own groups?
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          <Choice
            title={saving ? "Setting up…" : "Use the default flow"}
            description="Tasks move from Yet to Start to In Progress to Completed."
            swatches={defaultLanes.map((c) => ({ label: c.label, color: c.accent }))}
            disabled={saving}
            onClick={() => void applyDefault()}
          />
          <Choice
            title="Create my own groups"
            description="Only the groups you create show on the board."
            swatches={[{ label: "Your group", color: GROUP_COLORS[5] }]}
            disabled={saving}
            onClick={onCreateOwn}
          />
        </div>
      </div>
    </Dialog>
  );
}
