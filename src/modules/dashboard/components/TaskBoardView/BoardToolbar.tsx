import AddIcon from "@mui/icons-material/Add";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { useState } from "react";
import type { BoardLaneSwitch } from "../../types";
import SpinLoader from "../../../../presentation/SpinLoader";

const laneButtonStyle = (busy: boolean) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 13px",
  borderRadius: 11,
  border: "1px solid var(--border-light)",
  backgroundColor: "var(--bg-card)",
  color: "var(--text-secondary)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: busy ? "wait" : "pointer",
  opacity: busy ? 0.6 : 1,
});

export default function BoardToolbar({
  taskCount,
  onNewGroup,
  laneSwitch,
}: {
  taskCount: number;
  onNewGroup?: () => void;
  laneSwitch?: BoardLaneSwitch;
}) {
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 14,
      }}
    >
      {/* Switching lanes hides/shows each lane and reloads the board; the
          spinner appears only when that takes a moment (after 300ms). */}
      <SpinLoader isLoading={busy} label="Updating lanes" />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 13px",
          borderRadius: 11,
          border: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-card)",
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        <DashboardCustomizeOutlinedIcon sx={{ fontSize: 15, color: "var(--text-faint)" }} />
        Group by: Status
        <span style={{ fontWeight: 500, color: "var(--text-faint)" }}>
          &middot; {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </span>
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {laneSwitch?.mode === "default" && laneSwitch.myGroupCount > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(laneSwitch.onShowMyGroups)}
            title="Hide the default lanes and show only your own groups"
            style={laneButtonStyle(busy)}
          >
            <VisibilityOffOutlinedIcon sx={{ fontSize: 15 }} /> Show my groups (
            {laneSwitch.myGroupCount})
          </button>
        )}
        {laneSwitch?.mode === "groups" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(laneSwitch.onShowDefaultLanes)}
            title="Hide your groups and show the default lanes and the groups added after them"
            style={laneButtonStyle(busy)}
          >
            <VisibilityOutlinedIcon sx={{ fontSize: 15 }} /> Show default lanes (
            {laneSwitch.defaultLaneCount})
          </button>
        )}
        {onNewGroup && (
          <button
            type="button"
            onClick={onNewGroup}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 15px",
              borderRadius: 11,
              border: "1px dashed #a855f7",
              backgroundColor: "rgba(168, 85, 247, 0.06)",
              color: "#7c3aed",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} /> New Group
          </button>
        )}
      </div>
    </div>
  );
}
