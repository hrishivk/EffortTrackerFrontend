import { Trash2 } from "lucide-react";
import type { Column } from "../../../../shared/components/Table/types";
import type { Domain } from "../../../../shared/types/Domain";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export const getDomainColumns = (
  onDelete?: (id: number) => void,
): Column<Domain>[] => [
  {
    key: "name",
    header: "Domain Name",
    render: (row) => (
      <div className="d-flex align-items-center gap-2">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: "#f3e8ff",
            color: "#7c3aed",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {row.name?.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
          {row.name}
        </span>
      </div>
    ),
  },
  {
    key: "description",
    header: "Description",
    render: (row) => (
      <span
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {row.description || "-"}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Created",
    render: (row) => (
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
        {formatDate(row.created_at)}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: (row) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(row.id);
        }}
        className="btn btn-sm p-1"
        style={{ color: "#dc3545" }}
        title="Delete domain"
      >
        <Trash2 size={16} />
      </button>
    ),
  },
];
