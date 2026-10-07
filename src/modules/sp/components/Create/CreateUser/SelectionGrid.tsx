import React from "react";

type SelectableCardProps = {
  title: string;
  subtitle: string;
  selected: boolean;
  onToggle: () => void;
};

export const SelectableCard = ({ title, subtitle, selected, onToggle }: SelectableCardProps) => (
  <div className="col-md-6">
    <div
      onClick={onToggle}
      className="d-flex align-items-center gap-3 p-3 rounded-3"
      style={{
        border: selected ? "2px solid #7c3aed" : "1px solid var(--border-light)",
        backgroundColor: selected ? "#f5f3ff" : "var(--bg-card)",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        readOnly
        style={{
          width: 16,
          height: 16,
          accentColor: "#7c3aed",
          cursor: "pointer",
        }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{subtitle}</div>
      </div>
    </div>
  </div>
);

type SelectionGridProps = {
  summary: string;
  showClear: boolean;
  onClear: () => void;
  children: React.ReactNode;
};

export const SelectionGrid = ({ summary, showClear, onClear, children }: SelectionGridProps) => (
  <div className="mb-4">
    <div className="d-flex align-items-center justify-content-between mb-2">
      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{summary}</span>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 11,
            fontWeight: 600,
            color: "#7c3aed",
            cursor: "pointer",
          }}
        >
          Clear selection
        </button>
      )}
    </div>

    <div
      className="row g-2"
      style={{
        maxHeight: 260,
        overflowY: "auto",
        overflowX: "hidden",
        margin: 0,
        paddingRight: 4,
      }}
    >
      {children}
    </div>
  </div>
);

export const EmptyBox = ({ message }: { message: string }) => (
  <div
    className="d-flex align-items-center justify-content-center p-4 mb-4 rounded-3"
    style={{ backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border-light)" }}
  >
    <p className="mb-0" style={{ fontSize: 13, color: "var(--text-faint)" }}>
      {message}
    </p>
  </div>
);
