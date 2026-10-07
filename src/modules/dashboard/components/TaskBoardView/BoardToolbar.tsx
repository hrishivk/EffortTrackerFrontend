import AddIcon from "@mui/icons-material/Add";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";

export default function BoardToolbar({
  taskCount,
  onNewGroup,
}: {
  taskCount: number;
  onNewGroup?: () => void;
}) {
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
