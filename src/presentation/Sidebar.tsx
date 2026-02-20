import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiCheckSquare,
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
          to: "/taskList",
          label: "Task List",
          icon: <FiCheckSquare size={20} />,
        },
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
        { to: "/*/dashboard", label: "Dashboard", icon: <FiGrid size={20} /> },
        {
          to: "/taskList",
          label: "Task List",
          icon: <FiCheckSquare size={20} />,
        },
      ];
    }
    return [];
  };

  const links = getLinks();

  const sidebarInner = (
    <div className="flex flex-col h-full bg-white">
      <div className="flex justify-end p-3 md:hidden">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>
      <nav className="flex-1 px-3 pt-4 md:pt-5 pb-4 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold tracking-[0.15em] uppercase text-gray-400 select-none">
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
                className={`relative flex items-center gap-3 rounded-xl text-[15px] font-medium transition-colors duration-150 ${
                  collapsed
                    ? "justify-center px-0 py-3"
                    : "px-3 py-3"
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
                  className={`relative z-10 transition-colors duration-150 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span
                    className={`relative z-10 transition-colors duration-150 ${
                      isActive
                        ? "text-white font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
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
      <div className="hidden md:flex border-t border-gray-200 p-3">
        <button
          onClick={onToggleCollapse}
          className={`flex items-center gap-2 w-full rounded-xl py-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
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
        className={`hidden md:block fixed left-0 top-[60px] h-[calc(100vh-60px)] bg-white border-r border-gray-200 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[280px]"
        }`}
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
