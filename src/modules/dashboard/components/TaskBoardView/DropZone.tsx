import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import type { BoardColumnDef } from "../../types";

export default function DropZone({ column, active }: { column: BoardColumnDef; active: boolean }) {
  return (
    <div
      style={{
        border: `2px dashed ${active ? column.accent : column.border}`,
        backgroundColor: active ? column.tint : "transparent",
        borderRadius: 12,
        padding: "22px 12px",
        textAlign: "center",
        transition: "border-color 0.18s, background-color 0.18s",
      }}
    >
      <InboxOutlinedIcon sx={{ fontSize: 26, color: column.accent, opacity: active ? 1 : 0.7 }} />
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 12,
          fontWeight: 700,
          color: column.accent,
        }}
      >
        Drop tasks here
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
        to move to {column.label}
      </p>
    </div>
  );
}
