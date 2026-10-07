import type { ElementType, ReactNode } from "react";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { initials } from "../../data/workspaceHelpers";
import { STATUSES, VISIBILITY, labelOf } from "./constants";
import type { WorkspaceFlowState } from "./useWorkspaceFlow";

function RvCard({
  icon: Icon,
  title,
  children,
  foot,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <section className="cws__rv-card">
      <header className="cws__rv-card-head">
        <span className="cws__tile cws__tile--sm cws__tile--project">
          <Icon sx={{ fontSize: 17 }} />
        </span>
        <h4 className="cws__rv-card-title">{title}</h4>
      </header>
      <div className="cws__rv-card-body">{children}</div>
      {foot}
    </section>
  );
}

function RvRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="cws__rv-row">
      {icon}
      <span className="cws__rv-row-label">{label}</span>
      {children}
    </div>
  );
}

export default function StepReview({ f }: { f: WorkspaceFlowState }) {
  const {
    setStep, wsName, wsCode, wsStatus, wsVisibility, wsNote, isPrivate, creator,
    project, chosenProjects, rooms, people, assigned, roomsOfUser,
    canPickManagers, amOptions, managerIds,
  } = f;

  return (
    <>
      <div className="cws__rv-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="cws__section-title">Review &amp; Confirm</h2>
          <p className="cws__section-caption">
            Please review all the details below. You can go back to make
            changes if needed.
          </p>
        </div>
        <button type="button" className="cws__ghost" onClick={() => setStep(0)}>
          <EditOutlinedIcon sx={{ fontSize: 16 }} /> Edit All
        </button>
      </div>

      <div className="cws__hero">
        <span className="cws__hero-badge">{initials(wsName) || "W"}</span>

        <div className="cws__hero-ident">
          <h3 className="cws__hero-name">{wsName.trim() || "Untitled"}</h3>
          <p className="cws__hero-key">
            {wsCode ? `Workspace Key: ${wsCode}` : "No workspace key"}
            <span className="cws__hero-chip">{labelOf(STATUSES, wsStatus)}</span>
          </p>
          <p className="cws__hero-date">
            <CalendarMonthOutlinedIcon sx={{ fontSize: 15 }} />
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="cws__hero-stats">
          {[
            { icon: FolderOutlinedIcon, n: chosenProjects.length, label: "Project" },
            { icon: MeetingRoomOutlinedIcon, n: rooms.length, label: "Rooms" },
            { icon: PeopleAltOutlinedIcon, n: assigned.size, label: "Users" },
          ].map(({ icon: Icon, n, label }) => (
            <div key={label} className="cws__stat">
              <Icon sx={{ fontSize: 18, opacity: 0.8 }} />
              <span className="cws__stat-n">{n}</span>
              <span className="cws__stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cws__rv-grid">
        <RvCard icon={FolderOutlinedIcon} title="Project & Rooms">
          {project ? (
            <>
              <div className="cws__rv-project">
                <span className="cws__rv-dot" />
                <span className="cws__rv-project-name">{project.name}</span>
                <span className="cws__proj-pill">
                  {rooms.length} Room{rooms.length === 1 ? "" : "s"}
                </span>
              </div>

              <ul className="cws__rv-rooms">
                {rooms.map((r) => (
                  <li key={r.id} className="cws__rv-room">
                    <span className="cws__tile cws__tile--sm cws__tile--project">
                      <MeetingRoomOutlinedIcon sx={{ fontSize: 16 }} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="cws__rv-room-name">{r.name}</span>
                      <span className="cws__rv-room-meta">
                        {r.memberIds.length} User
                        {r.memberIds.length === 1 ? "" : "s"}
                      </span>
                    </span>
                  </li>
                ))}
                {rooms.length === 0 && <p className="cws__empty">No rooms.</p>}
              </ul>
            </>
          ) : (
            <p className="cws__empty">No project selected.</p>
          )}
        </RvCard>

        <RvCard
          icon={PeopleAltOutlinedIcon}
          title="Assigned Users"
          foot={
            <footer className="cws__rv-card-foot">
              <span>Total Users</span>
              <strong>{assigned.size}</strong>
            </footer>
          }
        >
          {people.filter((u) => assigned.has(u.id)).map((u) => (
            <div key={u.id} className="cws__rv-user">
              <span className="cws__avatar">{initials(u.name)}</span>
              <span className="cws__rv-user-name">{u.name}</span>
              <span className="cws__rv-user-role">{u.role}</span>
              <span className="cws__proj-pill">
                {roomsOfUser(u.id).map((r) => r.name).join(", ") || "—"}
              </span>
            </div>
          ))}
          {assigned.size === 0 && <p className="cws__empty">Nobody assigned yet.</p>}
        </RvCard>

        <RvCard icon={VerifiedUserOutlinedIcon} title="Workspace Summary">
          <RvRow icon={<FolderOutlinedIcon sx={{ fontSize: 15 }} />} label="Total Projects">
            <span className="cws__rv-row-value">{chosenProjects.length}</span>
          </RvRow>
          <RvRow icon={<MeetingRoomOutlinedIcon sx={{ fontSize: 15 }} />} label="Total Rooms">
            <span className="cws__rv-row-value">{rooms.length}</span>
          </RvRow>
          <RvRow icon={<PeopleAltOutlinedIcon sx={{ fontSize: 15 }} />} label="Total Users">
            <span className="cws__rv-row-value">{assigned.size}</span>
          </RvRow>
          <RvRow icon={<PersonOutlineIcon sx={{ fontSize: 15 }} />} label="Created by">
            <span className="cws__rv-row-value">{creator || "—"}</span>
          </RvRow>
          {canPickManagers && (
            <RvRow icon={<PeopleAltOutlinedIcon sx={{ fontSize: 15 }} />} label="Account managers">
              <span className="cws__rv-row-value">
                {amOptions
                  .filter((m) => managerIds.includes(m.id))
                  .map((m) => m.name)
                  .join(", ") || "—"}
              </span>
            </RvRow>
          )}
          <RvRow
            icon={
              isPrivate ? (
                <LockOutlinedIcon sx={{ fontSize: 15 }} />
              ) : (
                <PublicOutlinedIcon sx={{ fontSize: 15 }} />
              )
            }
            label="Access"
          >
            <span className="cws__proj-pill">{labelOf(VISIBILITY, wsVisibility)}</span>
          </RvRow>
          <RvRow icon={<FlagOutlinedIcon sx={{ fontSize: 15 }} />} label="Workspace Status">
            <span className="cws__proj-pill">{labelOf(STATUSES, wsStatus)}</span>
          </RvRow>
        </RvCard>
      </div>

      <div className="cws__signoff">
        <span className="cws__signoff-icon">
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 22 }} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="cws__signoff-title">You&apos;re all set!</span>
          <span className="cws__signoff-caption">
            Once created, you can start managing your project, rooms and
            users from the workspace.
          </span>
        </span>
      </div>

      {isPrivate && (
        <p className="cws__signoff-note">
          <strong>Private workspace.</strong> Only its assigned users can
          open it, and they sign in with the code <strong>{wsCode}</strong>.
          Anyone else is told it does not exist.
        </p>
      )}

      {wsNote.trim() && <p className="cws__signoff-note">{wsNote}</p>}
    </>
  );
}
