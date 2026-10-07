import type React from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

const arrowStyle = (disabled: boolean): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 8,
  border: "1px solid var(--border-light)",
  background: disabled ? "var(--bg-hover)" : "var(--bg-card)",
  cursor: disabled ? "default" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  opacity: disabled ? 0.4 : 1,
});

export default function LeavePagination({ page, totalPages, total, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div
      className="d-flex align-items-center justify-content-between px-6"
      style={{ padding: "12px 24px", borderTop: "1px solid var(--border-light)" }}
    >
      <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 500 }}>
        Page {page} of {totalPages} • {total} total
      </span>
      <div className="d-flex align-items-center" style={{ gap: 4 }}>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          style={arrowStyle(page <= 1)}
        >
          <ChevronLeftIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
        </button>
        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
          <button
            key={pg}
            onClick={() => onPageChange(pg)}
            style={{
              width: 28, height: 28, borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: pg === page ? "1.5px solid #7c3aed" : "1px solid var(--border-light)",
              background: pg === page ? "#f5f3ff" : "var(--bg-card)",
              color: pg === page ? "#7c3aed" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            {pg}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          style={arrowStyle(page >= totalPages)}
        >
          <ChevronRightIcon sx={{ fontSize: 16, color: "var(--text-muted)" }} />
        </button>
      </div>
    </div>
  );
}
