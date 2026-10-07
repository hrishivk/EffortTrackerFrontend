import { useEffect, useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import type { Workspace, WorkspaceStatus } from "../../../user/types";
import { STATUS_CHOICES, STATUS_LABEL } from "./constants";

interface WorkspaceHeroProps {
  workspace: Workspace;
  roomCount: number;
  memberCount: number;
  canManage: boolean;
  canAssignManagers: boolean;
  showAssign: boolean;
  busy: boolean;
  copied: boolean;
  onCopyKey: () => void;
  onSetStatus: (status: WorkspaceStatus) => void;
  onAssign: () => void;
  onDelete: () => void;
}

export default function WorkspaceHero({
  workspace,
  roomCount,
  memberCount,
  canManage,
  canAssignManagers,
  showAssign,
  busy,
  copied,
  onCopyKey,
  onSetStatus,
  onAssign,
  onDelete,
}: WorkspaceHeroProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusOpen && !menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (statusRef.current && !statusRef.current.contains(target)) {
        setStatusOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setStatusOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [statusOpen, menuOpen]);

  return (
    <div className="wsd__hero">
      <span className="wsd__hero-badge">
        {(workspace.name[0] ?? "W").toUpperCase()}
      </span>

      <div className="wsd__hero-ident">
        <h2 className="wsd__hero-name">
          {workspace.name}
          <span className={`wsd__hero-chip wsd__hero-chip--${workspace.status}`}>
            <span className="wsd__hero-chip-dot" aria-hidden />
            {STATUS_LABEL[workspace.status] ?? workspace.status}
          </span>
        </h2>

        {canManage ? (
          <p className="wsd__hero-key">
            {workspace.code ? `Workspace Key: ${workspace.code}` : "No workspace key"}
            {workspace.code && (
              <button
                type="button"
                className="wsd__copy"
                title={copied ? "Copied" : "Copy key"}
                onClick={onCopyKey}
              >
                {copied ? (
                  <CheckIcon sx={{ fontSize: 14 }} />
                ) : (
                  <ContentCopyIcon sx={{ fontSize: 13 }} />
                )}
              </button>
            )}
          </p>
        ) : (
          workspace.project?.name && (
            <p className="wsd__hero-key">{workspace.project.name}</p>
          )
        )}

        <p className="wsd__hero-date">
          <CalendarMonthOutlinedIcon sx={{ fontSize: 15 }} />
          Created:{" "}
          {new Date(workspace.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>

        {canManage && !!workspace.managers?.length && (
          <p className="wsd__hero-date">
            <ManageAccountsOutlinedIcon sx={{ fontSize: 15 }} />
            Managed with: {workspace.managers.map((m) => m.fullName).join(", ")}
          </p>
        )}
      </div>

      <div className="wsd__stats">
        {[
          { icon: FolderOutlinedIcon, n: workspace.project ? 1 : 0, label: "Projects" },
          { icon: MeetingRoomOutlinedIcon, n: roomCount, label: "Rooms" },
          { icon: PeopleAltOutlinedIcon, n: memberCount, label: "Users" },
        ].map(({ icon: Icon, n, label }) => (
          <div key={label} className="wsd__stat">
            <span className="wsd__stat-icon">
              <Icon sx={{ fontSize: 19 }} />
            </span>
            <span className="wsd__stat-label">{label}</span>
            <span className="wsd__stat-n">{n}</span>
          </div>
        ))}
      </div>

      {canManage && (
        <>
          <div className="wsd__status" ref={statusRef}>
            <p className="wsd__status-label">
              Workspace status
              <span
                className="wsd__status-info"
                title="Decides who can open this workspace"
              >
                <InfoOutlinedIcon sx={{ fontSize: 15 }} />
              </span>
            </p>

            <button
              type="button"
              className="wsd__status-pill"
              aria-haspopup="listbox"
              aria-expanded={statusOpen}
              disabled={busy}
              onClick={() => {
                setMenuOpen(false);
                setStatusOpen((open) => !open);
              }}
            >
              {busy ? (
                <CircularProgress size={11} sx={{ color: "#fff" }} />
              ) : (
                <span
                  className={`wsd__status-dot wsd__status-dot--${workspace.status}`}
                  aria-hidden
                />
              )}
              {STATUS_LABEL[workspace.status] ?? workspace.status}
              <KeyboardArrowDownIcon
                className={`wsd__status-caret${statusOpen ? " wsd__status-caret--up" : ""}`}
                sx={{ fontSize: 21 }}
              />
            </button>

            {statusOpen && (
              <div
                className="wsd__drop wsd__drop--status"
                role="listbox"
                aria-label="Workspace status"
              >
                {STATUS_CHOICES.map((c) => {
                  const on = c.value === workspace.status;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={`wsd__drop-row${on ? " wsd__drop-row--on" : ""}`}
                      disabled={busy}
                      onClick={() => {
                        setStatusOpen(false);
                        onSetStatus(c.value);
                      }}
                    >
                      <span
                        className={`wsd__status-dot wsd__status-dot--${c.value}`}
                        aria-hidden
                      />
                      <span className="wsd__drop-text">
                        <b>{c.label}</b>
                        <small>{c.note}</small>
                      </span>
                      {on && <CheckIcon sx={{ fontSize: 15 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {canAssignManagers && (
            <div className="wsd__more" ref={menuRef}>
              <button
                type="button"
                className="wsd__more-btn"
                title="Workspace actions"
                aria-label="Workspace actions"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  setStatusOpen(false);
                  setMenuOpen((open) => !open);
                }}
              >
                <MoreVertIcon sx={{ fontSize: 21 }} />
              </button>

              {menuOpen && (
                <div className="wsd__drop" role="menu">
                  {showAssign && (
                    <button
                      type="button"
                      role="menuitem"
                      className="wsd__drop-row"
                      disabled={busy}
                      onClick={() => {
                        setMenuOpen(false);
                        onAssign();
                      }}
                    >
                      <ManageAccountsOutlinedIcon sx={{ fontSize: 18 }} />
                      Assign
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="wsd__drop-row wsd__drop-row--danger"
                    disabled={busy}
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    Delete workspace
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
