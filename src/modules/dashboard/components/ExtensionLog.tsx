import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";

import type { TaskExtension } from "../../user/types";
import { toLocalDate } from "../../../shared/utils/taskStatus";

/**
 * Every time a task's deadline moved, and why.
 *
 * The one part of a task's history that was recorded rather than inferred: the
 * rest of the Activity tab is read off whatever timestamps the task happens to
 * carry, while each of these was written down by somebody who had to say why.
 * That is what makes it worth showing on its own, wherever a deadline is being
 * read or changed.
 */

const day = (value?: string | null) => {
  const d = toLocalDate(value);
  return d ? d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "—";
};

const stamp = (value?: string | null) => {
  const d = toLocalDate(value);
  return d
    ? `${d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
    : "";
};

interface ExtensionLogProps {
  extensions?: TaskExtension[];
  /** Shown above the list. Omitted, the list stands on its own. */
  title?: string;
  /** Oldest first is the API's order; newest first reads better on a card. */
  newestFirst?: boolean;
}

export default function ExtensionLog({
  extensions,
  title,
  newestFirst = false,
}: ExtensionLogProps) {
  if (!extensions?.length) return null;

  const rows = newestFirst ? [...extensions].reverse() : extensions;

  return (
    <div className="xlog">
      {title && (
        <p className="xlog__title">
          <EventRepeatOutlinedIcon sx={{ fontSize: 13 }} />
          {title}
          <span className="xlog__count">{extensions.length}</span>
        </p>
      )}

      <ul className="xlog__list">
        {rows.map((ext) => (
          <li key={ext.id} className="xlog__item">
            <p className="xlog__move">
              {/* No previous date means the deadline was set, not moved. */}
              {ext.previous_due_date ? (
                <>
                  <span className="xlog__was">{day(ext.previous_due_date)}</span>
                  <span className="xlog__arrow">→</span>
                  <span className="xlog__now">{day(ext.new_due_date)}</span>
                </>
              ) : (
                <>
                  Due date set
                  <span className="xlog__now">{day(ext.new_due_date)}</span>
                </>
              )}
            </p>

            <p className="xlog__reason">{ext.reason}</p>

            <p className="xlog__by">
              {/* The record outlives the account that made it. */}
              {ext.extendedBy?.fullName ?? "Somebody since removed"}
              {" · "}
              {stamp(ext.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
