import type React from "react";
import { FormControl, Select, MenuItem, TextField } from "@mui/material";
import type { TeamLeavesFilters, TeamMember } from "../../types";
import {
  cardStyle,
  leaveTypes,
  menuProps,
  selectSx,
  statusBadge,
  statusOptions,
} from "./constants";

type Props = {
  filters: TeamLeavesFilters;
  members: TeamMember[];
  onFilterChange: (key: keyof TeamLeavesFilters, value: string) => void;
  onClear: () => void;
};

const placeholder = (text: string) => <span style={{ color: "#9ca3af" }}>{text}</span>;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
      {label}
    </label>
    {children}
  </div>
);

export default function LeaveFilters({ filters, members, onFilterChange, onClear }: Props) {
  const hasFilters =
    !!filters.status || !!filters.leave_type || !!filters.user_id ||
    !!filters.from_date || !!filters.to_date;

  return (
    <div className="rounded-2xl p-4" style={cardStyle}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <Field label="Status">
          <FormControl fullWidth size="small" sx={selectSx}>
            <Select
              value={filters.status || ""}
              onChange={(e) => onFilterChange("status", e.target.value)}
              displayEmpty
              MenuProps={menuProps}
              renderValue={(val) =>
                val ? statusBadge[val as string]?.label || (val as string)
                    : placeholder("All Status")
              }
            >
              <MenuItem value="">All Status</MenuItem>
              {statusOptions.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Field>

        <Field label="Leave Type">
          <FormControl fullWidth size="small" sx={selectSx}>
            <Select
              value={filters.leave_type || ""}
              onChange={(e) => onFilterChange("leave_type", e.target.value)}
              displayEmpty
              MenuProps={menuProps}
              renderValue={(val) => (val ? (val as string) : placeholder("All Types"))}
            >
              <MenuItem value="">All Types</MenuItem>
              {leaveTypes.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Field>

        <Field label="Employee">
          <FormControl fullWidth size="small" sx={selectSx}>
            <Select
              value={filters.user_id || ""}
              onChange={(e) => onFilterChange("user_id", e.target.value)}
              displayEmpty
              MenuProps={menuProps}
              renderValue={(val) => {
                if (!val) return placeholder("All Employees");
                const m = members.find((x) => x.id === val);
                return m?.fullName || (val as string);
              }}
            >
              <MenuItem value="">All Employees</MenuItem>
              {members.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.fullName}
                  {m.employee_id ? ` (${m.employee_id})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Field>

        <Field label="From">
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.from_date || ""}
            onChange={(e) => onFilterChange("from_date", e.target.value)}
            sx={selectSx}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Field>

        <Field label="To">
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.to_date || ""}
            onChange={(e) => onFilterChange("to_date", e.target.value)}
            inputProps={{ min: filters.from_date || undefined }}
            sx={selectSx}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Field>
      </div>

      {hasFilters && (
        <div className="d-flex justify-content-end mt-3">
          <button
            onClick={onClear}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#7c3aed",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
