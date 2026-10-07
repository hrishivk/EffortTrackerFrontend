import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { FiCheck, FiChevronDown, FiX } from "react-icons/fi";
import type { project } from "../../../types/Project";
import { VISIBLE_CHIPS } from "./editUserUtils";

interface ProjectPickerProps {
  projects: project[];
  selectedIds: string[];
  selectedProjects: project[];
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onToggle: (id: string) => void;
}

const ProjectPicker = ({
  projects,
  selectedIds,
  selectedProjects,
  open,
  setOpen,
  onToggle,
}: ProjectPickerProps) => {
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, setOpen]);

  return (
    <div className="eu-picker" ref={pickerRef}>
      <div
        className={`eu-picker-control ${open ? "is-open" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
      >
        {selectedProjects.length === 0 ? (
          <span className="eu-picker-placeholder">No projects assigned</span>
        ) : (
          <>
            <span className="eu-chips">
              {selectedProjects.slice(0, VISIBLE_CHIPS).map((p) => (
                <span key={p.id} className="eu-chip">
                  {p.name}
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(String(p.id));
                    }}
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}
            </span>
            {selectedProjects.length > VISIBLE_CHIPS && (
              <span className="eu-chip-more">
                +{selectedProjects.length - VISIBLE_CHIPS}
              </span>
            )}
          </>
        )}
        <FiChevronDown size={16} style={{ color: "var(--text-muted)" }} />
      </div>

      {open && (
        <div className="eu-picker-menu">
          {projects.length === 0 ? (
            <p className="eu-picker-empty">No projects available</p>
          ) : (
            projects.map((p) => {
              const isActive = selectedIds.includes(String(p.id));
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`eu-picker-option ${isActive ? "is-active" : ""}`}
                  onClick={() => onToggle(String(p.id))}
                >
                  <span>{p.name}</span>
                  {isActive && <FiCheck size={15} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectPicker;
