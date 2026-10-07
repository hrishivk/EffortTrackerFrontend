import type { DragEvent } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";

import { initials } from "../../data/workspaceHelpers";
import { SectionHead } from "./FlowParts";
import type { WorkspaceFlowState } from "./useWorkspaceFlow";

export default function StepAssign({ f }: { f: WorkspaceFlowState }) {
  const {
    people, loadingPeople, project, rooms, unplaced, assigned, userOf, candidatesFor,
    poolOpen, setPoolOpen, dragUser, setDragUser, overRoom, setOverRoom,
    overPool, setOverPool, addFor, setAddFor, putInRoom, removeFromRoom, unassign, setStep,
  } = f;

  const dragProps = (id: string) => ({
    draggable: true,
    onDragStart: (e: DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      setDragUser(id);
    },
    onDragEnd: () => {
      setDragUser(null);
      setOverRoom(null);
      setOverPool(false);
    },
  });

  return (
    <>
      <SectionHead
        title="Assign Users to Rooms"
        caption="Organize your team by adding users to the right rooms."
      />

      <div className="cws__assign">
        <div className="cws__pool">
          <button
            type="button"
            className={`cws__pool-add${poolOpen ? " cws__pool-add--on" : ""}`}
            disabled={people.length === 0}
            title={poolOpen ? "Hide users" : "Show users to assign"}
            onClick={() => setPoolOpen((o) => !o)}
          >
            <AddIcon sx={{ fontSize: 26 }} />
          </button>

          <p className="cws__pool-hint">
            {loadingPeople
              ? "Loading users…"
              : people.length === 0
              ? `Nobody is assigned to ${project?.name ?? "this project"}, and no shared users`
              : poolOpen
                ? "Drag an avatar into a room — one person can be in several"
                : `${people.length} user${people.length === 1 ? "" : "s"}, ${unplaced} not yet placed`}
          </p>

          {poolOpen && people.length > 0 && (
            <div className="cws__faces">
              {people.map((u, i) => (
                <div
                  key={u.id}
                  {...dragProps(u.id)}
                  style={{ animationDelay: `${i * 55}ms` }}
                  className={`cws__face${dragUser === u.id ? " cws__face--dragging" : ""}`}
                  title={`${u.name} — ${u.role}${u.shared ? " · shared user" : ""}`}
                >
                  <span className="cws__face-avatar">
                    {initials(u.name)}
                    {u.shared && (
                      <span className="cws__face-shared" title="Shared user">
                        <GroupsOutlinedIcon sx={{ fontSize: 10 }} />
                      </span>
                    )}
                  </span>
                  <span className="cws__face-name">{u.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cws__board">
          <header className="cws__board-head">
            <span className="cws__tile cws__tile--sm cws__tile--project">
              <FolderOutlinedIcon sx={{ fontSize: 17 }} />
            </span>
            <h3 className="cws__board-title">Project: {project?.name ?? "—"}</h3>
            <span className="cws__proj-pill">
              {rooms.length} Room{rooms.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className="cws__icon-btn"
              title="Back to rooms"
              onClick={() => setStep(1)}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </button>
          </header>

          <div className="cws__room-grid">
            {rooms.map((r) => {
              const over = overRoom === r.id;
              return (
                <div
                  key={r.id}
                  className={`cws__rcard${over ? " cws__rcard--over" : ""}`}
                  onDragOver={(e) => {
                    if (!dragUser) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (overRoom !== r.id) setOverRoom(r.id);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                    if (overRoom === r.id) setOverRoom(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragUser) putInRoom(r.id, dragUser);
                    setDragUser(null);
                    setOverRoom(null);
                  }}
                >
                  <div className="cws__rcard-head">
                    <span className="cws__tile cws__tile--sm cws__tile--project">
                      <PeopleAltOutlinedIcon sx={{ fontSize: 17 }} />
                    </span>
                    <h4 className="cws__rcard-name">{r.name}</h4>
                  </div>

                  <div className="cws__rcard-pills">
                    <span className="cws__rcard-num">{r.memberIds.length}</span>
                    <span className="cws__rcard-word">
                      Member{r.memberIds.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="cws__rcard-body">
                    {r.memberIds.map((id) => {
                      const u = userOf(id);
                      return (
                        <div
                          key={id}
                          {...dragProps(id)}
                          className={`cws__member${dragUser === id ? " cws__member--dragging" : ""}`}
                        >
                          <span className="cws__avatar cws__avatar--sm">
                            {initials(u?.name ?? "?")}
                          </span>
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span className="cws__person-name">{u?.name}</span>
                            <span className="cws__person-role">
                              {u?.role}
                              {u?.shared && <span className="cws__shared-tag">Shared</span>}
                            </span>
                          </span>
                          <button
                            type="button"
                            className="cws__member-x"
                            title="Remove from room"
                            onClick={() => removeFromRoom(r.id, id)}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </button>
                        </div>
                      );
                    })}
                    {r.memberIds.length === 0 && (
                      <p className="cws__rcard-empty">Drop a user here, or add one below.</p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="cws__rcard-add"
                    disabled={candidatesFor(r.id).length === 0}
                    onClick={(e) => setAddFor({ roomId: r.id, el: e.currentTarget })}
                  >
                    <AddIcon sx={{ fontSize: 17 }} /> Add User
                  </button>
                </div>
              );
            })}

            {rooms.length === 0 && (
              <p className="cws__empty">No rooms yet — go back a step to create one.</p>
            )}
          </div>
        </div>
      </div>

      <div
        className={`cws__unassign${overPool ? " cws__unassign--over" : ""}`}
        onDragOver={(e) => {
          if (!dragUser || !assigned.has(dragUser)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!overPool) setOverPool(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setOverPool(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragUser) unassign(dragUser);
          setDragUser(null);
          setOverPool(false);
        }}
      >
        <span className="cws__unassign-icon">
          <PersonRemoveOutlinedIcon sx={{ fontSize: 20 }} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="cws__unassign-title">Drag users here to remove from rooms</span>
          <span className="cws__unassign-caption">
            Takes them out of every room in this workspace
          </span>
        </span>
      </div>

      <Menu
        anchorEl={addFor?.el ?? null}
        open={!!addFor}
        onClose={() => setAddFor(null)}
        slotProps={{ paper: { sx: { minWidth: 232, borderRadius: 2.5 } } }}
      >
        {addFor && candidatesFor(addFor.roomId).map((u) => (
          <MenuItem
            key={u.id}
            onClick={() => {
              if (addFor) putInRoom(addFor.roomId, u.id);
              setAddFor(null);
            }}
            sx={{ fontSize: 13.5, gap: 1.25 }}
          >
            <span className="cws__avatar cws__avatar--sm">{initials(u.name)}</span>
            {u.name} — {u.role}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
