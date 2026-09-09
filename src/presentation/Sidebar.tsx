import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiX,
  FiLayers,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiChevronsLeft,
  FiPlus,
  FiHome,
  FiLock,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { useAppSelector } from "../store/configureStore";
import logo from "../assets/img/logo2.png.png";
import { fetchWorkspace, fetchWorkspaces } from "../core/actions/workspaceAction";
import {
  WORKSPACES_CHANGED,
  visibleWorkspaces,
  workspaceGate,
} from "../modules/workspace/data/workspaceHelpers";
import { useSnackbar } from "../contexts/SnackbarContext";
import type { Workspace } from "../modules/user/types";

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

const DASHBOARD_PATHS: Record<string, string> = {
  SP: "/sp/dashboard",
  AM: "/am/dashboard",
  USER: "/user/dashboard",
  DEVLOPER: "/user/dashboard",
};

/** The slide the active highlight uses, wherever it lands. */
const TREE_SPRING = { type: "spring", damping: 30, stiffness: 350 } as const;

const WS_STATUS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
};

const ROLE_LABELS: Record<string, string> = {
  SP: "Super Admin",
  AM: "Account Manager",
  USER: "Team Member",
  DEVLOPER: "Developer",
};

const getSections = (role?: string): NavSection[] => {
  const icon = (El: React.ElementType) => <El size={15} />;

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
          { to: "/sp/domain-project", label: "Departments & Projects", icon: icon(FiLayers) },
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
          { to: "/am/domain-project", label: "Departments & Projects", icon: icon(FiLayers) },
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
  const { showSnackbar } = useSnackbar();
  // Creating a workspace is a manager's job, so the + is theirs.
  const canCreate = user?.role === "SP" || user?.role === "AM";
  const role = user?.role;
  const { pathname, search } = useLocation();
  /** Sections the user has folded away, by title. */
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  /** One workspace is expanded at a time, by id. */
  const [openWs, setOpenWs] = useState<string | null>(null);
  /** Whether that workspace's Rooms branch is unfolded. */
  const [roomsOpen, setRoomsOpen] = useState(true);
  /**
   * Full trees, by workspace id. `GET /workspaces` returns no rooms, so the
   * room branch needs a second read — cached here so re-expanding is instant.
   */
  const [trees, setTrees] = useState<Record<string, Workspace>>({});

  const loadWorkspaces = useCallback(async () => {
    try {
      setWorkspaces(await fetchWorkspaces());
    } catch {
      // The sidebar is no place for an error; the list just stays empty.
      setWorkspaces([]);
    }
  }, []);

  /**
   * Re-read on each navigation, so a workspace just created appears without
   * any extra wiring — leaving the Create Workspace page is itself one.
   */
  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces, pathname]);

  /**
   * Something elsewhere changed the tree. The cached per-workspace trees go
   * with the list, because a cached locked stub is exactly what would survive
   * an unlock and keep the branch shut.
   */
  useEffect(() => {
    const onChanged = () => {
      setTrees({});
      void loadWorkspaces();
    };
    window.addEventListener(WORKSPACES_CHANGED, onChanged);
    return () => window.removeEventListener(WORKSPACES_CHANGED, onChanged);
  }, [loadWorkspaces]);

  const [loadingTree, setLoadingTree] = useState(false);

  /**
   * The workspace whose page is open, so its branch expands on its own.
   *
   * Without this, arriving at a workspace left the sidebar collapsed and the
   * only way to see its rooms was to find the 16px caret — the name is a link,
   * so clicking the obvious target navigated instead of expanding.
   *
   * The room page carries `?ws=<workspace>&id=<room>`, so `ws` has to win over
   * `id`; on the workspace page only `id` is present.
   */
  const activeWsId = useMemo(() => {
    // Only on the pages that carry a workspace id. Other screens use `?id=`
    // for their own records, and reading it here would fire a doomed fetch.
    const onWorkspacePage = ["/workspace", "/room", "/room-tasks"].some(
      (suffix) => pathname.endsWith(suffix)
    );
    if (!onWorkspacePage) return "";
    const q = new URLSearchParams(search);
    return q.get("ws") || q.get("id") || "";
  }, [pathname, search]);

  useEffect(() => {
    if (activeWsId) setOpenWs(activeWsId);
  }, [activeWsId]);

  /** Loads the open workspace's rooms, once, and keeps them cached. */
  useEffect(() => {
    if (!openWs || trees[openWs]) return;
    let live = true;
    setLoadingTree(true);
    void fetchWorkspace(openWs)
      .then((tree) => {
        if (live) setTrees((t) => ({ ...t, [openWs]: tree }));
      })
      .catch(() => {
        // Leaves the branch empty rather than breaking the sidebar.
      })
      .finally(() => {
        if (live) setLoadingTree(false);
      });
    return () => {
      live = false;
    };
  }, [openWs, trees]);

  const sections = getSections(role);

  const displayName = user?.fullName
    ? user.fullName.charAt(0).toUpperCase() + user.fullName.slice(1)
    : "User";
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = ROLE_LABELS[role ?? ""] ?? "Member";
  const profilePath = `${DASHBOARD_PATHS[role ?? ""] ?? "/"}?tab=profile`;
  const rolePath = `/${(role ?? "").toLowerCase()}`;
  const setupPath = `${rolePath}/workspace-setup`;
  const workspacePath = (id: string) =>
    `${rolePath}/workspace?id=${encodeURIComponent(id)}`;
  const roomPath = (wsId: string, roomId: string) =>
    `${rolePath}/room?ws=${encodeURIComponent(wsId)}&id=${encodeURIComponent(roomId)}`;
  const here = `${pathname}${search}`;

  const renderInner = (isCollapsed: boolean, pillId: string) => (
    <div
      className="sb flex flex-col h-full"
      style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "inherit",
        overflow: "hidden",
      }}
    >
      {/* ─── Brand ─── */}
      <div
        className={`flex items-center h-[56px] shrink-0 ${
          isCollapsed ? "justify-center px-2" : "gap-2.5 px-4"
        }`}
      >
        <img
          src={logo}
          alt="KREW"
          className="h-7 w-7 shrink-0 object-contain"
        />

        {!isCollapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[14.5px] font-bold tracking-[0.02em]"
                style={{ color: "var(--text-primary)", margin: 0 }}
              >
                KREW
              </p>
            </div>

            {/* Collapse on desktop, close the drawer on mobile. */}
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ color: "var(--text-faint)" }}
            >
              <FiChevronsLeft size={15} />
            </button>
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
          </>
        )}
      </div>

      {/* ─── Nav sections ─── */}
      <nav className={`sb-scroll pb-3 ${isCollapsed ? "px-2.5" : "px-3"}`}>
        {sections.map((section, sectionIdx) => {
          const isShut = !isCollapsed && !!closed[section.title];
          return (
            <div key={section.title} className="mb-4 last:mb-0">
              {isCollapsed ? (
                // A hairline stands in for the caption at rail width.
                sectionIdx > 0 && (
                  <div
                    className="mx-auto mb-3 h-px w-6"
                    style={{ backgroundColor: "var(--border-light)" }}
                  />
                )
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setClosed((c) => ({ ...c, [section.title]: !c[section.title] }))
                  }
                  className={`sb-caption${isShut ? " sb-caption--closed" : ""}`}
                  title={isShut ? `Show ${section.title}` : `Hide ${section.title}`}
                >
                  {section.title}
                  <span className="sb-caption__chevron">
                    <FiChevronDown size={11} />
                  </span>
                </button>
              )}

              <AnimatePresence initial={false}>
                {!isShut && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="flex flex-col gap-0.5">
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
                            className={`sb-item${
                              isActive
                                ? isCollapsed
                                  ? " sb-item--active sb-item--active-rail"
                                  : " sb-item--active"
                                : ""
                            } ${
                              isCollapsed
                                ? "justify-center h-[34px] w-[34px] mx-auto"
                                : "gap-2 h-[34px] px-2.5 text-[12.5px]"
                            }`}
                          >
                            {isActive && (
                              <motion.span
                                layoutId={pillId}
                                className="absolute inset-0"
                                style={{
                                  borderRadius: 9,
                  
                                  background: isCollapsed
                                    ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                                    : "rgba(124, 58, 237, 0.1)",
                                  boxShadow: isCollapsed
                                    ? "0 4px 12px rgba(124, 58, 237, 0.3)"
                                    : "none",
                                }}
                                transition={{
                                  type: "spring",
                                  damping: 30,
                                  stiffness: 350,
                                }}
                              />
                            )}

                            <span className="sb-item__icon">{item.icon}</span>
                            {!isCollapsed && (
                              <span className="sb-item__label">{item.label}</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/*
         * Workspaces — a tree. One workspace expands at a time to show its
         * sections and, under Rooms, the rooms themselves. Collapsed by
         * default so the sidebar stays navigation first.
         */}
        {!isCollapsed && (
          <div className="sb-heading">
            Workspaces
            {canCreate && (
              <Link
                to={setupPath}
                onClick={onClose}
                className="sb-add"
                title="New workspace"
              >
                <FiPlus size={13} />
              </Link>
            )}
          </div>
        )}

        {isCollapsed ? (
          /*
           * Collapsed, only the + survives: the tree needs the full width to
           * read, and there is no list page left for a rail icon to open.
           * Expanding the sidebar is how a workspace is reached.
           */
          canCreate && (
            <div className="space-y-1 px-1">
              <Link
                to={setupPath}
                onClick={onClose}
                className="sb-add sb-add--rail"
                title="New workspace"
              >
                <FiPlus size={15} />
              </Link>
            </div>
          )
        ) : (
          <div className="sb-tree">
            {visibleWorkspaces(workspaces, user ?? undefined).map((ws) => {
              const open = openWs === ws.id;
              const rooms = trees[ws.id]?.rooms ?? [];
              // Only an active workspace is open to its members; the branch
              // still expands so they can see it exists.
              const gate = workspaceGate(ws, user ?? undefined);
              /*
               * A private workspace this session has not unlocked comes back
               * as a stub with `locked`, so there is nothing to list. The
               * branch says why rather than showing an empty Rooms list — the
               * key is entered on the workspace page.
               */
              const shut = trees[ws.id]?.locked === true || ws.locked === true;
              return (
                <div key={ws.id} className="sb-tree__node">
                  <div
                    className={`sb-tree__row${open ? " sb-tree__row--open" : ""}`}
                    // The row is the target, not just the caret — the caret
                    // alone was a 16px hit area beside a full-width link.
                    onClick={() => setOpenWs(open ? null : ws.id)}
                  >
                    <button
                      type="button"
                      className="sb-tree__caret"
                      title={open ? "Collapse" : "Expand"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenWs(open ? null : ws.id);
                      }}
                    >
                      {open ? (
                        <FiChevronDown size={12} />
                      ) : (
                        <FiChevronRight size={12} />
                      )}
                    </button>

                    <span className="sb-tree__badge">
                      {(ws.name[0] ?? "W").toUpperCase()}
                    </span>

                    {gate.open ? (
                      <Link
                        to={workspacePath(ws.id)}
                        onClick={onClose}
                        className="sb-tree__name"
                        title={ws.name}
                      >
                        {ws.name}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="sb-tree__name sb-tree__name--shut"
                        title={gate.reason}
                        onClick={(e) => {
                          e.stopPropagation();
                          showSnackbar({ message: gate.reason, severity: "info" });
                        }}
                      >
                        {ws.name}
                      </button>
                    )}

                    {/*
                      * A private workspace is only reachable with its code, so
                      * the lock is worth showing beside the status — the two
                      * together say what it takes to get in. Only rendered when
                      * the field is actually present, since the API does not
                      * store `visibility` yet.
                      */}
                    {ws.visibility === "private" && (
                      <span
                        className="sb-tree__lock"
                        title="Private — members sign in with the workspace code"
                      >
                        <FiLock size={10} />
                      </span>
                    )}

                    <span className={`sb-tree__pill sb-tree__pill--${ws.status}`}>
                      {WS_STATUS[ws.status] ?? ws.status}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        {/* The guide line the branches hang off. */}
                        <div className="sb-tree__kids">
                          {shut ? (
                            <Link
                              to={workspacePath(ws.id)}
                              onClick={onClose}
                              className="sb-tree__leaf sb-tree__leaf--shut"
                              title="Enter the workspace key to open this workspace"
                            >
                              <FiLock size={13} />
                              Enter workspace key
                            </Link>
                          ) : (
                          <>
                          <Link
                            to={workspacePath(ws.id)}
                            onClick={(e) => {
                              if (!gate.open) {
                                e.preventDefault();
                                showSnackbar({
                                  message: gate.reason,
                                  severity: "info",
                                });
                                return;
                              }
                              onClose();
                            }}
                            className={`sb-tree__leaf${
                              here === workspacePath(ws.id)
                                ? " sb-tree__leaf--active"
                                : ""
                            }`}
                          >
                            {/*
                             * Shares `layoutId` with the nav items' pill, so
                             * the highlight slides between the two rather than
                             * disappearing from one and appearing in the other.
                             * Only one target is ever active, which is what
                             * makes a single shared id safe.
                             */}
                            {here === workspacePath(ws.id) && (
                              <motion.span
                                layoutId={pillId}
                                className="sb-tree__glow"
                                transition={TREE_SPRING}
                              />
                            )}
                            <FiHome size={13} />
                            Overview
                          </Link>

                          <button
                            type="button"
                            className="sb-tree__leaf sb-tree__leaf--branch"
                            onClick={() => setRoomsOpen((o) => !o)}
                          >
                            <FiUsers size={13} />
                            Rooms
                            <span
                              className={`sb-tree__leaf-caret${
                                roomsOpen ? " sb-tree__leaf-caret--open" : ""
                              }`}
                            >
                              <FiChevronDown size={11} />
                            </span>
                          </button>

                          <AnimatePresence initial={false}>
                            {roomsOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.16, ease: "easeOut" }}
                                style={{ overflow: "hidden" }}
                              >
                                <div className="sb-tree__rooms">
                                  {rooms.map((room) => {
                                    const to = roomPath(ws.id, room.id);
                                    return (
                                      <Link
                                        key={room.id}
                                        to={to}
                                        onClick={(e) => {
                                          if (!gate.open) {
                                            e.preventDefault();
                                            showSnackbar({
                                              message: gate.reason,
                                              severity: "info",
                                            });
                                            return;
                                          }
                                          onClose();
                                        }}
                                        title={
                                          gate.open ? room.name : gate.reason
                                        }
                                        className={`sb-tree__room${
                                          here === to ? " sb-tree__room--active" : ""
                                        }`}
                                      >
                                        {here === to && (
                                          <motion.span
                                            layoutId={pillId}
                                            className="sb-tree__glow"
                                            transition={TREE_SPRING}
                                          />
                                        )}
                                        <span className="sb-tree__dot" />
                                        {room.name}
                                      </Link>
                                    );
                                  })}
                                  {rooms.length === 0 && (
                                    <p className="sb-tree__none">
                                      {loadingTree ? "Loading…" : "No rooms"}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {visibleWorkspaces(workspaces, user ?? undefined).length === 0 && (
              <p className="sb-tree__none">No workspaces yet</p>
            )}
          </div>
        )}
      </nav>

      {/* ─── Account, pinned to the bottom ─── */}
      <div className={`shrink-0 pt-2 pb-3 ${isCollapsed ? "px-2.5" : "px-3"}`}>
        <Link
          to={profilePath}
          onClick={onClose}
          title={`${displayName} — ${roleLabel}`}
          className={`sb-user${isCollapsed ? " sb-user--rail" : ""}`}
        >
          <span className="sb-user__avatar">{initial}</span>
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1">
                <p className="sb-user__name">{displayName}</p>
                <p className="sb-user__role">{roleLabel}</p>
              </span>
              <FiChevronRight
                size={14}
                className="shrink-0"
                style={{ color: "var(--text-faint)" }}
              />
            </>
          )}
        </Link>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`sb-panel hidden md:block z-40 ${
          collapsed ? "w-[62px]" : "w-[240px] xl:w-[248px]"
        }`}
      >
        {renderInner(collapsed, "sidebar-pill-desktop")}

        {/* Floating handle, so a collapsed rail still shows the way back out. */}
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
