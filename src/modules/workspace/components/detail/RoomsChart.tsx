import { useMemo } from "react";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { initials } from "../../data/workspaceHelpers";
import type { Workspace, WorkspaceRoom } from "../../../user/types";
import { ROOMS_PER_ROW } from "./constants";

interface RoomsChartProps {
  workspace: Workspace;
  rooms: WorkspaceRoom[];
  rolePath: string;
  canManage: boolean;
  busy: boolean;
  onAdd: () => void;
  onRename: (room: WorkspaceRoom) => void;
  onDelete: (room: WorkspaceRoom) => void;
}

function RoomCard({
  room,
  workspaceId,
  rolePath,
  canManage,
  busy,
  onRename,
  onDelete,
}: {
  room: WorkspaceRoom;
  workspaceId: string;
  rolePath: string;
  canManage: boolean;
  busy: boolean;
  onRename: (room: WorkspaceRoom) => void;
  onDelete: (room: WorkspaceRoom) => void;
}) {
  return (
    <section className="wsd__room">
      <div className="wsd__room-top">
        <span className="cws__tile cws__tile--project">
          <PeopleAltOutlinedIcon sx={{ fontSize: 20 }} />
        </span>
        {canManage && (
          <span className="wsd__room-actions">
            <button
              type="button"
              className="wsd__room-act"
              title={`Rename ${room.name}`}
              aria-label={`Rename ${room.name}`}
              disabled={busy}
              onClick={() => onRename(room)}
            >
              <EditOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
            <button
              type="button"
              className="wsd__room-act wsd__room-act--danger"
              title={`Delete ${room.name}`}
              aria-label={`Delete ${room.name}`}
              disabled={busy}
              onClick={() => onDelete(room)}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </button>
          </span>
        )}
      </div>

      <h4 className="wsd__room-name">{room.name}</h4>

      <div className="wsd__room-stats">
        <span className="wsd__room-stat">
          <PeopleAltOutlinedIcon sx={{ fontSize: 15 }} />
          <span>
            <strong>{room.members.length}</strong>
            Members
          </span>
        </span>
      </div>

      <p className="wsd__room-label">Members</p>
      <div className="wsd__room-members">
        {room.members.slice(0, 4).map((m) => (
          <div key={m.id} className="wsd__room-member">
            <span className="cws__avatar cws__avatar--sm">{initials(m.fullName)}</span>
            <span className="wsd__room-member-name">{m.fullName}</span>
            <span className="wsd__room-member-role">{m.role}</span>
          </div>
        ))}
        {room.members.length > 4 && (
          <p className="wsd__room-more">+{room.members.length - 4} more</p>
        )}
        {room.members.length === 0 && (
          <p className="wsd__room-more">Nobody in this room yet.</p>
        )}
      </div>

      <Link
        to={`/${rolePath}/room?ws=${encodeURIComponent(workspaceId)}&room=${encodeURIComponent(
          room.id
        )}`}
        className="wsd__room-enter"
      >
        View Room
        <ChevronRightIcon sx={{ fontSize: 17 }} />
      </Link>
    </section>
  );
}

export default function RoomsChart({
  workspace,
  rooms,
  rolePath,
  canManage,
  busy,
  onAdd,
  onRename,
  onDelete,
}: RoomsChartProps) {
  const roomRows = useMemo(() => {
    const out: WorkspaceRoom[][] = [];
    for (let i = 0; i < rooms.length; i += ROOMS_PER_ROW) {
      out.push(rooms.slice(i, i + ROOMS_PER_ROW));
    }
    return out;
  }, [rooms]);

  return (
    <div className="wsd__struct">
      <div className="wsd__struct-head">
        <span className="cws__tile cws__tile--project">
          <MeetingRoomOutlinedIcon sx={{ fontSize: 20 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="wsd__struct-title">Rooms</h3>
          <p className="wsd__struct-caption">
            Manage rooms and collaborate with your team seamlessly.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="wsd__add"
            title="Add a room"
            disabled={busy}
            onClick={onAdd}
          >
            <AddIcon sx={{ fontSize: 22 }} />
          </button>
        )}
      </div>

      {rooms.length === 0 ? (
        <p className="cws__empty">
          {canManage
            ? "No rooms yet — use Add Room to create the first one."
            : "You can see this workspace, but not any rooms yet — a manager needs to add you to one."}
        </p>
      ) : (
        <div className="wsd__tree">
          <div className="wsd__tree-top">
            <div className="wsd__tree-root">
              <span className="wsd__tree-root-badge">
                {(workspace.name[0] ?? "W").toUpperCase()}
              </span>
              <span className="wsd__tree-root-name">{workspace.name}</span>
              <span className="wsd__tree-root-kind">Workspace</span>
            </div>
          </div>

          <span className="wsd__tree-stem" />

          {roomRows.map((row, rowIndex) => (
            <div key={rowIndex}>
              {rowIndex > 0 && <span className="wsd__tree-stem" />}
              <div className="wsd__tree-row">
                {row.map((room) => (
                  <div key={room.id} className="wsd__tree-branch">
                    <RoomCard
                      room={room}
                      workspaceId={workspace.id}
                      rolePath={rolePath}
                      canManage={canManage}
                      busy={busy}
                      onRename={onRename}
                      onDelete={onDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
