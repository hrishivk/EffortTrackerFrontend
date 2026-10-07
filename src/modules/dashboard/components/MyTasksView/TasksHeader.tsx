import { FilterTrigger } from "../../../../shared/components/FilterPanel/FilterPanel";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { PRIMARY_GRADIENT } from "./constants";

type Props = {
  viewUserId?: string;
  viewedPersonName: string;
  isCompact: boolean;
  showCreateButton: boolean;
  onCreate: () => void;
  onImport?: () => void;
  filterCount: number;
  onOpenFilters: () => void;
};

export default function TasksHeader({
  viewUserId,
  viewedPersonName,
  isCompact,
  showCreateButton,
  onCreate,
  onImport,
  filterCount,
  onOpenFilters,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "clamp(1.15rem, 4vw, 1.65rem)" }}>
          {viewUserId
            ? viewedPersonName
              ? `${viewedPersonName}'s Tasks`
              : "Tasks"
            : "My Tasks"}
        </h2>
        <p className="text-muted mt-1 mb-0" style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.95rem)" }}>
          {viewUserId
            ? viewedPersonName
              ? `Viewing tasks assigned to ${viewedPersonName}`
              : "Viewing one person's tasks"
            : "Manage and track your daily activities"}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-shrink-0">
        <FilterTrigger count={filterCount} onClick={onOpenFilters} />

        {onImport && (
          <button
            className="btn d-flex align-items-center justify-content-center gap-1 flex-shrink-0"
            style={{
              border: "1px solid #7c3aed",
              color: "#7c3aed",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 14px",
              whiteSpace: "nowrap",
            }}
            onClick={onImport}
          >
            <UploadFileIcon sx={{ fontSize: 16 }} />
            {isCompact ? "Import" : "Import Excel"}
          </button>
        )}

        {showCreateButton && (
          <button
            className="btn text-white d-flex align-items-center justify-content-center gap-1 flex-shrink-0"
            style={{
              background: PRIMARY_GRADIENT,
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 18px",
              whiteSpace: "nowrap",
            }}
            onClick={onCreate}
          >
            {isCompact ? "+ Task" : "+ Create Task"}
          </button>
        )}
      </div>
    </div>
  );
}
