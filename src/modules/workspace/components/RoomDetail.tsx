import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SpinLoader from "../../../presentation/SpinLoader";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AddIcon from "@mui/icons-material/Add";

import {
  addRoomMember,
  fetchWorkspace,
  removeRoomMember,
} from "../../../core/actions/workspaceAction";
import { fetchAssignablePeople } from "../data/assignablePeople";
import type { AssignablePerson } from "../types";
import { useAppSelector } from "../../../store/configureStore";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import {
  canManageWorkspace,
  canOpenMemberTasks,
  initials,
  notifyWorkspacesChanged,
} from "../data/workspaceHelpers";
import type { Workspace, WorkspaceRoom } from "../../user/types";
import { apiMessage } from "../../../shared/utils/apiMessage";
import {
  ORBIT_RX,
  buildCandidates,
  buildRings,
  countByRole,
} from "./room/roomLayout";
import RoomMemberNode from "./room/RoomMemberNode";
import RoomFan from "./room/RoomFan";
import RoomLegend from "./room/RoomLegend";

export default function RoomDetail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showSnackbar } = useSnackbar();
  const [params] = useSearchParams();
  const workspaceId = params.get("ws");
  const roomId = params.get("room");
  const rolePath = pathname.split("/")[1] ?? "";

  const tasksPath = (memberId: string) =>
    `/${rolePath}/room-tasks?ws=${encodeURIComponent(
      workspaceId ?? ""
    )}&room=${encodeURIComponent(roomId ?? "")}&user=${encodeURIComponent(memberId)}`;

  const { user } = useAppSelector((state) => state.user);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<AssignablePerson[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);
  const [overStage, setOverStage] = useState(false);
  const [fanOpen, setFanOpen] = useState(false);

  const canManage = canManageWorkspace(workspace, user);

  const room: WorkspaceRoom | null = useMemo(
    () => workspace?.rooms?.find((r) => r.id === roomId) ?? null,
    [workspace, roomId]
  );

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!workspaceId || !roomId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const ws = await fetchWorkspace(workspaceId);
      setWorkspace(ws);
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

  const rings = useMemo(() => buildRings(room?.members ?? []), [room]);

  const byRole = useMemo(() => countByRole(room?.members ?? []), [room]);

  const candidates = useMemo(
    () => buildCandidates(people, room, workspace?.rooms ?? []),
    [people, room, workspace]
  );

  const addMember = async (userId: string) => {
    if (!room) return;
    setBusy(true);
    try {
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

        <div className="rmo">
            <div className="rmo__stages">
            {rings.map((ring, r) => (
            <div
              key={ring.start}
              className={`rmo__stage${overStage && r === 0 ? " rmo__stage--over" : ""}${
                fanOpen && r === 0 ? " rmo__stage--fanned" : ""
              }`}
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

              {canManage && fanOpen && r === 0 && (
                <RoomFan
                  candidates={candidates}
                  busy={busy}
                  drag={drag}
                  onDragStart={setDrag}
                  onDragEnd={() => {
                    setDrag(null);
                    setOverStage(false);
                  }}
                />
              )}

              <span
                className="rmo__ring"
                style={{ width: `${ORBIT_RX * 2}%`, height: `${ring.ry * 2}%` }}
              />

              <span className="rmo__halo rmo__halo--outer" />
              <span className="rmo__halo rmo__halo--inner" />

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

              {ring.nodes.map((node) => (
                <RoomMemberNode
                  key={node.member.id}
                  node={node}
                  canManage={canManage}
                  canOpen={canOpenMemberTasks(workspace, user, node.member.id)}
                  tasksPath={tasksPath(node.member.id)}
                  onRemove={(id, name) => void dropMember(id, name)}
                />
              ))}
            </div>
            ))}
            </div>

            <RoomLegend byRole={byRole} total={room.members.length} />
        </div>
      </div>


    </div>
  );
}
