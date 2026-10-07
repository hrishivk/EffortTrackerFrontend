import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { FiMenu, FiSun, FiMoon, FiChevronDown, FiStar } from "react-icons/fi";
import { useDispatch } from "react-redux";
import Sidebar from "./Sidebar";
import AccountPanel from "./AccountPanel";
import NotificationPanel from "./NotificationPanel";
import { AnimatePresence } from "framer-motion";
import WhatsNew, {
  APP_VERSION,
  WhatsNewBanner,
  hasSeenWhatsNew,
  markWhatsNewSeen,
} from "./WhatsNew";
import { useAppSelector, type AppDispatch } from "../store/configureStore";
import { reset } from "../store/authSlice";
import { authLogout } from "../core/actions/action";
import { useTheme } from "../contexts/ThemeContext";
import { dashboardPathFor } from "../shared/utils/roles";

interface AppLayoutProps {
  children: ReactNode;
}

const SIDEBAR_KEY = "krew:sidebar-collapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);
  const { user } = useAppSelector((state) => state.user);

  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [whatsNewSeen, setWhatsNewSeen] = useState(hasSeenWhatsNew);
  const retireBanner = () => {
    markWhatsNewSeen();
    setWhatsNewSeen(true);
  };
  const openWhatsNew = () => {
    setWhatsNewOpen(true);
    retireBanner();
  };
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

  const profilePath = `${dashboardPathFor(user?.role)}?tab=profile`;

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

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
    }
  }, [sidebarCollapsed]);

  const handleLogout = async () => {
    try {
      const response = await authLogout(user?.id as string);
      if (response.success) {
        await dispatch(reset());
        window.location.href = "/";
      }
    } catch {
      await dispatch(reset());
      window.location.href = "/";
    }
  };

  const mainInset = sidebarCollapsed
    ? "md:ml-[86px]"
    : "md:ml-[264px] xl:ml-[272px]";

  return (
    <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <header className="app-header fixed top-0 left-0 right-0 z-30 h-[64px]">
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

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              className={`wn-pill${whatsNewSeen ? "" : " wn-pill--new"}`}
              title={`What's new in RX KREW ${APP_VERSION}`}
              onClick={openWhatsNew}
            >
              <FiStar size={13} />
              <span className="wn-pill__label">What&rsquo;s new</span>
              <span className="wn-pill__ver">{APP_VERSION}</span>
            </button>

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

              <AccountPanel
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onLogout={handleLogout}
                profilePath={profilePath}
              />
            </div>
          </div>
        </div>
      </header>

      <WhatsNew open={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} role={user?.role} />

      <main
        className={`min-h-screen pt-[64px] transition-all duration-300 ${mainInset}`}
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <AnimatePresence initial={false}>
          {!whatsNewSeen && user && (
            <WhatsNewBanner
              key="whats-new"
              role={user.role}
              onOpen={openWhatsNew}
              onDismiss={retireBanner}
            />
          )}
        </AnimatePresence>
        {children}
      </main>

    </div>
  );
};

export default AppLayout;
