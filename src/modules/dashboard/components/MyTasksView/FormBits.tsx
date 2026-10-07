import type React from "react";
import { getInitials } from "./helpers";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
      {children}
    </label>
  );
}

export function CheckToggle({
  checked,
  onToggle,
  label,
  className = "",
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`d-flex align-items-center gap-2 cursor-pointer${className ? ` ${className}` : ""}`}
      onClick={onToggle}
      style={{ lineHeight: 1 }}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly
        style={{ accentColor: "#7c3aed", width: 15, height: 15, margin: 0, cursor: "pointer" }}
      />
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>
        {label}
      </span>
    </div>
  );
}

export function InitialsBubble({
  name,
  size,
  fontSize,
  color,
  className = "",
}: {
  name: string;
  size: number;
  fontSize: number;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-full text-white${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size, fontSize, fontWeight: 700, backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  );
}
