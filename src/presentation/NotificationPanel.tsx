import { useState, useEffect, useCallback } from "react";
import {
  FiBell,
  FiX,
  FiInbox,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSend,
  FiSlash,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/configureStore";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../core/actions/notificationAction";

// ─── Types ───
interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

// ─── Icon + color per notification type ───
const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  leave_applied:          { icon: <FiSend size={12} />,        color: "#2563eb", bg: "#dbeafe" },
  leave_manager_approved: { icon: <FiCheckCircle size={12} />, color: "#16a34a", bg: "#dcfce7" },
  leave_manager_rejected: { icon: <FiXCircle size={12} />,     color: "#dc2626", bg: "#fee2e2" },
  leave_pending_admin:    { icon: <FiClock size={12} />,       color: "#d97706", bg: "#fef3c7" },
  leave_approved:         { icon: <FiCheckCircle size={12} />, color: "#16a34a", bg: "#dcfce7" },
  leave_rejected:         { icon: <FiXCircle size={12} />,     color: "#dc2626", bg: "#fee2e2" },
  leave_cancelled:        { icon: <FiSlash size={12} />,       color: "#6b7280", bg: "#f3f4f6" },
};

const defaultConfig = { icon: <FiBell size={12} />, color: "#7c3aed", bg: "#f5f3ff" };

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

// ─── Notification Card ───
function NotiCard({ n, onRead, onNavigate }: { n: Notification; onRead: (id: string) => void; onNavigate: (n: Notification) => void }) {
  const config = typeConfig[n.type] || defaultConfig;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={() => {
        if (!n.is_read) onRead(n.id);
        onNavigate(n);
      }}
      className={`relative px-3 py-3 cursor-pointer transition-colors hover:bg-gray-50/50`}
      style={{
        borderBottom: "1px solid var(--border-light)",
        backgroundColor: !n.is_read ? "rgba(124,58,237,0.03)" : "transparent",
      }}
    >
      {!n.is_read && (
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: "#7c3aed" }} />
      )}

      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + Time */}
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[12px] font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {n.title}
            </span>
            <span className="text-[9px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>
              {timeAgo(n.created_at)}
            </span>
          </div>

          {/* Message */}
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {n.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}


const typeToTab: Record<string, string> = {
  leave_applied: "teamLeaves",           // AM sees pending requests
  leave_manager_approved: "myLeaves",    // USER sees their leave status
  leave_manager_rejected: "myLeaves",    // USER sees rejection
  leave_pending_admin: "teamLeaves",     // SP sees manager-approved requests
  leave_approved: "myLeaves",            // USER sees final approval
  leave_rejected: "myLeaves",            // USER sees final rejection
  leave_cancelled: "teamLeaves",         // AM sees cancellation
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role?.toLowerCase();

  const handleNavigate = (n: Notification) => {
    const tab = typeToTab[n.type];
    if (tab) {
      const rolePath = role === "sp" ? "sp" : role === "am" ? "am" : "user";
      navigate(`/${rolePath}/attendance?tab=${tab}`);
      setOpen(false);
    }
  };

  // Fetch unread count only when panel is opened
  const loadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      /* silent */
    }
  }, []);

  // Fetch notifications when panel opens
  const loadNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetchNotifications({ page: p, limit: 20 });
      if (p === 1) {
        setNotifications(res.data || []);
      } else {
        setNotifications((prev) => [...prev, ...(res.data || [])]);
      }
      setTotalPages(res.totalPages || 1);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setPage(1);
      loadCount();
      loadNotifications(1);
    }
  }, [open, loadCount, loadNotifications]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* silent */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage);
  };

  return (
    <>
      {/* Bell */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg transition-colors"
        style={{
          color: open ? "var(--text-primary)" : "var(--text-muted)",
          backgroundColor: open ? "var(--bg-hover)" : "transparent",
        }}
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[9px] font-bold text-white rounded-full"
            style={{ backgroundColor: "#AD21DB", boxShadow: "0 0 0 2px var(--bg-card)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Sidebar Panel */}
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
              <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiBell size={14} className="text-[#AD21DB]" />
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-[2px] rounded-full"
                        style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-semibold hover:underline"
                        style={{ color: "#7c3aed" }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      className="p-1 rounded transition-colors hover:bg-gray-100"
                      style={{ color: "var(--text-faint)" }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <span style={{ fontSize: 12, color: "var(--text-faint)" }}>Loading...</span>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <NotiCard key={n.id} n={n} onRead={handleRead} onNavigate={handleNavigate} />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: "var(--text-faint)" }}
                      >
                        <FiInbox size={24} className="mb-2" />
                        <p className="text-xs">No notifications yet</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {/* Load More */}
                {page < totalPages && notifications.length > 0 && (
                  <div className="flex justify-center py-3">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="text-[11px] font-semibold px-4 py-1.5 rounded-lg transition-colors"
                      style={{
                        color: "#7c3aed",
                        backgroundColor: "#f5f3ff",
                        border: "none",
                        cursor: "pointer",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
