import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiX,
  FiLayers,
  FiChevronsLeft,
  FiChevronsRight,
  FiCalendar,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { useAppSelector } from "../store/configureStore";
import logo from "../assets/img/logo2.png.png";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const getSections = (role?: string): NavSection[] => {
  const icon = (El: React.ElementType) => <El size={18} />;

  if (role === "SP") {
    return [
      {
        title: "Main",
        items: [
          { to: "/sp/dashboard", label: "Dashboard", icon: icon(FiGrid) },
          { to: "/sp/attendance", label: "Attendance", icon: icon(FiCalendar) },
        ],
      },
      {
        title: "Manage",
        items: [
          { to: "/sp/userMangement", label: "User Management", icon: icon(FiUsers) },
          { to: "/sp/domain-project", label: "Domains & Projects", icon: icon(FiLayers) },
        ],
      },
    ];
  }

  if (role === "AM") {
    return [
      {
        title: "Main",
        items: [
          { to: "/am/dashboard", label: "Dashboard", icon: icon(FiGrid) },
          { to: "/am/attendance", label: "Attendance", icon: icon(FiCalendar) },
        ],
      },
      {
        title: "Manage",
        items: [
          { to: "/am/TeamManagement", label: "Team Management", icon: icon(FiUsers) },
          { to: "/am/domain-project", label: "Domains & Projects", icon: icon(FiLayers) },
        ],
      },
    ];
  }

  if (role === "USER" || role === "DEVLOPER") {
    return [
      {
        title: "Main",
        items: [
          { to: "/user/dashboard", label: "Dashboard", icon: icon(FiGrid) },
          { to: "/user/attendance", label: "Attendance", icon: icon(FiCalendar) },
        ],
      },
    ];
  }

  return [];
};

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}) => {
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const { pathname } = useLocation();

  const sections = getSections(role);

  /**
   * `isCollapsed` is passed explicitly so the mobile drawer always renders the
   * full-width layout, even while the desktop sidebar is collapsed.
   * `pillId` keeps the framer-motion layout animation scoped per instance.
   */
  const renderInner = (isCollapsed: boolean, pillId: string) => (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* ─── Brand ─── */}
      <div
        className={`flex items-center h-[64px] shrink-0 ${
          isCollapsed ? "justify-center px-2" : "gap-2.5 px-4"
        }`}
      >
        <img
          src={logo}
          alt="RhythmRx"
          className="h-9 w-9 shrink-0 object-contain"
        />

        {!isCollapsed && (
          <div className="min-w-0 flex-1 leading-[1.15]">
            <p
              className="truncate text-[13px] font-bold"
              style={{ color: "var(--text-primary)", margin: "0rem" }}
            >
              RhythmRx
            </p>
            <p
              className="truncate text-[13px] font-bold"
              style={{ color: "var(--text-primary)", margin: "0rem" }}
            >
              Effort Tracker
            </p>
          </div>
        )}

        {!isCollapsed && (
          <button
            onClick={onClose}
            title="Close menu"
            className="md:hidden flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-faint)",
            }}
          >
            <FiX size={15} />
          </button>
        )}
      </div>

      {/* ─── Nav sections ─── */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            {isCollapsed ? (
              <div
                className="mx-auto mb-2 h-px w-6"
                style={{ backgroundColor: "var(--border-light)" }}
              />
            ) : (
              <p
                className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] select-none"
                style={{ color: "var(--text-faint)" }}
              >
                {section.title}
              </p>
            )}

            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const isActive = pathname
                  .toLowerCase()
                  .startsWith(item.to.toLowerCase());

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 rounded-xl text-[14px] font-medium transition-colors duration-150 ${
                      isCollapsed
                        ? "justify-center px-0 py-2.5"
                        : "px-3 py-2.5"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId={pillId}
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background:
                            "linear-gradient(135deg, #AD21DB 0%, #7C3AED 50%, #4F46E5 100%)",
                          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.28)",
                        }}
                        transition={{
                          type: "spring",
                          damping: 30,
                          stiffness: 350,
                        }}
                      />
                    )}

                    <span
                      className="relative z-10 shrink-0 transition-colors duration-150"
                      style={{
                        color: isActive ? "#ffffff" : "var(--text-faint)",
                      }}
                    >
                      {item.icon}
                    </span>

                    {!isCollapsed && (
                      <span
                        className={`relative z-10 truncate transition-colors duration-150 ${
                          isActive ? "font-semibold" : ""
                        }`}
                        style={{
                          color: isActive ? "#ffffff" : "var(--text-secondary)",
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Collapse toggle — desktop only ─── */}
      <div
        className="hidden md:block shrink-0 px-3 py-2"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex w-full items-center gap-2 rounded-xl py-2 text-[13px] font-medium transition-colors ${
            isCollapsed ? "justify-center px-0" : "px-3"
          }`}
          style={{ color: "var(--text-faint)" }}
        >
          {isCollapsed ? (
            <FiChevronsRight size={18} />
          ) : (
            <>
              <FiChevronsLeft size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:block fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${
          collapsed ? "w-[76px]" : "w-[240px] xl:w-[260px]"
        }`}
        style={{
          backgroundColor: "var(--bg-card)",
          borderRight: "1px solid var(--border-light)",
        }}
      >
        {renderInner(collapsed, "sidebar-pill-desktop")}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed top-0 left-0 w-[260px] h-screen z-50 md:hidden shadow-xl"
            >
              {renderInner(false, "sidebar-pill-mobile")}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
