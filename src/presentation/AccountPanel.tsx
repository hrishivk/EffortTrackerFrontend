import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiBell, FiLogOut, FiMoon, FiSun, FiUser } from "react-icons/fi";
import { fetchUser } from "../core/actions/spAction";
import { fetchUnreadCount } from "../core/actions/notificationAction";
import { openNotifications } from "../shared/utils/appEvents";
import { useTheme } from "../contexts/ThemeContext";
import { useAppSelector } from "../store/configureStore";
import type { ProfileData } from "../shared/types/Profile";

interface AccountPanelProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
  /** Where "My Profile" goes — the role's dashboard on its profile tab. */
  profilePath: string;
}

export default function AccountPanel({
  open,
  onClose,
  onLogout,
  profilePath,
}: AccountPanelProps) {
  const { user } = useAppSelector((state) => state.user);
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [unread, setUnread] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  /*
   * Read on first open rather than on mount, and once rather than every open:
   * the panel is chrome, so there is no reason for it to cost anything until
   * someone actually looks at it.
   *
   * Neither call is allowed to break the panel — a failed profile read just
   * falls back to the name and email already in the session, and a failed
   * count leaves the badge off.
   */
  const loaded = useRef(false);

  useEffect(() => {
    if (!open || loaded.current) return;
    loaded.current = true;

    void (async () => {
      const [me, count] = await Promise.allSettled([
        fetchUser(),
        fetchUnreadCount(),
      ]);
      if (me.status === "fulfilled") setProfile(me.value?.data || me.value);
      if (count.status === "fulfilled") {
        setUnread(count.value.data?.unreadCount || 0);
      }
    })();
  }, [open]);

  const displayName = user?.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "User";
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const email = profile?.email || user?.email;

  const signOut = async () => {
    setSigningOut(true);
    try {
      await onLogout();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="acp"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {/* Who you are — name and email, nothing else */}
          <div className="acp__head">
            <span className="acp__avatar">
              {profile?.image ? (
                <img src={profile.image} alt={displayName} />
              ) : (
                initial
              )}
            </span>
            <span className="acp__id">
              <b>{displayName}</b>
              {email && <small>{email}</small>}
            </span>
          </div>

          <div className="acp__menu">
            <Link to={profilePath} onClick={onClose} className="acp__row">
              <FiUser size={15} />
              My Profile
            </Link>

            {/*
             * The design's middle row was "Settings". There is no settings
             * page to send anyone to, so the slot does the one preference the
             * app actually has rather than pointing at nothing.
             */}
            <button type="button" className="acp__row" onClick={toggleTheme}>
              {theme === "light" ? <FiMoon size={15} /> : <FiSun size={15} />}
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>

            <button
              type="button"
              className="acp__row"
              onClick={() => {
                onClose();
                openNotifications();
              }}
            >
              <FiBell size={15} />
              Notifications
              {unread > 0 && (
                <span className="acp__badge">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          </div>

          <div className="acp__menu acp__menu--last">
            <button
              type="button"
              className="acp__row acp__row--danger"
              onClick={signOut}
              disabled={signingOut}
            >
              <FiLogOut size={15} />
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
