import { useEffect, useState } from "react";
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
  FiFileText,
  FiLayers,
  FiCheckCircle,
  FiList,
  FiSend,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";


export const APP_VERSION = "2.1";
const SEEN_KEY = "krew:whats-new-seen";

// The banner follows the release SP last announced, so "seen" is kept per
// announcement rather than per build.
export const hasSeenAnnouncement = (id: string): boolean => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === id;
  } catch {
    return true;
  }
};

export const markAnnouncementSeen = (id: string) => {
  try {
    window.localStorage.setItem(SEEN_KEY, id);
  } catch {
  }
};

type Role = "SP" | "AM" | "USER" | "DEVLOPER";

interface FeatureMedia {
  type: "image" | "video";
  /** Served from /public, e.g. "/whats-new/my-tasks.mp4". */
  src: string;
  alt?: string;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  points: string[];
  roles?: Role[];
  media?: FeatureMedia;
}

const FEATURES: Feature[] = [
  {
    icon: <FiList size={17} />,
    title: "My Tasks for team members and developers",
    points: [
      "A My Tasks tab on your dashboard",
      "Shows only the tasks assigned to you, a page at a time",
      "Tasks load only when you open the tab",
    ],
    roles: ["USER", "DEVLOPER"],
    media: { type: "video", src: "/whats-new/my-tasks.webm", alt: "Opening My Tasks and paging through it" },
  },
  {
    icon: <FiUsers size={17} />,
    title: "Tasks inside a room",
    points: [
      "Open a workspace, pick a room and click yourself",
      "Only the tasks created in that room are shown",
      "Create a task there and it belongs to the room",
    ],
    media: { type: "video", src: "/whats-new/room-tasks.webm", alt: "Creating and viewing tasks inside a room" },
  },
  {
    icon: <FiFileText size={17} />,
    title: "Excel download and upload",
    points: [
      "Download a ready-made Excel template for your tasks",
      "Fill it in and upload it to create every task in one go",
      "Problems in the file are shown row by row before anything is saved",
    ],
    media: { type: "video", src: "/whats-new/excel-import.webm", alt: "Downloading the template and importing tasks" },
  },
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

const featuresFor = (role?: string | null) => {
  const who = String(role ?? "").toUpperCase() as Role;
  return FEATURES.filter((f) => !f.roles || f.roles.includes(who));
};

// A missing file just hides itself, so a feature can name its media before
// the file has been added to /public.
function FeatureMediaView({ media }: { media: FeatureMedia }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return media.type === "video" ? (
    // Muted, looping walkthrough; the controls give fullscreen and replay.
    <video
      className="wn__media wn__media--video"
      src={media.src}
      aria-label={media.alt}
      autoPlay
      loop
      muted
      controls
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  ) : (
    <img
      className="wn__media"
      src={media.src}
      alt={media.alt ?? ""}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

interface WhatsNewBannerProps {
  role?: string | null;
  version?: string;
  title?: string;
  onOpen: () => void;
  onDismiss: () => void;
}

export function WhatsNewBanner({
  role,
  version = APP_VERSION,
  title,
  onOpen,
  onDismiss,
}: WhatsNewBannerProps) {
  const features = featuresFor(role);
  const heading = title || `RX KREW ${version} is here`;
  return (
    <motion.div
      className="wnb"
      role="region"
      aria-label={heading}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <span className="wnb__orb" aria-hidden />
      <span className="wnb__ver" aria-hidden>
        {version}
      </span>

      <div className="wnb__body">
        <p className="wnb__title">
          <FiZap size={14} />
          {heading}
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
  /** SP only: send this release to every user as a notification and banner. */
  onAnnounce?: () => void;
  announcing?: boolean;
  /** When this version was last sent; SP may send it again after the cooldown. */
  lastSentAt?: string;
}

/** How long SP waits before the same release can be sent again. */
export const ANNOUNCE_COOLDOWN_MS = 5 * 60 * 1000;

const formatWait = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = String(total % 60).padStart(2, "0");
  return `${m}:${sec}`;
};

export default function WhatsNew({
  open,
  onClose,
  role,
  onAnnounce,
  announcing = false,
  lastSentAt,
}: WhatsNewProps) {
  const features = featuresFor(role);

  // Ticks only while SP has the page open and a send is cooling down.
  const [now, setNow] = useState(() => Date.now());
  const sentAt = lastSentAt ? new Date(lastSentAt).getTime() : NaN;
  const waitMs = Number.isNaN(sentAt) ? 0 : Math.max(0, sentAt + ANNOUNCE_COOLDOWN_MS - now);
  const coolingDown = waitMs > 0;
  useEffect(() => {
    if (!open || !onAnnounce || Number.isNaN(sentAt)) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [open, onAnnounce, sentAt]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
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
              className={`wn__item${f.media?.type === "video" ? " wn__item--wide" : ""}`}
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
                {f.media && <FeatureMediaView media={f.media} />}
              </div>
            </motion.section>
          ))}
        </div>

        <footer className="wn__foot">
          <span>You can open this again from &ldquo;What&rsquo;s new&rdquo; at the top of the page.</span>
          {onAnnounce && (
            <button
              type="button"
              className="wn__announce"
              onClick={onAnnounce}
              disabled={announcing || coolingDown}
              title={
                coolingDown
                  ? `Sent to everyone. You can send it again in ${formatWait(waitMs)}`
                  : "Notify every user and show them this page"
              }
            >
              <FiSend size={13} />
              {announcing
                ? "Sending…"
                : coolingDown
                  ? `Send again in ${formatWait(waitMs)}`
                  : lastSentAt
                    ? "Notify everyone again"
                    : "Notify everyone"}
            </button>
          )}
        </footer>
      </div>
    </Dialog>
  );
}
