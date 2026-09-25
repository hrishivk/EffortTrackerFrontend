import Dialog from "@mui/material/Dialog";
import { motion } from "framer-motion";
import logo from "../assets/img/logo2.png.png";
import {
  FiActivity,
  FiBarChart2,
  FiBell,
  FiCalendar,
  FiClock,
  FiColumns,
  FiLayers,
  FiCheckCircle,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";

/**
 * What changed in RX KREW 2.0, for people who used the first version.
 *
 * Announced by `WhatsNewBanner` across the top of the page the first time
 * someone signs in after the release, and opened from there or from the
 * "What's new 2.0" pill in the header. `hasSeenWhatsNew` and
 * `markWhatsNewSeen` keep the banner to once per browser.
 */

export const APP_VERSION = "2.0";
const SEEN_KEY = "krew:whats-new-seen";

/** Storage can be missing or refuse in a private window; the release note is not worth an error. */
export const hasSeenWhatsNew = (): boolean => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === APP_VERSION;
  } catch {
    return true;
  }
};

export const markWhatsNewSeen = () => {
  try {
    window.localStorage.setItem(SEEN_KEY, APP_VERSION);
  } catch {
    /* nothing to remember it in — it will simply show again */
  }
};

type Role = "SP" | "AM" | "USER" | "DEVLOPER";

interface Feature {
  icon: React.ReactNode;
  title: string;
  points: string[];
  /** Who has it. Left out means everyone. */
  roles?: Role[];
}

const FEATURES: Feature[] = [
  {
    icon: <FiColumns size={17} />,
    title: "Three ways to see your tasks",
    points: [
      "List, Board and Gantt views of the same tasks",
      "Board lanes you can create, rename and colour",
      "Drag a card between lanes to change its status",
    ],
  },
  {
    icon: <FiLayers size={17} />,
    title: "Subtasks",
    points: [
      "Break a task into subtasks, each with its own owner and dates",
      "Run in order — the next one unlocks when the last is done",
      "Add, edit and delete subtasks from the task panel",
    ],
  },
  {
    icon: <FiClock size={17} />,
    title: "Deadlines on the record",
    points: [
      "Extend a deadline with a reason, recorded with your name",
      "See how many times a task has slipped, and why",
      "Filter for tasks whose deadline has been extended",
    ],
  },
  {
    icon: <FiActivity size={17} />,
    title: "Timer, comments and activity",
    points: [
      "Start and complete work with a built-in timer",
      "Comment on any task or subtask",
      "A full activity trail on every task",
    ],
  },
  {
    icon: <FiUsers size={17} />,
    title: "Workspaces and rooms",
    points: [
      "Shared rooms where a team works on the same tasks",
      "See what each member of a room is working on",
    ],
  },
  {
    icon: <FiCalendar size={17} />,
    title: "Projects",
    points: [
      "Edit a project's details and team in one place",
      "Extending a project's due date asks for a reason",
      "A timeline of everything done to a project",
    ],
    roles: ["SP", "AM"],
  },
  {
    icon: <FiBarChart2 size={17} />,
    title: "Task reports",
    points: [
      "Productivity, time and effort for any person or project",
      "Preset or custom date ranges",
      "Print or save the report as a PDF",
    ],
    roles: ["SP", "AM"],
  },
  {
    icon: <FiBell size={17} />,
    title: "Attendance, leave and notifications",
    points: [
      "Attendance summary, leave requests and holiday list",
      "Notifications that take you straight to the task",
      "Light and dark themes",
    ],
  },
];

/** What this person actually has — the SP/AM-only areas are left out for everyone else. */
const featuresFor = (role?: string | null) => {
  const who = String(role ?? "").toUpperCase() as Role;
  return FEATURES.filter((f) => !f.roles || f.roles.includes(who));
};

interface WhatsNewBannerProps {
  role?: string | null;
  onOpen: () => void;
  onDismiss: () => void;
}

/**
 * The first-login announcement: a strip across the top of the page rather
 * than a window in the way. It names the new areas so the gist lands without
 * a click, and the button opens the full note.
 */
export function WhatsNewBanner({ role, onOpen, onDismiss }: WhatsNewBannerProps) {
  const features = featuresFor(role);
  return (
    <motion.div
      className="wnb"
      role="region"
      aria-label={`RX KREW ${APP_VERSION} is here`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <span className="wnb__orb" aria-hidden />
      <span className="wnb__ver" aria-hidden>
        {APP_VERSION}
      </span>

      <div className="wnb__body">
        <p className="wnb__title">
          <FiZap size={14} />
          RX KREW {APP_VERSION} is here
        </p>
        <p className="wnb__sub">
          {features.length} new areas, built around how your team works.
        </p>
        <ul className="wnb__list">
          {features.map((f) => (
            <li key={f.title}>
              {f.icon}
              {f.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="wnb__actions">
        <button type="button" className="wnb__go" onClick={onOpen}>
          See what&rsquo;s new
        </button>
        <button type="button" className="wnb__x" onClick={onDismiss} aria-label="Dismiss">
          <FiX size={15} />
        </button>
      </div>
    </motion.div>
  );
}

interface WhatsNewProps {
  open: boolean;
  onClose: () => void;
  role?: string | null;
}

export default function WhatsNew({ open, onClose, role }: WhatsNewProps) {
  const features = featuresFor(role);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      // Opens with a fade, closes at once — dismissing it should not linger.
      transitionDuration={{ enter: 225, exit: 0 }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            boxShadow: "0 30px 80px rgba(15, 23, 42, 0.3)",
            overflow: "hidden",
          },
        },
      }}
    >
      <div className="wn">
        <header className="wn__hero">
          {/* Light, not content: two drifting glows and a dot grid behind the words. */}
          <span className="wn__orb wn__orb--a" aria-hidden />
          <span className="wn__orb wn__orb--b" aria-hidden />
          <span className="wn__dots" aria-hidden />

          <button type="button" className="wn__x" onClick={onClose} aria-label="Close">
            <FiX size={16} />
          </button>

          <div className="wn__hero-body">
            <motion.div
              className="wn__hero-text"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="wn__tag">
                <FiZap size={11} />
                What&rsquo;s new
              </span>
              <h2 className="wn__title">
                Meet
                <img src={logo} alt="" className="wn__logo" />
                KREW <span className="wn__title-ver">{APP_VERSION}</span>
              </h2>
              <p className="wn__sub">
                Rebuilt around how your team really works — new ways to plan, split and
                track the work, with every change on the record.
              </p>
              <div className="wn__chips">
                <span className="wn__chip">
                  <FiLayers size={12} />
                  {features.length} new areas
                </span>
                <span className="wn__chip">
                  <FiCheckCircle size={12} />
                  {features.reduce((n, f) => n + f.points.length, 0)} improvements
                </span>
              </div>
            </motion.div>

            <motion.span
              className="wn__big"
              aria-hidden
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.08, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            >
              {APP_VERSION}
            </motion.span>
          </div>
        </header>

        <div className="wn__grid">
          {features.map((f, i) => (
            <motion.section
              key={f.title}
              className="wn__item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.25, ease: "easeOut" }}
            >
              <span className="wn__icon">{f.icon}</span>
              <div className="wn__text">
                <h3>{f.title}</h3>
                <ul>
                  {f.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </motion.section>
          ))}
        </div>

        <footer className="wn__foot">
          <span>You can open this again from &ldquo;What&rsquo;s new&rdquo; at the top of the page.</span>
          <button type="button" className="wn__go" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </Dialog>
  );
}
