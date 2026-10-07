import { useState } from "react";
import { useLocation } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { useAppSelector } from "../store/configureStore";
import { visibleWorkspaces } from "../modules/workspace/data/workspaceHelpers";
import { useSnackbar } from "../contexts/SnackbarContext";
import { dashboardPathFor } from "../shared/utils/roles";
import { ROLE_LABELS, getSections } from "./sidebar/sidebarConfig";
import { useSidebarWorkspaces } from "./sidebar/useSidebarWorkspaces";
import NavSections from "./sidebar/NavSections";
import WorkspaceTree from "./sidebar/WorkspaceTree";
import { SidebarBrand, SidebarUserCard } from "./sidebar/SidebarChrome";
import type { SidebarProps, ToggleMap } from "./sidebar/types";

export type { SidebarProps, NavItem, NavSection } from "./sidebar/types";

const useToggleMap = () => {
  const [map, setMap] = useState<ToggleMap>({});
  const toggle = (key: string) => setMap((c) => ({ ...c, [key]: !c[key] }));
  return [map, toggle] as const;
};

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}) => {
  const { user } = useAppSelector((state) => state.user);
  const { showSnackbar } = useSnackbar();
  const role = user?.role;
  const treeInSidebar = !(role === "SP" || role === "AM");
  const { pathname, search } = useLocation();
  const [closed, toggleSection] = useToggleMap();
  const [shutBranches, toggleBranch] = useToggleMap();
  const workspaceState = useSidebarWorkspaces(pathname, search);

  const sections = getSections(role);
  const visible = visibleWorkspaces(workspaceState.workspaces, user ?? undefined);

  const displayName = user?.fullName
    ? user.fullName.charAt(0).toUpperCase() + user.fullName.slice(1)
    : "User";
  const roleLabel = ROLE_LABELS[role ?? ""] ?? "Member";
  const profilePath = `${dashboardPathFor(role)}?tab=profile`;
  const rolePath = `/${(role ?? "").toLowerCase()}`;
  const workspacePath = (id: string) =>
    `${rolePath}/workspace?ws=${encodeURIComponent(id)}`;
  const roomPath = (wsId: string, roomId: string) =>
    `${rolePath}/room?ws=${encodeURIComponent(wsId)}&room=${encodeURIComponent(roomId)}`;
  const notify = (message: string) => showSnackbar({ message, severity: "info" });

  const renderInner = (isCollapsed: boolean, pillId: string) => {
    const view = { isCollapsed, pillId, onClose };
    return (
      <div
        className="sb flex flex-col h-full"
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "inherit",
          overflow: "hidden",
        }}
      >
        <SidebarBrand {...view} onToggleCollapse={onToggleCollapse} />

        <nav className={`sb-scroll pb-3 ${isCollapsed ? "px-2.5" : "px-3"}`}>
          <NavSections
            {...view}
            sections={sections}
            pathname={pathname}
            closed={closed}
            onToggleSection={toggleSection}
            shutBranches={shutBranches}
            onToggleBranch={toggleBranch}
          />

          {treeInSidebar && !isCollapsed && (
            <>
              <div className="sb-heading">Workspaces</div>
              <WorkspaceTree
                pillId={pillId}
                onClose={onClose}
                visible={visible}
                user={user ?? undefined}
                state={workspaceState}
                here={`${pathname}${search}`}
                workspacePath={workspacePath}
                roomPath={roomPath}
                notify={notify}
              />
            </>
          )}
        </nav>

        <SidebarUserCard
          {...view}
          displayName={displayName}
          roleLabel={roleLabel}
          profilePath={profilePath}
        />
      </div>
    );
  };

  return (
    <>
      <aside
        className={`sb-panel hidden md:block z-40 ${
          collapsed ? "w-[62px]" : "w-[240px] xl:w-[248px]"
        }`}
      >
        {renderInner(collapsed, "sidebar-pill-desktop")}

        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="sb-handle"
          >
            <FiChevronRight size={13} />
          </button>
        )}
      </aside>

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
