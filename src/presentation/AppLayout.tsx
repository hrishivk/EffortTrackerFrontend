import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiLogOut, FiUser, FiChevronDown, FiSun, FiMoon } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
// import NotificationPanel from "./NotificationPanel";
import logo from "../assets/img/logo2.png.png";
import prLogo from "../assets/img/prLogo.png";
import { useAppSelector, type AppDispatch } from "../store/configureStore";
import { useDispatch } from "react-redux";
import { reset } from "../store/authSlice";
import { authLogout } from "../core/actions/action";
import { useTheme } from "../contexts/ThemeContext";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector((state) => state.user);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => setProfileOpen(false), [location]);

  const handleLogout = async () => {
    const response = await authLogout(user?.id as string);
    if (response.success) {
      await dispatch(reset());
      window.location.href = "/";
    }
  };

  const displayName = user?.fullName
    ? user.fullName.charAt(0).toUpperCase() +
      user.fullName.slice(1).toLowerCase()
    : "User";

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      {/* ─── Navbar ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[60px]" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="md:hidden p-2 -ml-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <FiMenu size={20} />
            </button>

            <div className="flex items-center gap-2">
              <img src={logo} alt="logo" className="h-9 w-9 object-contain" />
              <span className="hidden sm:block text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                RhythmRx <span className="text-[#AD21DB]">Effort Tracker</span>
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
            </button>

            {/* Notification Bell - visible for AM role */}
            {/* {(user?.role === "AM" || user?.role === "SP") && (
              <NotificationPanel />
            )} */}

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full px-1.5 py-1.5 sm:pr-3 transition-colors"
              style={{ backgroundColor: profileOpen ? "var(--bg-hover)" : "transparent" }}
            >
              <img
                src={prLogo}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="hidden sm:block text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                {displayName}
              </span>
              <FiChevronDown
                size={14}
                className={`hidden sm:block transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
                style={{ color: "var(--text-faint)" }}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg z-50 overflow-hidden"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#AD21DB] flex items-center justify-center text-white text-sm font-bold">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {displayName}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to={`/profile/${user?.id}`}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <FiUser size={16} style={{ color: "var(--text-faint)" }} />
                      Show Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
      </header>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <main
        className={`pt-[60px] min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[220px] lg:ml-[250px] xl:ml-[280px]"
        }`}
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
