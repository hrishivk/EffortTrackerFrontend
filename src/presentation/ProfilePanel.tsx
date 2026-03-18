import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiMail,
  FiShield,
  FiBriefcase,
  FiClock,
  FiCalendar,
  FiLogOut,
  FiPhone,
  FiDroplet,
  FiUser,
  FiGlobe,
  FiCheckCircle,
} from "react-icons/fi";
import SpinLoader from "./SpinLoader";
import { fetchUser } from "../core/actions/spAction";
import type { ProfileData, RoleMeta } from "../shared/types/Profile";
import prLogo from "../assets/img/prLogo.png";

const ROLE_META: Record<string, RoleMeta> = {
  SP: { label: "Super Admin", bg: "linear-gradient(135deg, #f3e8ff, #ede9fe)", color: "#7c3aed", glow: "rgba(124,58,237,0.18)" },
  AM: { label: "Admin Manager", bg: "linear-gradient(135deg, #dbeafe, #e0f2fe)", color: "#2563eb", glow: "rgba(37,99,235,0.18)" },
  USER: { label: "User", bg: "linear-gradient(135deg, #dcfce7, #d1fae5)", color: "#16a34a", glow: "rgba(22,163,74,0.18)" },
  DEVLOPER: { label: "Developer", bg: "linear-gradient(135deg, #ffedd5, #fed7aa)", color: "#ea580c", glow: "rgba(234,88,12,0.18)" },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatLastSeen(dateStr?: string | Date | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function getWorkDaysForCurrentMonth(): boolean[] {
  return [false, true, true, true, true, true, true];
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function parseWorkSchedule(ws?: string) {
  if (!ws) return { label: "Full-Time", start: "09:00", startPeriod: "AM", end: "05:00", endPeriod: "PM" };
  const timeMatch = ws.match(/(\d{1,2})\s*(AM|PM)\s*-\s*(\d{1,2})\s*(AM|PM)/i);
  const labelMatch = ws.match(/^([^(]+)/);
  return {
    label: labelMatch ? labelMatch[1].trim() : "Full-Time",
    start: timeMatch ? `${timeMatch[1].padStart(2, "0")}:00` : "09:00",
    startPeriod: timeMatch ? timeMatch[2].toUpperCase() : "AM",
    end: timeMatch ? `${timeMatch[3].padStart(2, "0")}:00` : "05:00",
    endPeriod: timeMatch ? timeMatch[4].toUpperCase() : "PM",
  };
}

function getProfileCompletion(data: ProfileData): number {
  const fields = [
    data.fullName, data.email, data.dateOfBirth, data.bloodGroup,
    data.contactNumber, data.joiningDate, data.department, data.jobTitle,
    data.employeeId,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] as const } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const } },
};

interface ProfileViewProps {
  userId?: string | number | null;
  onLogout?: () => void;
}

export default function ProfileView({ onLogout }: ProfileViewProps) {
  const [userData, setUserData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchUser();
        setUserData(res?.data || res);
      } catch {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayName = userData?.fullName
    ? userData.fullName.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
    : "User";

  const roleMeta = ROLE_META[userData?.role?.toUpperCase() || ""] || {
    label: userData?.role || "Unknown",
    bg: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
    color: "#6b7280",
    glow: "rgba(107,114,128,0.1)",
  };

  const completion = useMemo(() => (userData ? getProfileCompletion(userData) : 0), [userData]);
  if (loading) {
    return <SpinLoader isLoading />;
  }

  if (!userData) {
    return null;
  }

  const schedule = parseWorkSchedule(userData.workSchedule);
  const workDayFlags = getWorkDaysForCurrentMonth();

  return (
    <motion.div className="pf-page" variants={container} initial="hidden" animate="show">
      <motion.div className="pf-banner-section" variants={fadeUp}>
        <div className="pf-banner-mesh" />
        <div className="pf-banner-overlay">
          <motion.h1
            className="pf-banner-greeting"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {getGreeting()}, {displayName.split(" ")[0]}
          </motion.h1>
          <motion.p
            className="pf-banner-sub"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            Strategic planning and content updates for today.
          </motion.p>
        </div>
        <div className="pf-banner-decor">
          <div className="pf-banner-circle-1" />
          <div className="pf-banner-circle-2" />
          <div className="pf-banner-circle-3" />
        
        </div>
      </motion.div>
      <div className="pf-body">
        <div className="pf-left-col">
          <motion.div className="pf-profile-card" variants={scaleIn}>
            <div className="pf-avatar-section">
              <div className="pf-avatar-glow" />
              <div className="pf-avatar-ring">
                <img src={userData.image || prLogo} alt={displayName} className="pf-avatar-img" />
                <span className={`pf-online-dot ${userData.isBlocked ? "pf-online-dot--blocked" : ""}`} />
              </div>
            </div>
            <h3 className="pf-card-name">{displayName}</h3>
            <span className="pf-card-role" style={{ background: roleMeta.bg, color: roleMeta.color, boxShadow: `0 2px 8px ${roleMeta.glow}` }}>
              {userData.jobTitle || roleMeta.label}
            </span>
            <p className="pf-card-id">      
            </p>
            <div className="pf-card-status">
              <span className="pf-status-label">In Status</span>
              <span className={`pf-status-indicator ${userData.isBlocked ? "pf-status-indicator--blocked" : ""}`}>
                <span className="pf-status-pulse" />
                {userData.isBlocked ? "BLOCKED" : "ACTIVE"}
              </span>
            </div>

            <div className="pf-clocked-in">
              <span className="pf-clocked-label">CLOCKED IN</span>
              <div className="pf-clocked-row">
                <span className="pf-clocked-time">{userData.lastSeenAt ? formatLastSeen(userData.lastSeenAt) : ""}</span>
                <button className="pf-clock-btn" title="Clock action">
                  <FiClock size={16} />
                </button>
              </div>
            </div>
            <div className="pf-completion">
              <div className="pf-completion-header">
                <FiCheckCircle size={13} />
                <span className="pf-completion-text">Profile Completion</span>
                <span className="pf-completion-pct">{completion}%</span>
              </div>
              <div className="pf-completion-track">
                <motion.div
                  className="pf-completion-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {onLogout && (
              <button onClick={onLogout} className="pf-logout-btn">
                <FiLogOut size={14} />
                Sign Out
              </button>
            )}
          </motion.div>

          {/* Reporting Line */}
          {userData.reportingManager && (
            <motion.div className="pf-section-card pf-card-hover" variants={fadeUp}>
              <div className="pf-section-header">
                <h4 className="pf-section-label">REPORTING LINE</h4>
              </div>
              <div className="pf-reporting-line">
                <div className="pf-reporting-avatar-wrap">
                  <img src={userData.reportingManager.image || prLogo} alt={userData.reportingManager.fullName || "Manager"} className="pf-reporting-avatar" />
                </div>
                <div className="pf-reporting-info">
                  <span className="pf-reporting-name">{userData.reportingManager.fullName}</span>
                  <span className="pf-reporting-role">{userData.reportingManager.designation || "Manager"}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div className="pf-right-col">
          <motion.div className="pf-section-card pf-card-hover" variants={fadeUp}>
            <div className="pf-section-header">
              <div className="pf-section-icon"><FiClock size={16} /></div>
              <h4 className="pf-section-title">Work Schedule</h4>
              <span className="pf-schedule-badge">{schedule.label}</span>
            </div>
            <div className="pf-schedule-grid">
              <div className="pf-schedule-block">
                <span className="pf-schedule-block-label">SHIFT TIMING</span>
                <div className="pf-schedule-times">
                  <div className="pf-schedule-time">
                    <span className="pf-time-value">{schedule.start}</span>
                    <span className="pf-time-period">{schedule.startPeriod}</span>
                  </div>
                  <span className="pf-time-separator" />
                  <div className="pf-schedule-time">
                    <span className="pf-time-value">{schedule.end}</span>
                    <span className="pf-time-period">{schedule.endPeriod}</span>
                  </div>
                </div>
                <span className="pf-schedule-shift-label">MORNING SHIFT &bull; GMT+5:30</span>
              </div>

              <div className="pf-schedule-block">
                <span className="pf-schedule-block-label">WORK DAYS</span>
                <div className="pf-work-days">
                  {DAY_LABELS.map((day, idx) => (
                    <span key={idx} className={`pf-work-day ${workDayFlags[idx] ? "pf-work-day--active" : ""}`}>
                      {day}
                    </span>
                  ))}
                </div>
                <span className="pf-schedule-shift-label">1st, 3nd &amp; 5th Sat off</span>
              </div>

              <div className="pf-schedule-block pf-timezone-block">
                <span className="pf-schedule-block-label">TIMEZONE</span>
                <span className="pf-timezone-name">Asia/Kolkata</span>
                <span className="pf-timezone-local">
                  <FiGlobe size={12} />
                  Local time: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </span>
              </div>
            </div>
          </motion.div>
          <motion.div className="pf-section-card pf-card-hover" variants={fadeUp}>
            <div className="pf-section-header">
              <div className="pf-section-icon"><FiUser size={16} /></div>
              <h4 className="pf-section-title">Personal Information</h4>
            </div>
            <div className="pf-detail-grid pf-detail-grid--compact">
              <div className="pf-detail-item">
                <div className="pf-detail-icon-wrap"><FiUser size={14} /></div>
                <div>
                  <span className="pf-detail-label">Full Name</span>
                  <span className="pf-detail-value">{userData.fullName || "_"}</span>
                </div>
              </div>
              <div className="pf-detail-item">
                <div className="pf-detail-icon-wrap"><FiMail size={14} /></div>
                <div>
                  <span className="pf-detail-label">Email Address</span>
                  <span className="pf-detail-value">{userData.email || "—"}</span>
                </div>
              </div>
              <div className="pf-detail-item">
                <div className="pf-detail-icon-wrap"><FiCalendar size={14} /></div>
                <div>
                  <span className="pf-detail-label">Date of Birth</span>
                  <span className="pf-detail-value">{userData.dateOfBirth || "—"}</span>
                </div>
              </div>
              <div className="pf-detail-item">
                <div className="pf-detail-icon-wrap"><FiPhone size={14} /></div>
                <div>
                  <span className="pf-detail-label">Contact Number</span>
                  <span className="pf-detail-value">{userData.contactNumber || "—"}</span>
                </div>
              </div>
              <div className="pf-detail-item">
                <div className="pf-detail-icon-wrap"><FiDroplet size={14} /></div>
                <div>
                  <span className="pf-detail-label">Blood Group</span>
                  <span className="pf-detail-value">{userData.bloodGroup || "—"}</span>
                </div>
              </div>
              <div className="pf-detail-item">
                <div className="pf-detail-icon-wrap"><FiShield size={14} /></div>
                <div>
                  <span className="pf-detail-label">Job Title</span>
                  <span className="pf-detail-value">{userData.jobTitle || roleMeta.label}</span>
                </div>
              </div>
              <div className="pf-detail-item">
                <div className="pf-detail-icon-wrap"><FiBriefcase size={14} /></div>
                <div>
                  <span className="pf-detail-label">Department</span>
                  <span className="pf-detail-value">{userData.department || "Not assigned"}</span>
                </div>
              </div>
              <div className="pf-detail-item">
                <div className="pf-detail-icon-wrap"><FiCalendar size={14} /></div>
                <div>
                  <span className="pf-detail-label">Joining Date</span>
                  <span className="pf-detail-value">{userData.joiningDate || "—"}</span>
                </div>
              </div>
          
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
