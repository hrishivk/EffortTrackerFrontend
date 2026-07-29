import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiSun,
  FiMoon,
  FiChevronDown,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import NotificationPanel from "./NotificationPanel";
import { useAppSelector, type AppDispatch } from "../store/configureStore";
import { reset } from "../store/authSlice";
import { authLogout } from "../core/actions/action";
import { useTheme } from "../contexts/ThemeContext";

interface AppLayoutProps {
  children: ReactNode;
}

const DASHBOARD_PATHS: Record<string, string> = {
  SP: "/sp/dashboard",
  AM: "/am/dashboard",
  USER: "/user/dashboard",
  DEVLOPER: "/user/dashboard",
};

const ROLE_LABELS: Record<string, string> = {
  SP: "Super Admin",
  AM: "Account Manager",
  USER: "Team Member",
  DEVLOPER: "Developer",
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAppSelector((state) => state.user);
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { pathname, search } = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName
    ? user.fullName.charAt(0).toUpperCase() +
      user.fullName.slice(1).toLowerCase()
    : "User";
  const initial = displayName.charAt(0).toUpperCase();

  const profilePath = `${DASHBOARD_PATHS[user?.role ?? ""] ?? "/"}?tab=profile`;

  // Close the account menu on outside click, and whenever the route changes.
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname, search]);

  const handleLogout = async () => {
    try {
      const response = await authLogout(user?.id as string);
      if (response.success) {
        await dispatch(reset());
        window.location.href = "/";
      }
    } catch {
      // The session is being torn down anyway — send the user to login.
      await dispatch(reset());
      window.location.href = "/";
    }
  };

  // Sidebar occupies the full viewport height, so the header and main content
  // are both inset by its current width.
  const contentInset = sidebarCollapsed
    ? "md:left-[76px]"
    : "md:left-[240px] xl:left-[260px]";
  const mainInset = sidebarCollapsed
    ? "md:ml-[76px]"
    : "md:ml-[240px] xl:ml-[260px]";

  return (
    <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* ─── Header ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 h-[64px] transition-all duration-300 ${contentInset}`}
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex h-full items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="md:hidden -ml-2 shrink-0 rounded-lg p-2 transition-colors"
            style={{ color: "var(--text-muted)" }}
            title="Open menu"
          >
            <FiMenu size={20} />
          </button>

          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 transition-colors"
              style={{ color: "var(--text-muted)" }}
              title={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            >
              {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
            </button>

            <NotificationPanel />

            {/* Account menu — profile and sign out */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                title={`${displayName} — account`}
                className="flex items-center gap-1.5 rounded-full p-1 transition-colors"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #AD21DB 0%, #7C3AED 100%)",
                  }}
                >
                  {initial || "U"}
                </span>
                <FiChevronDown
                  size={15}
                  className={`shrink-0 transition-transform duration-200 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                  style={{ color: "var(--text-faint)" }}
                />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-[200px] overflow-hidden rounded-xl z-50"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-light)",
                      boxShadow: "0 8px 24px rgba(16, 24, 40, 0.14)",
                    }}
                  >
                    <div
                      className="px-3.5 py-2.5"
                      style={{ borderBottom: "1px solid var(--border-light)" }}
                    >
                      <p
                        className="truncate text-[13px] font-semibold"
                        style={{ color: "var(--text-primary)", margin: "0rem" }}
                      >
                        {displayName}
                      </p>
                      <p
                        className="truncate text-[11px]"
                        style={{ color: "var(--text-faint)", margin: "0rem" }}
                      >
                        {ROLE_LABELS[user?.role ?? ""] ?? "Member"}
                      </p>
                    </div>

                    <Link
                      to={profilePath}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <FiUser size={15} style={{ color: "var(--text-faint)" }} />
                      My Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium"
                      style={{
                        color: "#dc2626",
                        borderTop: "1px solid var(--border-light)",
                      }}
                    >
                      <FiLogOut size={15} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main
        className={`min-h-screen pt-[64px] transition-all duration-300 ${mainInset}`}
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
