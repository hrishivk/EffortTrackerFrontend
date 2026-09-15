import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SpinLoader from "../../../presentation/SpinLoader";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import {
  addRoomMember,
  fetchWorkspace,
  removeRoomMember,
} from "../../../core/actions/workspaceAction";
import {
  fetchAssignablePeople,
  type AssignablePerson,
} from "../data/assignablePeople";
import { useAppSelector } from "../../../store/configureStore";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import {
  canManageWorkspace,
  canOpenMemberTasks,
  initials,
  notifyWorkspacesChanged,
} from "../data/workspaceHelpers";
import type { Workspace, WorkspaceRoom } from "../../user/types";

/**
 * Inside one room: who is in it.
 *
 * `GET /role-user/workspaces?id=` returns the whole tree, so the room and its
 * members come from a single read and the page needs nothing else.
 *
 * The room shows no tasks. Tasks have no `room_id`, so "the room's tasks"
 * could only be derived — the project's tasks assigned to somebody in the
 * room — which double-counts anyone in two rooms on one project. See the note
 * in docs/workspace-api.md if we want the link stored.
 */


/** Ring radius as a percent of the canvas, and how many nodes fit on it. */
/*
 * The ring the members sit on. Narrow across and tall down, because a member's
 * card is wide and short: the horizontal budget is what runs out first, so the
 * ring spends its room on the vertical instead.
 */
const ORBIT_RX = 19;
const ORBIT_RY_MIN = 24;
const ORBIT_RY_MAX = 40;
/** At most this much of a side arc, and at most this far apart along it. */
const ORBIT_ARC = (Math.PI / 180) * 150;
const ORBIT_STEP = (Math.PI / 180) * 40;
/**
 * The left column runs a little tighter than the right. With an even number of
 * members the two columns would otherwise place their nodes at matching
 * heights, and the topmost pair's cards would meet in the middle.
 */
const ORBIT_LEFT_SQUEEZE = 0.78;
/**
 * Ten to a circle. Past that the columns run out of vertical room, so the
 * eleventh member starts a second circle underneath rather than being squeezed
 * into the first — an outward ring cannot work, because a member's card
 * extends outward and would leave the box.
 */
const ORBIT_PER_RING = 10;
const ORBIT_MAX = 40;

/**
 * The candidates form a second, wider ring outside the members' one, spread
 * all the way round so they use every side of the box. Someone waiting to be
 * added is visibly not in the room yet, and crosses inward only once dropped.
 */
const FAN_R = 43;
const FAN_MAX = 12;

