import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";

import type { TaskExtension } from "../../user/types";
import { toLocalDate } from "../../../shared/utils/taskStatus";


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
  title?: string;
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
