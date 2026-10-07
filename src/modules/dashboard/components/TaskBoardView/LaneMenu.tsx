import { useState } from "react";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function LaneMenu({
  accent,
  onRename,
  onRemove,
}: {
  accent: string;
  onRename: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        title="Group options"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          border: "none",
          background: open ? "var(--bg-hover)" : "none",
          borderRadius: 6,
          cursor: "pointer",
          color: "var(--text-faint)",
        }}
      >
        <MoreHorizIcon sx={{ fontSize: 17 }} />
      </button>

      {open && (
        <>
          <span
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 20, cursor: "default" }}
          />
          <span
            style={{
              position: "absolute",
              top: 26,
              right: 0,
              zIndex: 21,
              display: "flex",
              flexDirection: "column",
              minWidth: 148,
              padding: 5,
              borderRadius: 11,
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-card)",
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
            }}
          >
            {[
              { label: "Rename group", icon: EditOutlinedIcon, run: onRename, danger: false },
              { label: "Remove group", icon: DeleteOutlineIcon, run: onRemove, danger: true },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    item.run();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 9px",
                    border: "none",
                    borderRadius: 8,
                    background: "none",
                    color: item.danger ? "#dc2626" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Icon sx={{ fontSize: 15, color: item.danger ? "#dc2626" : accent }} />
                  {item.label}
                </button>
              );
            })}
          </span>
        </>
      )}
    </span>
  );
}
