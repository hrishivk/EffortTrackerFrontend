import { useState } from "react";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import type { BoardColumnDef } from "../../types";
import { GROUP_NAME_MAX } from "../boardConstants";
import LaneMenu from "./LaneMenu";

interface LaneHeaderProps {
  column: BoardColumnDef;
  count: number;
  dense: boolean;
  /** Only group-backed lanes can be renamed or removed. */
  editable: boolean;
  onRename: (label: string) => void;
  onRemove: () => void;
}

export default function LaneHeader({
  column,
  count,
  dense,
  editable,
  onRename,
  onRemove,
}: LaneHeaderProps) {
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState("");

  const commit = () => {
    setRenaming(false);
    onRename(renameText);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingBottom: dense ? 7 : 10,
        marginBottom: dense ? 7 : 10,
        borderBottom: `2px solid ${column.border}`,
      }}
    >
      {renaming ? (
        <>
          <input
            autoFocus
            value={renameText}
            maxLength={GROUP_NAME_MAX}
            onChange={(e) => setRenameText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setRenaming(false);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "3px 7px",
              borderRadius: 7,
              border: `1px solid ${column.accent}`,
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: 13.5,
              fontWeight: 700,
              outline: "none",
            }}
          />
          <button
            type="button"
            title="Save name"
            onClick={commit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              border: "none",
              borderRadius: 6,
              background: "none",
              color: column.accent,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <CheckOutlinedIcon sx={{ fontSize: 16 }} />
          </button>
        </>
      ) : (
        <>
          <span
            title={column.label}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: column.accent,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {column.label}
          </span>
          <span
            style={{
              backgroundColor: column.countBg,
              color: column.countText,
              fontSize: 11,
              fontWeight: 700,
              minWidth: 20,
              textAlign: "center",
              padding: "1px 6px",
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            {count}
          </span>
          <span style={{ flex: 1 }} />
          {editable && (
            <LaneMenu
              accent={column.accent}
              onRename={() => {
                setRenameText(column.label);
                setRenaming(true);
              }}
              onRemove={onRemove}
            />
          )}
        </>
      )}
    </div>
  );
}