const apiMessage = (error: unknown, fallback: string): string => {
  const res = (error as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message || fallback;
};

export default function RoomDetail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showSnackbar } = useSnackbar();
  const [params] = useSearchParams();
  const workspaceId = params.get("ws");
  const roomId = params.get("room");
  const rolePath = pathname.split("/")[1] ?? "";

  /**
   * A member's tasks open on their own page inside the workspace, not on the
   * dashboard — the point is to stay in the room's context, so the page keeps
   * the breadcrumb and can come back here.
   */
  const tasksPath = (memberId: string) =>
    `/${rolePath}/room-tasks?ws=${encodeURIComponent(
      workspaceId ?? ""
    )}&room=${encodeURIComponent(roomId ?? "")}&user=${encodeURIComponent(memberId)}`;

  const { user } = useAppSelector((state) => state.user);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<AssignablePerson[]>([]);
  const [busy, setBusy] = useState(false);
  /** The candidate currently being dragged out of the fan. */
  const [drag, setDrag] = useState<string | null>(null);
  const [overStage, setOverStage] = useState(false);
  /** The fan is closed until the + on the core is used. */
  const [fanOpen, setFanOpen] = useState(false);

  /**
   * Membership is the workspace creator's to change — and SP's, who sees
   * everything. Any other manager gets the read-only view.
   */
  const canManage = canManageWorkspace(workspace, user);

  const room: WorkspaceRoom | null = useMemo(
    () => workspace?.rooms?.find((r) => r.id === roomId) ?? null,
    [workspace, roomId]
  );

  /**
   * `silent` re-reads without the full-page spinner — see the same note in
   * WorkspaceDetail. Adding or removing a member must not blank the ring.
   */
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!workspaceId || !roomId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const ws = await fetchWorkspace(workspaceId);
      setWorkspace(ws);
      // Not required to render the room, so a failure just leaves the picker
      // empty rather than breaking the page.
      if (ws.project?.id) {
        try {
          setPeople(await fetchAssignablePeople(String(ws.project.id), user));
        } catch {
          setPeople([]);
        }
      }
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not load that room"),
        severity: "error",
      });
      setWorkspace(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [workspaceId, roomId, showSnackbar, user]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * The members, ten to a circle, and where each one sits on the circle it
   * landed in.
   *
   * Two columns per circle — one down the right, one down the left — rather
   * than points spread around a full ring, which is what this used to do. A
   * card extends outward *horizontally* from its avatar, so a member sitting
   * near 12 or 6 o'clock has no outward to extend into: past four or five
   * members the top and bottom cards ran into each other and into the total in
   * the middle. On a side arc every card has the horizontal room it needs, and
   * the only thing a bigger room costs is height.
   */
  const rings = useMemo(() => {
    const all = (room?.members ?? []).slice(0, ORBIT_MAX);
    const out = [];

    for (let start = 0; start < Math.max(all.length, 1); start += ORBIT_PER_RING) {
      const list = all.slice(start, start + ORBIT_PER_RING);
      const rightCount = Math.ceil(list.length / 2);
      const leftCount = list.length - rightCount;
      // The circle opens up as it fills, so the cards keep their gap.
      const ry = Math.min(
        ORBIT_RY_MAX,
        ORBIT_RY_MIN + Math.max(0, rightCount - 1) * 4
      );

      /** The angle of one slot in a column, measured off the horizontal. */
      const slot = (column: number, count: number, right: boolean) => {
        const spread =
          Math.min(ORBIT_ARC, Math.max(count - 1, 0) * ORBIT_STEP) *
          (right ? 1 : ORBIT_LEFT_SQUEEZE);
        const offset = count > 1 ? (column / (count - 1) - 0.5) * spread : 0;
        // Mirroring through the vertical keeps both columns running downward.
        return right ? offset : Math.PI - offset;
      };

      const point = (angle: number) => ({
        left: 50 + Math.cos(angle) * ORBIT_RX,
        top: 50 + Math.sin(angle) * ry,
      });

      out.push({
        start,
        end: start + list.length,
        ry,
        nodes: list.map((m, i) => {
          const right = i < rightCount;
          const column = right ? i : i - rightCount;
          const count = right ? rightCount : leftCount;
          const angle = slot(column, count, right);
          const next = column + 1 < count ? slot(column + 1, count, right) : null;
          return {
            member: m,
            ...point(angle),
            side: right ? "right" : "left",
            // A marker between this member and the next down the same column.
            dot: next === null ? null : point((angle + next) / 2),
          };
        }),
      });
    }

    return out;
  }, [room]);

  /** How many of each role, for the legend beside the ring. */
  const byRole = useMemo(() => {
    const counts = new Map<string, number>();
    (room?.members ?? []).forEach((m) =>
      counts.set(m.role, (counts.get(m.role) ?? 0) + 1)
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [room]);

  /**
   * Everyone assignable who is not already in *this* room. A person can be in
   * several rooms of one workspace, so being in another does not exclude them
   * — it is shown beside their name as context.
   */
  const candidates = useMemo(() => {
    const here = new Set((room?.members ?? []).map((m) => m.id));
    // Every other room they are already in. Adding them here is an addition,
    // not a move, so this is shown as context rather than as a warning.
    const elsewhere = new Map<string, string[]>();
    (workspace?.rooms ?? [])
      .filter((r) => r.id !== room?.id)
      .forEach((r) =>
        r.members.forEach((m) =>
          elsewhere.set(m.id, [...(elsewhere.get(m.id) ?? []), r.name])
        )
      );
    return people
      .filter((p) => !here.has(p.id))
      .map((p) => ({ ...p, currentRooms: elsewhere.get(p.id) ?? [] }));
  }, [people, room, workspace]);

  /** Candidates spread evenly around the outer ring, starting at the top. */
  const fan = useMemo(() => {
    const list = candidates.slice(0, FAN_MAX);
    const step = (Math.PI * 2) / Math.max(list.length, 1);
    // Same quarter-turn as the members' ring: an even count would otherwise
    // sit exactly at 12 and 6 o'clock, where a node's name runs closest to
    // the edge of the box.
    const turn = list.length > 1 && list.length % 2 === 0 ? step / 4 : 0;
    return list.map((c, i) => {
      const angle = i * step - Math.PI / 2 + turn;
      return {
        person: c,
        left: 50 + Math.cos(angle) * FAN_R,
        top: 50 + Math.sin(angle) * FAN_R,
      };
    });
  }, [candidates]);

  const addMember = async (userId: string) => {
    if (!room) return;
    setBusy(true);
    try {
      // Adds, rather than moves: a person can be in several rooms of one
      // workspace, so their other memberships are left alone.
      await addRoomMember(room.id, userId);
      await load({ silent: true });
      notifyWorkspacesChanged();
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not add that member"),
        severity: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const dropMember = async (userId: string, name: string) => {
    if (!room) return;
    setBusy(true);
    try {
      await removeRoomMember(room.id, userId);
      await load({ silent: true });
      notifyWorkspacesChanged();
      showSnackbar({ message: `${name} removed from ${room.name}`, severity: "success" });
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not remove that member"),
        severity: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <SpinLoader isLoading />;

  if (!room) {
    return (
      <div className="cws">
        <div className="cws__finished">
          <h2 className="cws__finished-title">Room not found</h2>
          <p className="cws__finished-caption">
            It may have been deleted, or you may not have access to it.
          </p>
          <div className="cws__finished-actions">
            <button type="button" className="cws__ghost" onClick={() => navigate(-1)}>
              <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cws">
      <div className="cws__head">
        <button
          type="button"
          className="cws__icon-btn"
          title="Back to workspace"
          onClick={() => navigate(-1)}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="cws__title">{room.name}</h1>
          <p className="cws__caption">
            {[workspace?.project?.name, workspace?.name, "Rooms"]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

      </div>

      <div className="cws__main">
        {/* Compact band: identity on the left, the count on the right. */}
        <div className="rmo__band">
          <span className="rmo__band-badge">{initials(room.name) || "R"}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="rmo__band-name">{room.name}</h3>
            <p className="rmo__band-sub">
              {[workspace?.project?.name, workspace?.name]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="rmo__band-stat">
            <PeopleAltOutlinedIcon sx={{ fontSize: 19, opacity: 0.85 }} />
            <span className="rmo__band-n">{room.members.length}</span>
            <span className="rmo__band-label">
              Member{room.members.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="rmo__head">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="rmo__title">Members in this Room</h3>
            <p className="rmo__caption">
              {fanOpen
                ? "Drag anyone from the outer ring onto the inner one to add them."
                : room.members.length === 0
                  ? "Nobody is in this room yet."
                  : canManage
                    ? "Click a member to open their tasks in list, board or Gantt view."
                    : "Everyone in this room is shown. Click yourself to open your tasks."}
            </p>
          </div>

        </div>

        {/*
         * Rendered even with nobody in the room. The + that adds members lives
         * inside this box, so replacing it with an empty message left the room
         * with no way out of being empty.
         */}
        <div className="rmo">
            {/*
             * The members sit on a ring around the total. Positions are
             * computed rather than laid out, so any number spaces evenly.
             */}
            <div className="rmo__stages">
            {rings.map((ring, r) => (
            <div
              key={ring.start}
              className={`rmo__stage${overStage && r === 0 ? " rmo__stage--over" : ""}${
                fanOpen && r === 0 ? " rmo__stage--fanned" : ""
              }`}
              /* Only the first circle takes a drop — the add puts a member in
                 the room, and which circle they land on is arithmetic. */
              onDragOver={(e) => {
                if (!drag || r !== 0) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (!overStage) setOverStage(true);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                setOverStage(false);
              }}
              onDrop={(e) => {
                if (r !== 0) return;
                e.preventDefault();
                const id = drag;
                setOverStage(false);
                setDrag(null);
                if (id) void addMember(id);
              }}
            >
              {/*
               * The + that reveals the candidates. In the corner of the box
               * rather than on the centre circle, so it does not read as part
               * of the members' count.
               */}
              {canManage && r === 0 && (
                <button
                  type="button"
                  className={`rmo__add${fanOpen ? " rmo__add--on" : ""}`}
                  disabled={busy || (!fanOpen && candidates.length === 0)}
                  title={
                    candidates.length === 0
                      ? "Everyone assignable is already in this room"
                      : fanOpen
                        ? "Hide"
                        : "Add members"
                  }
                  onClick={() => setFanOpen((o) => !o)}
                >
                  <AddIcon sx={{ fontSize: 20 }} />
                </button>
              )}

              {/*
               * The candidates, fanned along the arc. Rendered before the ring
               * so a member's label card sits above a candidate rather than
               * under it where the two are close.
               */}
              {canManage && fanOpen && r === 0 && (
                <>
                  <span className="rmo__fan-arc" />
                  {fan.map(({ person, left, top }, i) => (
                    <div
                      key={person.id}
                      draggable={!busy}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        animationDelay: `${i * 45}ms`,
                      }}
                      onDragStart={(e: DragEvent<HTMLDivElement>) => {
                        e.dataTransfer.effectAllowed = "move";
                        // Firefox needs a payload for the drag to begin.
                        e.dataTransfer.setData("text/plain", person.id);
                        setDrag(person.id);
                      }}
                      onDragEnd={() => {
                        setDrag(null);
                        setOverStage(false);
                      }}
                      className={`rmo__fan-node${
                        drag === person.id ? " rmo__fan-node--dragging" : ""
                      }`}
                      title={`${person.name} — ${person.role}${
                        person.currentRooms.length
                          ? ` · also in ${person.currentRooms.join(", ")}`
                          : ""
                      }`}
                    >
                      <span className="rmo__fan-avatar">
                        {initials(person.name)}
                        {person.currentRooms.length > 0 && (
                          <span
                            className="rmo__fan-moved"
                            title={`Also in ${person.currentRooms.join(", ")}`}
                          />
                        )}
                      </span>
                      <span className="rmo__fan-name">{person.name}</span>
                    </div>
                  ))}
                  {candidates.length > FAN_MAX && (
                    <span className="rmo__fan-more">
                      +{candidates.length - FAN_MAX} more
                    </span>
                  )}
                </>
              )}

              {/* Sized from the node geometry, so the nodes sit on it. */}
              <span
                className="rmo__ring"
                style={{ width: `${ORBIT_RX * 2}%`, height: `${ring.ry * 2}%` }}
              />

              <span className="rmo__halo rmo__halo--outer" />
              <span className="rmo__halo rmo__halo--inner" />

              {/* The first circle carries the count; the rest say which slice
                  of the room they are holding. */}
              <div className="rmo__core">
                {r === 0 ? (
                  <>
                    <PeopleAltOutlinedIcon sx={{ fontSize: 24 }} />
                    <span className="rmo__core-n">{room.members.length}</span>
                    <span className="rmo__core-label">Total Members</span>
                  </>
                ) : (
                  <>
                    <span className="rmo__core-n rmo__core-n--range">
                      {ring.start + 1}–{ring.end}
                    </span>
                    <span className="rmo__core-label">Members</span>
                  </>
                )}
              </div>

              {canManage && fanOpen && r === 0 && (
                <span className="rmo__fan-tip">
                  Drag onto the ring to add
                </span>
              )}

              {!fanOpen && r === 0 && room.members.length === 0 && (
                <span className="rmo__fan-tip">
                  {canManage
                    ? candidates.length === 0
                      ? "Nobody on this project to add yet"
                      : "Nobody here yet — use + to add members"
                    : "Nobody is in this room yet"}
                </span>
              )}

              {ring.nodes.map(({ member, left, top, side, dot }) => {
                /*
                 * Everyone in the room is drawn, but only a manager gets a
                 * link to somebody else's tasks — a member's own node is the
                 * only one they can open. A room is shared work, not a shared
                 * inbox. The node is otherwise identical, so the content is
                 * built once and only its wrapper changes.
                 *
                 * `RoomMemberTasks` applies the same rule when the URL is typed
                 * by hand, and `/task-list` is what actually enforces it; this
                 * only decides whether the node invites a click.
                 */
                const open = canOpenMemberTasks(workspace, user, member.id);

                const inner = (
                  <>
                    <span className="rmo__avatar">
                      {initials(member.fullName)}
                      {canManage && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Remove ${member.fullName}`}
                          title={`Remove ${member.fullName} from this room`}
                          className="rmo__remove"
                          // The node may be a link to their tasks, so the
                          // remove has to stop the navigation it sits inside.
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void dropMember(member.id, member.fullName);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            e.stopPropagation();
                            void dropMember(member.id, member.fullName);
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 11 }} />
                        </span>
                      )}
                    </span>
                    <span className="rmo__label">
                      <span className="rmo__label-name">{member.fullName}</span>
                      <span className="rmo__label-role">{member.role}</span>
                    </span>
                  </>
                );

                const place = { left: `${left}%`, top: `${top}%` };

                return (
                  <div key={member.id}>
                    {dot && (
                      <span
                        className="rmo__dot"
                        style={{ left: `${dot.left}%`, top: `${dot.top}%` }}
                      />
                    )}
                    {open ? (
                      <Link
                        to={tasksPath(member.id)}
                        title={`${member.fullName} — open their tasks`}
                        className={`rmo__node rmo__node--${side}`}
                        style={place}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div
                        title={`${member.fullName} — ${member.role}`}
                        className={`rmo__node rmo__node--${side} rmo__node--static`}
                        style={place}
                      >
                        {inner}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            ))}
            </div>

            <aside className="rmo__legend">
              {byRole.length === 0 && (
                <p className="rmo__legend-empty">No members yet</p>
              )}
              {byRole.map(([roleName, n]) => (
                <div key={roleName} className="rmo__legend-row">
                  <span className="rmo__legend-dot" />
                  <span className="rmo__legend-name">{roleName}</span>
                  <span className="rmo__legend-n">{n}</span>
                </div>
              ))}
              <div className="rmo__legend-row rmo__legend-row--total">
                <span className="rmo__legend-name">Total Members</span>
                <span className="rmo__legend-n">{room.members.length}</span>
              </div>
              {room.members.length > ORBIT_MAX && (
                <p className="rmo__legend-more">
                  Showing {ORBIT_MAX} of {room.members.length} on the ring.
                </p>
              )}
            </aside>
        </div>
      </div>


    </div>
  );
}
