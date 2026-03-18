import { useState, type ReactNode } from "react";
import { FiMenu, FiSun, FiMoon } from "react-icons/fi";
import Sidebar from "./Sidebar";
// import NotificationPanel from "./NotificationPanel";
import logo from "../assets/img/logo2.png.png";
import prLogo from "../assets/img/prLogo.png";
import { useAppSelector } from "../store/configureStore";
import { useTheme } from "../contexts/ThemeContext";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAppSelector((state) => state.user);
  const { theme, toggleTheme } = useTheme();

  const displayName = user?.fullName
    ? user.fullName.charAt(0).toUpperCase() +
      user.fullName.slice(1).toLowerCase()
    : "User";

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

          <div className="flex items-center gap-2 px-1.5 py-1.5 sm:pr-3">
            <img
              src={prLogo}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="hidden sm:block text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              {displayName}
            </span>
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
