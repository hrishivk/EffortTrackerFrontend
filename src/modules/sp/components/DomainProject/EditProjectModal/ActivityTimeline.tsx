import { FiActivity } from "react-icons/fi";

import type { ProjectActivityEntry } from "../../../../../core/types";
import { byDay, describe } from "./activityFormat";
import { showTime } from "./dateUtils";

const ActivityTimeline = ({ activity }: { activity: ProjectActivityEntry[] }) => (
  <div className="ep-tl">
    {activity.length === 0 ? (
      <div className="ep-tl-empty">
        <FiActivity size={18} />
        <span>Nothing has happened to this project yet.</span>
      </div>
    ) : (
      byDay(activity).map((day) => (
        <section key={day.key} className="ep-tl-day">
          <h5 className="ep-tl-date">{day.heading}</h5>
          <ol className="ep-tl-list">
            {day.entries.map((entry) => {
              const { title, from, to, icon, tone } = describe(entry);
              return (
                <li key={entry.id} className={`ep-tl-item ep-tl--${tone}`}>
                  <span className="ep-tl-node">{icon}</span>
                  <div className="ep-tl-content">
                    <p className="ep-tl-title">
                      {title}
                      <time className="ep-tl-time" dateTime={entry.created_at}>
                        {showTime(entry.created_at)}
                      </time>
                    </p>
                    {to !== undefined && (
                      <p className="ep-tl-diff">
                        {from !== undefined && (
                          <>
                            <s className="ep-tl-was">{from}</s>
                            <span className="ep-tl-arrow">→</span>
                          </>
                        )}
                        <span className="ep-tl-now">{to}</span>
                      </p>
                    )}
                    {entry.reason && (
                      <blockquote className="ep-tl-reason">{entry.reason}</blockquote>
                    )}
                    <p className="ep-tl-by">by {entry.actor_name ?? "someone"}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))
    )}
  </div>
);

export default ActivityTimeline;
