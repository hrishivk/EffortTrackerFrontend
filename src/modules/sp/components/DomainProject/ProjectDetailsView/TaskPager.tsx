import type { ReactNode } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { pageWindow } from "./projectDetailsUtils";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const ArrowButton = ({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: 28, height: 28, borderRadius: 8, border: "1px solid #e5e7eb",
      flexShrink: 0,
      background: disabled ? "#f9fafb" : "#fff", cursor: disabled ? "default" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: disabled ? 0.4 : 1,
    }}>
    {children}
  </button>
);

const TaskPager = ({ page, totalPages, onPageChange }: Props) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 8,
      padding: "12px 0", borderTop: "1px solid #f3f4f6", marginTop: 4,
    }}>
      <span style={{
        fontSize: 12, color: "#9ca3af", fontWeight: 500,
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        Page {page} of {totalPages}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <ArrowButton disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
          <ChevronLeftIcon sx={{ fontSize: 16, color: "#6b7280" }} />
        </ArrowButton>
        {pageWindow(page, totalPages).map((pg, i) =>
          pg === "…" ? (
            <span key={`gap-${i}`} style={{
              width: 16, textAlign: "center", fontSize: 12,
              color: "#9ca3af", userSelect: "none",
            }}>
              &#8230;
            </span>
          ) : (
            <button key={pg} onClick={() => onPageChange(pg)}
              style={{
                width: 28, height: 28, borderRadius: 8, fontSize: 12, fontWeight: 600,
                flexShrink: 0,
                border: pg === page ? "1.5px solid #7c3aed" : "1px solid #e5e7eb",
                background: pg === page ? "#f5f3ff" : "#fff",
                color: pg === page ? "#7c3aed" : "#6b7280",
                cursor: "pointer",
              }}>
              {pg}
            </button>
          )
        )}
        <ArrowButton disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
          <ChevronRightIcon sx={{ fontSize: 16, color: "#6b7280" }} />
        </ArrowButton>
      </div>
    </div>
  );
};

export default TaskPager;
