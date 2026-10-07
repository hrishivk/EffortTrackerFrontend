import CheckIcon from "@mui/icons-material/Check";
import { initials } from "../../data/workspaceHelpers";
import type { PickLabelProps, PickListProps } from "../../types";

export default function PickList({
  items,
  loading = false,
  loadingText = "Loading…",
  emptyText,
  selected = [],
  onToggle,
}: PickListProps) {
  return (
    <div className="wsd__pick">
      {loading && <p className="cws__empty">{loadingText}</p>}
      {!loading && items.length === 0 && <p className="cws__empty">{emptyText}</p>}
      {!loading &&
        items.map((item) => {
          const body = (
            <>
              <span className="cws__avatar cws__avatar--sm">{initials(item.name)}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="wsd__pick-name">{item.name}</span>
                {item.sub && <span className="wsd__pick-role">{item.sub}</span>}
              </span>
            </>
          );

          if (!onToggle) {
            return (
              <div key={item.id} className="wsd__pick-row">
                {body}
                {item.action}
              </div>
            );
          }

          const on = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`wsd__pick-row${on ? " wsd__pick-row--on" : ""}`}
              onClick={() => onToggle(item.id)}
            >
              {body}
              <span className="wsd__pick-tick">
                {on && <CheckIcon sx={{ fontSize: 14 }} />}
              </span>
            </button>
          );
        })}
    </div>
  );
}

export function PickLabel({ label, count, style }: PickLabelProps) {
  return (
    <p className="cws__label" style={style}>
      {label} {count !== undefined && <span className="wsd__modal-count">{count}</span>}
    </p>
  );
}

export const toggleId = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
