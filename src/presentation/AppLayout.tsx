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

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Where the sidebar's width is remembered.
 *
 * It has to be remembered somewhere outside the component: `<Routes>` is keyed
 * on the pathname so the page can animate between routes, which remounts
 * everything under it on every navigation — including this layout. A collapsed
 * sidebar would spring back open the moment you clicked a nav row.
 *
 * Storage also makes it survive a reload, which is what anyone who narrows a
 * sidebar expects of it anyway.
 */
const SIDEBAR_KEY = "krew:sidebar-collapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    // Private windows and blocked site data: the sidebar simply opens wide.
    return false;
  }
};

const DASHBOARD_PATHS: Record<string, string> = {
  SP: "/sp/dashboard",
  AM: "/am/dashboard",
  USER: "/user/dashboard",
  DEVLOPER: "/user/dashboard",
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Read at mount, not in an effect, so a remount paints at the right width
  // rather than opening wide and snapping shut.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);
  const { user } = useAppSelector((state) => state.user);

  /**
   * The 2.0 release. The first sign-in after it gets a banner across the top
   * of the page; dismissing it, or opening the full note from it, retires it
   * for good. The header pill opens the note any time after.
   */
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

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      // Nothing to do: the preference just does not outlive this page.
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
      // The session is being torn down anyway — send the user to login.
      await dispatch(reset());
      window.location.href = "/";
    }
  };

  // Sidebar occupies the full viewport height, so the header and main content
  // are both inset by its current width.
  // The header spans the full viewport and the sidebar card sits below it, so
  // only the main content is offset — by the card's width plus both 12px
  // gutters. Keep these in step with --sb-gap in _sidebar.scss.
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

      {/* ─── Header ─── */}
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

          {/* Right controls */}
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

      {/*
        * The presence dock — the bubble in the bottom-right corner and the
        * roster it opens. Parked at the user's request until they say
        * otherwise: uncomment the line below to put it back, nothing else.
        *
        * <PresenceDock />
        */}
    </div>
  );
};

export default AppLayout;
