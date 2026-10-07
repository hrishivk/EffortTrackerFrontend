import { motion } from "framer-motion";
import TimelineIcon from "@mui/icons-material/Timeline";
import { showStamp, stagger, type ActivityEvent } from "./tdpUtils";

export default function ActivityTab({ activity }: { activity: ActivityEvent[] }) {
  return (
    <div className="tdp__panel">
      <div className="tdp__panel-head">
        <TimelineIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
        <h4 className="tdp__panel-title">Activity</h4>
      </div>
      {activity.length === 0 ? (
        <p className="tdp__note">Nothing has happened on this task yet.</p>
      ) : (
        <ul className="tdp__activity">
          {activity.map((e, i) => (
            <motion.li key={i} className="tdp__event" {...stagger(i)}>
              <span className="tdp__event-icon" style={{ backgroundColor: e.tone }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <p className="tdp__event-title">{e.title}</p>
                <p className="tdp__event-when">{showStamp(e.at)}</p>
                {e.note && <p className="tdp__event-reason">{e.note}</p>}
              </span>
              <span className="tdp__event-by">by {e.by}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
