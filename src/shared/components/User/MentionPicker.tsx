import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";


export interface MentionPerson {
  id: string;
  name: string;
  role?: string;
}

const MENU_MAX_H = 320;

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

interface MentionPickerProps {
  people: MentionPerson[];
  value: string;
  onChange: (id: string) => void;
  emptyLabel?: string;
  allowEmpty?: boolean;
  placeholder?: string;
  disabled?: boolean;

  onSearch?: (query: string) => void;
  onOpen?: () => void;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  selected?: MentionPerson | null;
}

export default function MentionPicker({
  people,
  value,
  onChange,
  emptyLabel = "Nobody",
  allowEmpty = true,
  placeholder = "Type @ to search people…",
  disabled = false,
  onSearch,
  onOpen,
  page = 1,
  pageCount = 1,
  onPageChange,
  loading = false,
  selected = null,
}: MentionPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [at, setAt] = useState<{ top: number; left: number; width: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chosen =
    people.find((p) => String(p.id) === String(value)) ??
    (selected && String(selected.id) === String(value) ? selected : null);

  const matches = useMemo(() => {
    if (onSearch) return people;

    const q = query.replace(/^@+/, "").trim().toLowerCase();
    const list = q
      ? people.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.role ?? "").toLowerCase().includes(q)
        )
      : people;
    return list.slice(0, 8);
  }, [people, query, onSearch]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!boxRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setAt(null);
      return;
    }
    const place = () => {
      const box = boxRef.current?.getBoundingClientRect();
      if (!box) return;
      const below = window.innerHeight - box.bottom;
      const top =
        below < MENU_MAX_H + 12 && box.top > below
          ? Math.max(8, box.top - Math.min(MENU_MAX_H, box.top - 8) - 4)
          : box.bottom + 4;
      setAt({ top, left: box.left, width: box.width });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, matches.length]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (!onSearch || !open) return;
    const term = query.replace(/^@+/, "").trim();
    const id = window.setTimeout(() => onSearch(term), 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  const reveal = () => {
    if (open) return;
    setOpen(true);
    onOpen?.();
  };

  const pick = (id: string) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !query && chosen && allowEmpty) {
      e.preventDefault();
      clear();
      return;
    }
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "@") reveal();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (matches[active]) {
        e.preventDefault();
        pick(String(matches[active].id));
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="mnp" ref={boxRef}>
      <div
        className={`mnp__box${open ? " mnp__box--open" : ""}${
          disabled ? " mnp__box--off" : ""
        }`}
        onClick={() => {
          if (disabled) return;
          reveal();
          inputRef.current?.focus();
        }}
      >
        {chosen ? (
          <span className="mnp__chip">
            <span className="mnp__avatar">{initialsOf(chosen.name)}</span>
            <span className="mnp__chip-name">{chosen.name}</span>
            {allowEmpty && (
              <button
                type="button"
                className="mnp__x"
                title={`Remove ${chosen.name}`}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
              >
                <CloseIcon sx={{ fontSize: 11 }} />
              </button>
            )}
          </span>
        ) : (
          <PersonOutlineIcon sx={{ fontSize: 13 }} />
        )}

        <input
          ref={inputRef}
          className="mnp__input"
          value={query}
          disabled={disabled}
          placeholder={chosen ? "" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            reveal();
          }}
          onFocus={reveal}
          onBlur={() => {
            setOpen(false);
            setQuery("");
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {open && !disabled && at &&
        createPortal(
          <div
            ref={menuRef}
            className="mnp__menu"
            role="listbox"
            style={{ top: at.top, left: at.left, minWidth: at.width }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {matches.length === 0 && !loading ? (
              <p className="mnp__none">
                Nobody here matches “{query.replace(/^@+/, "").trim()}”
              </p>
            ) : (
              matches.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={String(p.id) === String(value)}
                  className={`mnp__opt${i === active ? " mnp__opt--on" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(String(p.id))}
                >
                  <span className="mnp__avatar">{initialsOf(p.name)}</span>
                  <span className="mnp__opt-name">{p.name}</span>
                  {p.role && <span className="mnp__opt-role">{p.role}</span>}
                </button>
              ))
            )}

            {onPageChange && pageCount > 1 && (
              <div className="mnp__pager">
                <button
                  type="button"
                  disabled={loading || page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  Previous
                </button>
                <span>{loading ? "Loading…" : `${page} of ${pageCount}`}</span>
                <button
                  type="button"
                  disabled={loading || page >= pageCount}
                  onClick={() => onPageChange(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
            {allowEmpty && (
              <button
                type="button"
                className={`mnp__opt mnp__opt--empty${!value ? " mnp__opt--picked" : ""}`}
                onClick={() => pick("")}
              >
                {emptyLabel}
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
