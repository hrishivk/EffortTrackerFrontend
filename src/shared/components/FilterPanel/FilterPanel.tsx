import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiX,
  FiChevronDown,
  FiCheck,
  FiTrash2,
  FiRotateCcw,
  FiFilter,
} from "react-icons/fi";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  /** Key into the values record. */
  key: string;
  label: string;
  placeholder: string;
  emptyText?: string;
  icon?: React.ReactNode;
  options: FilterOption[];
}

export interface FilterCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** Small caption above the fields, e.g. "Filter by project and role". */
  caption: string;
  fields: FilterField[];
}

export type FilterValues = Record<string, string>;

export const countActiveFilters = (values: FilterValues) =>
  Object.values(values).filter(Boolean).length;

const emptyValues = (categories: FilterCategory[]): FilterValues =>
  Object.fromEntries(
    categories.flatMap((c) => c.fields.map((f) => [f.key, ""])),
  );

/** The "Filters (n)" button that opens the panel. */
export const FilterTrigger: React.FC<{
  count: number;
  onClick: () => void;
  label?: string;
  className?: string;
}> = ({ count, onClick, label = "Filters", className = "" }) => (
  <button
    type="button"
    className={`fp-trigger ${className}`}
    onClick={onClick}
  >
    <FiFilter size={15} />
    {label}
    {count > 0 && <span className="fp-trigger-count">{count}</span>}
  </button>
);

/** Single-select control: trigger box, expanding option list, removable chip. */
const FilterSelect: React.FC<{
  field: FilterField;
  value: string;
  onChange: (value: string) => void;
}> = ({ field, value, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const selected = field.options.find((option) => option.value === value);

  return (
    <div className="fp-field">
      <button
        type="button"
        className={`fp-select ${expanded ? "is-open" : ""}`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {field.icon && <span className="fp-select-icon">{field.icon}</span>}
        <span className={`fp-select-label ${selected ? "is-selected" : ""}`}>
          {selected ? selected.label : field.placeholder}
        </span>
        {selected && <span className="fp-select-count">1 selected</span>}
        <FiChevronDown
          size={16}
          className={`fp-chevron ${expanded ? "is-open" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fp-options-wrap"
          >
            <div className="fp-options">
              {field.options.length === 0 ? (
                <p className="fp-options-empty">
                  {field.emptyText || "Nothing to choose from"}
                </p>
              ) : (
                field.options.map((option) => {
                  const isActive = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`fp-option ${isActive ? "is-active" : ""}`}
                      onClick={() => {
                        onChange(isActive ? "" : option.value);
                        setExpanded(false);
                      }}
                    >
                      <span>{option.label}</span>
                      {isActive && <FiCheck size={15} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <div className="fp-chips">
          <span className="fp-chip">
            {selected.label}
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={`Remove ${selected.label}`}
            >
              <FiX size={12} />
            </button>
          </span>
        </div>
      )}
    </div>
  );
};

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  categories: FilterCategory[];
  /** Values currently applied to the list. */
  values: FilterValues;
  onApply: (values: FilterValues) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  open,
  onClose,
  title,
  categories,
  values,
  onApply,
}) => {
  const [activeKey, setActiveKey] = useState(categories[0]?.key ?? "");
  // Edits stay local until "Apply Filters" so Cancel is a true discard.
  const [draft, setDraft] = useState<FilterValues>(values);

  useEffect(() => {
    if (open) {
      setDraft(values);
      setActiveKey(categories[0]?.key ?? "");
    }
    // `categories` is rebuilt each render by callers, so it is intentionally
    // not a dependency — only reopening should reset the panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, values]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const active =
    categories.find((c) => c.key === activeKey) ?? categories[0] ?? null;
  const draftCount = countActiveFilters(draft);
  const showRail = categories.length > 1;

  return (
    <AnimatePresence>
      {open && active && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fp-backdrop"
            onClick={onClose}
          />

          <div className="fp-wrap">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className={`fp-panel ${showRail ? "" : "is-narrow"}`}
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              <header className="fp-head">
                <h3>{title}</h3>
                <button
                  type="button"
                  className="fp-close"
                  onClick={onClose}
                  aria-label="Close filters"
                >
                  <FiX size={18} />
                </button>
              </header>

              <div className="fp-body">
                {showRail && (
                  <nav className="fp-rail">
                    {categories.map((category) => {
                      const hasValue = category.fields.some(
                        (field) => draft[field.key],
                      );
                      return (
                        <button
                          key={category.key}
                          type="button"
                          className={`fp-rail-item ${
                            category.key === active.key ? "is-active" : ""
                          }`}
                          onClick={() => setActiveKey(category.key)}
                        >
                          {category.icon}
                          <span>{category.label}</span>
                          {hasValue && <span className="fp-rail-dot" />}
                        </button>
                      );
                    })}
                  </nav>
                )}

                <div className="fp-pane">
                  <p className="fp-pane-title">{active.caption}</p>

                  {active.fields.map((field) => (
                    <div key={field.key}>
                      <label className="fp-label">{field.label}</label>
                      <FilterSelect
                        field={field}
                        value={draft[field.key] ?? ""}
                        onChange={(value) =>
                          setDraft((prev) => ({ ...prev, [field.key]: value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <footer className="fp-foot">
                <div className="fp-foot-left">
                  <button
                    type="button"
                    className="fp-link is-danger"
                    onClick={() => setDraft(emptyValues(categories))}
                    disabled={draftCount === 0}
                  >
                    <FiTrash2 size={14} />
                    Clear all
                  </button>
                  <button
                    type="button"
                    className="fp-link"
                    onClick={() => setDraft(values)}
                  >
                    <FiRotateCcw size={14} />
                    Reset to default
                  </button>
                </div>

                <div className="fp-foot-right">
                  <button type="button" className="fp-btn" onClick={onClose}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="fp-btn is-primary"
                    onClick={() => {
                      onApply(draft);
                      onClose();
                    }}
                  >
                    Apply Filters
                    {draftCount > 0 && (
                      <span className="fp-btn-count">{draftCount}</span>
                    )}
                  </button>
                </div>
              </footer>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
