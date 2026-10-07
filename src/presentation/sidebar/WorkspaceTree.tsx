import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown, FiChevronRight, FiHome, FiLock, FiUsers } from "react-icons/fi";
import { workspaceGate } from "../../modules/workspace/data/workspaceHelpers";
import type { Workspace } from "../../modules/user/types";
import { WS_STATUS } from "./sidebarConfig";
import { ActiveGlow, Collapse } from "./sidebarMotion";
import type { SidebarWorkspaces } from "./useSidebarWorkspaces";
import type { SidebarViewProps, WorkspaceGate } from "./types";

type GateUser = Parameters<typeof workspaceGate>[1];

interface WorkspaceTreeProps extends Omit<SidebarViewProps, "isCollapsed"> {
  visible: Workspace[];
  user: GateUser;
  state: SidebarWorkspaces;
  here: string;
  workspacePath: (id: string) => string;
  roomPath: (wsId: string, roomId: string) => string;
  notify: (message: string) => void;
}

const WorkspaceTree = ({
  visible,
  user,
  state,
  here,
  workspacePath,
  roomPath,
  notify,
  pillId,
  onClose,
}: WorkspaceTreeProps) => {
  const { openWs, setOpenWs, roomsOpen, toggleRooms, trees, loadingTree } = state;

  /** Blocks navigation into a closed workspace and explains why; otherwise closes the mobile menu. */
  const guarded = (gate: WorkspaceGate) => (e: MouseEvent) => {
    if (!gate.open) {
      e.preventDefault();
      notify(gate.reason);
      return;
    }
    onClose();
  };

  return (
    <div className="sb-tree">
      {visible.map((ws) => {
        const open = openWs === ws.id;
        const rooms = trees[ws.id]?.rooms ?? [];
        const gate = workspaceGate(ws, user);
        const shut = trees[ws.id]?.locked === true || ws.locked === true;
        const overviewPath = workspacePath(ws.id);
        const toggle = () => setOpenWs(open ? null : ws.id);

        return (
          <div key={ws.id} className="sb-tree__node">
            <div
              className={`sb-tree__row${open ? " sb-tree__row--open" : ""}`}
              onClick={toggle}
            >
              <button
                type="button"
                className="sb-tree__caret"
                title={open ? "Collapse" : "Expand"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
              >
                {open ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
              </button>

              <span className="sb-tree__badge">{(ws.name[0] ?? "W").toUpperCase()}</span>

              {gate.open ? (
                <Link
                  to={overviewPath}
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
                    notify(gate.reason);
                  }}
                >
                  {ws.name}
                </button>
              )}

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

            <Collapse open={open}>
              <div className="sb-tree__kids">
                {shut ? (
                  <Link
                    to={overviewPath}
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
                      to={overviewPath}
                      onClick={guarded(gate)}
                      className={`sb-tree__leaf${
                        here === overviewPath ? " sb-tree__leaf--active" : ""
                      }`}
                    >
                      {here === overviewPath && <ActiveGlow layoutId={pillId} />}
                      <FiHome size={13} />
                      Overview
                    </Link>

                    <button
                      type="button"
                      className="sb-tree__leaf sb-tree__leaf--branch"
                      onClick={toggleRooms}
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

                    <Collapse open={roomsOpen} duration={0.16}>
                      <div className="sb-tree__rooms">
                        {rooms.map((room) => {
                          const to = roomPath(ws.id, room.id);
                          return (
                            <Link
                              key={room.id}
                              to={to}
                              onClick={guarded(gate)}
                              title={gate.open ? room.name : gate.reason}
                              className={`sb-tree__room${
                                here === to ? " sb-tree__room--active" : ""
                              }`}
                            >
                              {here === to && <ActiveGlow layoutId={pillId} />}
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
                    </Collapse>
                  </>
                )}
              </div>
            </Collapse>
          </div>
        );
      })}

      {visible.length === 0 && <p className="sb-tree__none">No workspaces yet</p>}
    </div>
  );
};

export default WorkspaceTree;
