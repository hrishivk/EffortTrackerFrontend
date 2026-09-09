import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";

import { GROUP_COLORS, GROUP_NAME_MAX } from "./boardConstants";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  takenNames: Set<string>;
  onCreate: (data: { name: string; color: string }) => Promise<void>;
}

export default function CreateGroupModal({
  open,
  onClose,
  takenNames,
  onCreate,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [accent, setAccent] = useState(GROUP_COLORS[5]);
  const [saving, setSaving] = useState(false);

  // Start clean every time the dialog opens.
  useEffect(() => {
    if (open) {
      setName("");
      setAccent(GROUP_COLORS[5]);
      setSaving(false);
    }
  }, [open]);

  const label = name.trim();
  const duplicate = !!label && takenNames.has(label.toLowerCase());
  const valid = !!label && !duplicate && !saving;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await onCreate({ name: label, color: accent });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Create New Group
          </h3>
          <button
            type="button"
            onClick={onClose}
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

        {/* Group name */}
        <p
          style={{
            margin: "0 0 7px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          Group Name
        </p>
        <div style={{ position: "relative" }}>
          <input
            autoFocus
            value={name}
            maxLength={GROUP_NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="Enter group name"
            style={{
              width: "100%",
              padding: "11px 56px 11px 13px",
              borderRadius: 11,
              border: `1px solid ${duplicate ? "#dc2626" : "var(--border-light)"}`,
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 13,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 11,
              color: "var(--text-faint)",
              pointerEvents: "none",
            }}
          >
            {name.length}/{GROUP_NAME_MAX}
          </span>
        </div>
        {duplicate && (
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#dc2626" }}>
            A group with that name is already on the board.
          </p>
        )}

        {/* Colour */}
        <p
          style={{
            margin: "18px 0 9px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          Choose Color
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {GROUP_COLORS.map((c) => {
            const active = accent === c;
            return (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setAccent(c)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  height: 30,
                  padding: 0,
                  borderRadius: "50%",
                  backgroundColor: c,
                  border: "none",
                  boxShadow: active ? `0 0 0 3px ${c}44` : "none",
                  cursor: "pointer",
                }}
              >
                {active && <CheckIcon sx={{ fontSize: 17, color: "#fff" }} />}
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <p
          style={{
            margin: "18px 0 7px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          Preview
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "12px 13px",
            borderRadius: 11,
            border: "1px solid var(--border-light)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: accent,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: label ? "var(--text-primary)" : "var(--text-faint)",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label || "Group name"}
          </span>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 22,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              border: "none",
              background: valid
                ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                : "var(--bg-hover)",
              color: valid ? "#fff" : "var(--text-faint)",
              fontSize: 13,
              fontWeight: 600,
              cursor: valid ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Creating\u2026" : "Create Group"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
