import { Link } from "react-router-dom";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CloseIcon from "@mui/icons-material/Close";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import { MAX } from "./constants";
import { SectionHead } from "./FlowParts";
import type { WorkspaceFlowState } from "./useWorkspaceFlow";

export default function StepRooms({ f }: { f: WorkspaceFlowState }) {
  const {
    projects, projectId, pickProject, loadingProjects, usedProjectCount, roleBase,
    project, rooms, roomFor, setRoomFor, roomName, setRoomName, addRoom, removeRoom,
    menu, setMenu, clearRooms,
  } = f;

  const openRoomInput = (id: string) => {
    setRoomFor(id);
    setRoomName("");
  };

  return (
    <>
      <SectionHead
        title="Projects & Rooms"
        caption="Pick the project this workspace covers, then create its rooms."
      />

      <div className="cws__cards">
        {projects.map((p) => {
          const on = p.id === projectId;
          return (
            <button
              key={p.id}
              type="button"
              className={`cws__card${on ? " cws__card--on" : ""}`}
              onClick={() => pickProject(p.id)}
            >
              <span className="cws__tile cws__tile--sm cws__tile--project">
                <FolderOutlinedIcon sx={{ fontSize: 17 }} />
              </span>
              <span className="cws__card-name">{p.name}</span>
              <span className="cws__card-mark">
                {on ? <CheckIcon sx={{ fontSize: 15 }} /> : <AddCircleIcon sx={{ fontSize: 16 }} />}
              </span>
            </button>
          );
        })}

        {loadingProjects && <p className="cws__empty">Loading projects…</p>}
      </div>

      {!loadingProjects && projects.length === 0 && (
        <div className="cws__setup">
          <span className="cws__setup-icon">
            <FolderOutlinedIcon sx={{ fontSize: 24 }} />
          </span>

          <h3 className="cws__setup-title">
            {usedProjectCount ? "No projects left" : "No projects yet"}
          </h3>
          <p className="cws__setup-caption">
            {usedProjectCount
              ? `Every project you can see already has a workspace (${usedProjectCount}). A workspace covers one project, so create a new project first:`
              : "A workspace covers one project, and its rooms are staffed from that project's team. Create one first:"}
          </p>

          <ol className="cws__setup-steps">
            <li>
              <strong>Open Departments &amp; Projects</strong> and create a
              project — it needs a name and a department.
            </li>
            <li>
              <strong>Assign team members to it.</strong> Only people on the
              project can be put into this workspace's rooms, so a project
              with no team leaves step 3 empty.
            </li>
            <li>
              <strong>Come back here</strong> and the project will appear as
              a card to pick.
            </li>
          </ol>

          <div className="cws__setup-actions">
            <Link to={`${roleBase}/create-project`} className="cws__primary">
              <AddIcon sx={{ fontSize: 17 }} /> Create a project
            </Link>
            <Link to={`${roleBase}/domain-project`} className="cws__ghost">
              Departments &amp; Projects
            </Link>
          </div>
        </div>
      )}

      {project ? (
        <section className="cws__proj">
          <header className="cws__proj-head">
            <span className="cws__tile cws__tile--sm cws__tile--project">
              <FolderOutlinedIcon sx={{ fontSize: 18 }} />
            </span>
            <h3 className="cws__proj-name">{project.name}</h3>
            <span className="cws__proj-pill">
              {rooms.length} Room{rooms.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className="cws__icon-btn"
              title="Project options"
              onClick={(e) => setMenu({ id: project.id, el: e.currentTarget })}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </button>
          </header>

          <div className="cws__proj-body">
            {rooms.length === 0 && roomFor !== project.id ? (
              <button
                type="button"
                className="cws__proj-empty"
                onClick={() => openRoomInput(project.id)}
              >
                <span className="cws__tile cws__tile--project">
                  <MeetingRoomOutlinedIcon sx={{ fontSize: 20 }} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="cws__proj-empty-title">No rooms yet</span>
                  <span className="cws__proj-empty-caption">
                    Add a room to get started with your team collaboration.
                  </span>
                </span>
              </button>
            ) : (
              <div className="cws__rooms">
                {rooms.map((r) => (
                  <div key={r.id} className="cws__room">
                    <span className="cws__tile cws__tile--sm cws__tile--project">
                      <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className="cws__room-name">{r.name}</span>
                      <span className="cws__room-meta">
                        {r.memberIds.length} Member
                        {r.memberIds.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="cws__room-x"
                      title="Remove room"
                      onClick={() => removeRoom(r.id)}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </button>
                  </div>
                ))}

                {roomFor === project.id ? (
                  <div className="cws__room cws__room--new">
                    <input
                      autoFocus
                      className="cws__room-input"
                      maxLength={MAX.room}
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addRoom();
                        if (e.key === "Escape") setRoomFor(null);
                      }}
                      placeholder="Room name — e.g. Design Team"
                    />
                    <button
                      type="button"
                      className="cws__room-ok"
                      disabled={!roomName.trim()}
                      title="Add room"
                      onClick={addRoom}
                    >
                      <CheckIcon sx={{ fontSize: 15 }} />
                    </button>
                    <button
                      type="button"
                      className="cws__room-x"
                      title="Done"
                      onClick={() => setRoomFor(null)}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cws__room-add"
                    onClick={() => openRoomInput(project.id)}
                  >
                    <AddCircleIcon sx={{ fontSize: 18 }} /> Add Room
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        <p className="cws__empty">Select a project above to start creating its rooms.</p>
      )}

      <Menu
        anchorEl={menu?.el ?? null}
        open={!!menu}
        onClose={() => setMenu(null)}
        slotProps={{ paper: { sx: { minWidth: 184, borderRadius: 2.5 } } }}
      >
        <MenuItem
          onClick={() => {
            if (!menu) return;
            openRoomInput(menu.id);
            setMenu(null);
          }}
          sx={{ fontSize: 13.5, gap: 1.25 }}
        >
          <AddCircleIcon sx={{ fontSize: 17 }} /> Add room
        </MenuItem>
        <MenuItem
          disabled={rooms.length === 0}
          onClick={clearRooms}
          sx={{ fontSize: 13.5, gap: 1.25, color: "#dc2626" }}
        >
          <CloseIcon sx={{ fontSize: 17 }} /> Remove all rooms
        </MenuItem>
      </Menu>
    </>
  );
}
