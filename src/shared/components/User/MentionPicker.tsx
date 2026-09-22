import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

/**
 * Picking one person by typing, the way every other tool does it.
 *
 * A roster is a list of names, and a list of names is something you search, not
 * something you scroll: the dropdown this replaces made you read every member of
 * a room to find the one you already had in mind. Here you type `@ma` and the
 * one you meant is the thing under the cursor.
 *
 * The `@` is a trigger, not syntax — it opens the menu and is then stripped from
 * the query, so "@may" and "may" find the same person and nobody has to know the
 * convention to use the field.
 *
 * The menu is fixed to the viewport and portalled out of the form. It used to be
 * absolutely positioned inside it, which is fine until the field sits in a box
 * that scrolls — a subtask row does — because an absolutely positioned child
 * still counts towards its ancestors' scroll height. The menu made the subtask
 * list scrollable, the browser scrolled the focused input into view, and the row
 * being edited slid off the top of its own list. Out here it cannot move
 * anything.
 */

export interface MentionPerson {
  id: string;
  name: string;
  /** Shown greyed beside the name, when the roster carries one. */
  role?: string;
}

/** Kept in step with `.mnp__menu`'s max-height, for the flip-up decision. */
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
  /** The chosen id, or "" for nobody. */
  value: string;
  onChange: (id: string) => void;
  /**
   * What picking nobody means here — "Same as task owner" on a subtask, which
   * is a real choice rather than an empty one, so it is offered as a row of its
   * own rather than only reachable by clearing the field.
   */
  emptyLabel?: string;
  /**
   * Whether picking nobody is a choice at all. False where the field has to
   * hold somebody — a report about no one is not a report — and the row is
   * left off rather than offered and then refused.
   */
  allowEmpty?: boolean;
  placeholder?: string;
  disabled?: boolean;

  // ─── For a roster that arrives a page at a time ───────────────────
  /**
   * Given, the query goes to the server as well — otherwise a search could
   * only ever find the page that happens to be loaded.
   */
  onSearch?: (query: string) => void;
  /**
   * Fired the first time the menu opens, and on each open after. Where the
   * roster is fetched, so nothing is asked for until somebody actually reaches
   * for the field.
   */
  onOpen?: () => void;
  /**
   * A pager under the menu: one page of the roster at a time, with a way back
   * to the one before. Given `pageCount` above 1, the footer appears.
   */
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  /**
   * The chosen person, for when they are not on the page being shown. Without
   * it, paging away from somebody's row empties the field that names them.
   */
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
  /** The row the keyboard is on. */
  const [active, setActive] = useState(0);
  /** Where the menu sits, in viewport coordinates. */
  const [at, setAt] = useState<{ top: number; left: number; width: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chosen =
    people.find((p) => String(p.id) === String(value)) ??
    (selected && String(selected.id) === String(value) ? selected : null);

  const matches = useMemo(() => {
    // Searching server-side: what came back is already the answer, and
    // filtering it again here would hide a match found on a field we cannot
    // see.
    if (onSearch) return people;

    const q = query.replace(/^@+/, "").trim().toLowerCase();
    const list = q
      ? people.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.role ?? "").toLowerCase().includes(q)
        )
      : people;
    // Long enough to scan, short enough not to become the scrolling list this
    // is here to replace.
    return list.slice(0, 8);
  }, [people, query, onSearch]);

  // Clicking anywhere else is a decision not to pick.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      // The menu is portalled, so it is not inside the box any more — but a
      // click on it is still a click on this control.
      if (!boxRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  /**
   * Follow the field: measured before paint so the menu never shows up in last
   * position first, and re-measured on any scroll (capture phase, because the
   * one that moves the field is usually an inner container's, not the window's).
   */
  useLayoutEffect(() => {
    if (!open) {
      setAt(null);
      return;
    }
    const place = () => {
      const box = boxRef.current?.getBoundingClientRect();
      if (!box) return;
      const below = window.innerHeight - box.bottom;
      // Not enough room under it — open upwards rather than off the screen.
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

  // A new query is a new list, so the highlight goes back to the top of it.
  useEffect(() => setActive(0), [query, open]);

  /**
   * Hand the query to whoever is loading the roster, once the typing settles.
   * Debounced, because for them this is a request rather than a filter.
   */
  useEffect(() => {
    if (!onSearch || !open) return;
    const term = query.replace(/^@+/, "").trim();
    const id = window.setTimeout(() => onSearch(term), 300);
    return () => window.clearTimeout(id);
    // Re-running on `onSearch`'s identity would fire a request per render.
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
    // Backspace on an empty box takes the chip off, as it does in every
    // recipient field people already use.
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
      // Only when there is something to take: otherwise Enter belongs to the
      // form this sits in.
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
          // Tabbing out of the field should not leave a menu floating over the
          // form. Clicking the menu never gets here: it holds the focus itself
          // (see the menu's mousedown below).
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
            // Keep the focus in the input while a row is being clicked: without
            // this the field blurs first, the menu unmounts, and the click has
            // nothing left to land on.
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

            {/* Unassigning is a choice of its own, so it is a row rather than
                something you have to know to reach with Backspace. */}
            {/*
              * One page at a time, with a way back to the last one. A roster
              * is read in passes — you look down a page, do not see the name,
              * and go to the next — so the control that moves you says which
              * page you are on and lets you return to it.
              */}
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
                // A row of the menu, so choosing it closes the menu — unlike
                // the chip's ×, which clears in order to pick somebody else.
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
