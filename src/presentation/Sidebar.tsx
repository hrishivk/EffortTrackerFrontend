import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiX,
  FiLayers,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import { useAppSelector } from "../store/configureStore";
import { AnimatePresence, motion } from "framer-motion";

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

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}) => {
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const { pathname } = useLocation();

  const getLinks = (): NavItem[] => {
    if (role === "AM") {
      return [
        { to: "/am/Dashboard", label: "Dashboard", icon: <FiGrid size={20} /> },
        {
          to: "/am/TeamManagement",
          label: "Team Management",
          icon: <FiUsers size={20} />,
        },
        {
          to: "/am/domain-project",
          label: "Domains & Projects",
          icon: <FiLayers size={20} />,
        },
      ];
    }
    if (role === "SP") {
      return [
        { to: "/sp/dashboard", label: "Dashboard", icon: <FiGrid size={20} /> },
        {
          to: "/sp/userMangement",
          label: "User Management",
          icon: <FiUsers size={20} />,
        },
        {
          to: "/sp/domain-project",
          label: "Domains & Projects",
          icon: <FiLayers size={20} />,
        },
      ];
    }
    if (role === "USER" || role === "DEVLOPER") {
      return [
        { to: "/user/dashboard", label: "Dashboard", icon: <FiGrid size={20} /> },
      ];
    }
    return [];
  };

  const links = getLinks();

  const sidebarInner = (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="flex justify-end p-3 md:hidden">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-faint)" }}
        >
          <FiX size={20} />
        </button>
      </div>
      <nav className="flex-1 px-3 pt-4 md:pt-5 pb-4 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold tracking-[0.15em] uppercase select-none" style={{ color: "var(--text-faint)" }}>
            Menu
          </p>
        )}
        <div className="flex flex-col gap-1">
          {links.map((item) => {
            const isActive = pathname
              .toLowerCase()
              .startsWith(item.to.toLowerCase());

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 rounded-xl text-[13px] lg:text-[14px] xl:text-[15px] font-medium transition-colors duration-150 ${
                  collapsed
                    ? "justify-center px-0 py-3"
                    : "px-3 py-2.5 lg:py-3"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, #AD21DB 0%, #7C3AED 50%, #4F46E5 100%)",
                    }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  />
                )}

                <span
                  className={`relative z-10 transition-colors duration-150`}
                  style={{ color: isActive ? "#ffffff" : "var(--text-faint)" }}
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span
                    className={`relative z-10 transition-colors duration-150 ${
                      isActive ? "font-semibold" : ""
                    }`}
                    style={{ color: isActive ? "#ffffff" : "var(--text-muted)" }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Collapse toggle button — desktop only */}
      <div className="hidden md:flex p-3" style={{ borderTop: "1px solid var(--border-light)" }}>
        <button
          onClick={onToggleCollapse}
          className={`flex items-center gap-2 w-full rounded-xl py-2.5 transition-colors ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
          style={{ color: "var(--text-faint)" }}
        >
          {collapsed ? (
            <FiChevronsRight size={20} />
          ) : (
            <>
              <FiChevronsLeft size={20} />
              <span className="text-sm font-medium">Collapse</span>
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
        className={`hidden md:block fixed left-0 top-[60px] h-[calc(100vh-60px)] transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[220px] lg:w-[250px] xl:w-[280px]"
        }`}
        style={{ backgroundColor: "var(--bg-card)", borderRight: "1px solid var(--border-light)" }}
      >
        {sidebarInner}
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
              {sidebarInner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
