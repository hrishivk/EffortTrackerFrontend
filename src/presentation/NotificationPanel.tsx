import { useState, useEffect } from "react";
import {
  FiBell,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiInbox,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

// ─── Types ───
export interface Notification {
  id: string;
  type: "due_date_approval" | "task_created" | "task_updated";
  developerName: string;
  taskName: string;
  projectName: string;
  requestedDueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  isRead: boolean;
}

// ─── Dummy Data ───
const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "due_date_approval",
    developerName: "Rahul Sharma",
    taskName: "API Integration - User Auth",
    projectName: "RhythmRx Portal",
    requestedDueDate: "2026-03-05",
    priority: "high",
    status: "pending",
    createdAt: "2026-02-26T09:30:00",
    isRead: false,
  },
  {
    id: "2",
    type: "due_date_approval",
    developerName: "Priya Patel",
    taskName: "Dashboard UI Redesign",
    projectName: "Tracker Frontend",
    requestedDueDate: "2026-03-10",
    priority: "medium",
    status: "pending",
    createdAt: "2026-02-26T08:15:00",
    isRead: false,
  },
  {
    id: "3",
    type: "due_date_approval",
    developerName: "Amit Kumar",
    taskName: "Database Migration Script",
    projectName: "RhythmRx Portal",
    requestedDueDate: "2026-03-02",
    priority: "high",
    status: "pending",
    createdAt: "2026-02-25T16:45:00",
    isRead: false,
  },
  {
    id: "4",
    type: "task_created",
    developerName: "Sneha Verma",
    taskName: "Payment Gateway Integration",
    projectName: "RhythmRx Portal",
    requestedDueDate: "2026-03-15",
    priority: "medium",
    status: "pending",
    createdAt: "2026-02-25T14:20:00",
    isRead: true,
  },
  {
    id: "5",
    type: "due_date_approval",
    developerName: "Vikram Singh",
    taskName: "Unit Test Coverage - Auth",
    projectName: "Tracker Frontend",
    requestedDueDate: "2026-03-08",
    priority: "low",
    status: "pending",
    createdAt: "2026-02-25T11:00:00",
    isRead: true,
  },
  {
    id: "6",
    type: "due_date_approval",
    developerName: "Rahul Sharma",
    taskName: "Bug Fix - Login Redirect",
    projectName: "RhythmRx Portal",
    requestedDueDate: "2026-02-28",
    priority: "high",
    status: "approved",
    createdAt: "2026-02-24T10:30:00",
    isRead: true,
  },
  {
    id: "7",
    type: "due_date_approval",
    developerName: "Priya Patel",
    taskName: "Mobile Responsive Fixes",
    projectName: "Tracker Frontend",
    requestedDueDate: "2026-02-27",
    priority: "medium",
    status: "rejected",
    createdAt: "2026-02-23T09:00:00",
    isRead: true,
  },
];

// ─── Helpers ───
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const P_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};

type FilterTab = "all" | "pending" | "approved" | "rejected";

// ─── Compact Card ───
function NotiCard({
  n,
  onApprove,
  onReject,
  onRead,
}: {
  n: Notification;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRead: (id: string) => void;
}) {
  const initials = n.developerName.split(" ").map((w) => w[0]).join("").toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={() => !n.isRead && onRead(n.id)}
      className={`relative px-3 py-2 cursor-pointer transition-colors ${
        !n.isRead ? "bg-purple-50/30" : ""
      }`}
      style={{ borderBottom: "1px solid var(--border-light)" }}
    >
      {!n.isRead && (
        <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[#AD21DB]" />
      )}

      <div className="flex items-start gap-2">
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-[#AD21DB] flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0 mt-0.5">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Time */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {n.developerName}
            </span>
            <span className="text-[9px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>
              {timeAgo(n.createdAt)}
            </span>
          </div>

          {/* Task */}
          <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
            {n.taskName}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] truncate" style={{ color: "var(--text-faint)" }}>{n.projectName}</span>
            <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>|</span>
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{shortDate(n.requestedDueDate)}</span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${P_DOT[n.priority]}`} />
          </div>

          {/* Actions */}
          {n.type === "due_date_approval" && n.status === "pending" && (
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(n.id); }}
                className="w-5 h-5 flex items-center justify-center rounded-full text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:scale-90 transition-all"
              >
                <FiCheck size={10} strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(n.id); }}
                className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 bg-gray-50 hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all"
              >
                <FiX size={10} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {n.status === "approved" && (
            <span className="inline-flex items-center gap-0.5 mt-1 text-[8px] font-medium text-emerald-600">
              <FiCheckCircle size={8} /> Approved
            </span>
          )}
          {n.status === "rejected" && (
            <span className="inline-flex items-center gap-0.5 mt-1 text-[8px] font-medium text-red-500">
              <FiXCircle size={8} /> Rejected
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Panel ───
export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const [filter, _setFilter] = useState<FilterTab>("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const pendingCount = notifications.filter((n) => n.status === "pending").length;

  const filtered =
    filter === "all" ? notifications : notifications.filter((n) => n.status === filter);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleApprove = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "approved" as const, isRead: true } : n))
    );
  const handleReject = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "rejected" as const, isRead: true } : n))
    );
  const handleRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

  return (
    <>
      {/* Bell */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: open ? "var(--text-primary)" : "var(--text-muted)", backgroundColor: open ? "var(--bg-hover)" : "transparent" }}
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[9px] font-bold text-white bg-[#AD21DB] rounded-full" style={{ boxShadow: "0 0 0 2px var(--bg-card)" }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Left Sidebar Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-[60px] bg-black/10 z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed top-[70px] right-2 bottom-2 w-[380px] rounded-xl z-50 flex flex-col shadow-lg overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              {/* Header */}
              <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FiBell size={14} className="text-[#AD21DB]" />
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Notifications</span>
                    {pendingCount > 0 && (
                      <span className="text-[7px] font-bold px-1 py-[1px] rounded-full bg-amber-100 text-amber-700">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[8px] font-medium text-[#AD21DB] hover:underline px-1"
                      >
                    
                      </button>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      className="p-0.5 rounded transition-colors"
                      style={{ color: "var(--text-faint)" }}
                    >
                      <FiX size={13} />
                    </button>
                  </div>
                </div>

              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {filtered.length > 0 ? (
                    filtered.map((n) => (
                      <NotiCard
                        key={n.id}
                        n={n}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onRead={handleRead}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-10"
                      style={{ color: "var(--text-faint)" }}
                    >
                      <FiInbox size={18} className="mb-1" style={{ color: "var(--text-faint)" }} />
                      <p className="text-[10px]">No {filter !== "all" ? filter : ""} notifications</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
