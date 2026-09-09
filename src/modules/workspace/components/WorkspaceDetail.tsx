import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import {
  addRoomMember,
  createRoom,
  deleteRoom,
  deleteWorkspace,
  fetchWorkspace,
  joinWorkspace,
  updateRoom,
  updateWorkspace,
} from "../../../core/actions/workspaceAction";
import {
  fetchAssignablePeople,
  type AssignablePerson,
} from "../data/assignablePeople";
import { useAppSelector } from "../../../store/configureStore";
import Dialoge from "../../../presentation/Dialog";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import {
  canManageWorkspace,
  initials,
  notifyWorkspacesChanged,
  workspaceGate,
} from "../data/workspaceHelpers";
import type {
  Workspace,
  WorkspaceRoom,
  WorkspaceStatus,
} from "../../user/types";



/** How many room cards share a row before the chart wraps to the next. */
const ROOMS_PER_ROW = 4;

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
};

/**
 * The statuses a manager can move a workspace between, with what each one
 * means for the people in it — the choice decides who can open the workspace,
 * so the menu says so rather than leaving it to be discovered.
 */
const STATUS_CHOICES: { value: WorkspaceStatus; label: string; note: string }[] = [
  { value: "planning", label: "Planning", note: "Members cannot open it yet" },
  { value: "active", label: "Active", note: "Open to everyone in its rooms" },
  { value: "on_hold", label: "On Hold", note: "Closed to members for now" },
];

const apiMessage = (error: unknown, fallback: string): string => {
  const res = (error as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message || fallback;
};

export default function WorkspaceDetail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showSnackbar } = useSnackbar();
  const [params] = useSearchParams();
  const id = params.get("id");
  const rolePath = pathname.split("/")[1] ?? "";

  const { user } = useAppSelector((state) => state.user);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  /** The add-room dialog, its name field and the members picked in it. */
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [people, setPeople] = useState<AssignablePerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  /** The room being renamed, and its draft name. */
  const [editing, setEditing] = useState<WorkspaceRoom | null>(null);
  const [editName, setEditName] = useState("");
  /** The room awaiting delete confirmation. */
  const [pendingDelete, setPendingDelete] = useState<WorkspaceRoom | null>(null);
  /** Whether the workspace itself is awaiting delete confirmation. */
  const [pendingWsDelete, setPendingWsDelete] = useState(false);
  /** The workspace code being typed at the lock screen. */
  const [codeTry, setCodeTry] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  /**
   * `silent` re-reads without the full-page spinner.
   *
   * Every mutation calls this to pick up the server's version, and showing the
   * loading state each time blanked the whole page for the length of the round
   * trip — a rename looked like it had worked and then flashed a second later.
   * The spinner belongs to the first load only.
   */
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!id) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      setWorkspace(await fetchWorkspace(id));
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not load that workspace"),
        severity: "error",
      });
      setWorkspace(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  const rooms = useMemo(() => workspace?.rooms ?? [], [workspace]);

  /**
   * The chart in rows of at most four. One row of everything overflowed the
   * page sideways once a workspace had more than five rooms; chunking keeps
   * each card readable and grows the chart downward instead.
   */
  const roomRows = useMemo(() => {
    const out: (typeof rooms)[] = [];
    for (let i = 0; i < rooms.length; i += ROOMS_PER_ROW) {
      out.push(rooms.slice(i, i + ROOMS_PER_ROW));
    }
    return out;
  }, [rooms]);

  /**
   * Rooms are the workspace creator's to manage — and SP's. Derived from
   * `created_by` rather than the role, so one AM cannot restructure another
   * AM's workspace. The server has to enforce it too; see docs/workspace-api.md.
   */
  const canManage = canManageWorkspace(workspace, user);

  const openAdd = () => {
    setNewName("");
    setPicked([]);
    setAdding(true);
    if (!workspace?.project?.id || people.length) return;
    // The candidates are the project's team plus the shared users; the same
    // rule the wizard and the room page use.
    setLoadingPeople(true);
    void fetchAssignablePeople(String(workspace.project.id), user)
      .then(setPeople)
      .catch(() => setPeople([]))
      .finally(() => setLoadingPeople(false));
  };

  const togglePicked = (id: string) =>
    setPicked((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    );

  /**
   * Hands the typed code to the server. Deliberately not compared here: the
   * code is returned in the workspace payload and printed on this very page,
   * so a check in the browser would be no check at all.
   */
  const unlock = async () => {
    const key = codeTry.trim();
    if (!key || !workspace) return;
    setUnlocking(true);
    try {
      await joinWorkspace(key);
      setCodeTry("");
      /*
       * The re-read is what opens the page: the server records the access and
       * then answers this request without `locked`, so nothing about the
       * unlock is remembered here. Revoking access takes effect on the next
       * load rather than lingering in the browser.
       */
      await load({ silent: true });
      notifyWorkspacesChanged();
      showSnackbar({
        message: `Unlocked ${workspace.name}`,
        severity: "success",
      });
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "That code did not match this workspace"),
        severity: "error",
      });
    } finally {
      setUnlocking(false);
    }
  };

  const setStatus = async (status: WorkspaceStatus) => {
    if (!workspace || status === workspace.status) return;
    setBusy(true);
    try {
      await updateWorkspace(workspace.id, { status });
      await load({ silent: true });
      notifyWorkspacesChanged();
      showSnackbar({
        message:
          status === "active"
            ? `${workspace.name} is now Active — its members can open it`
            : `${workspace.name} set to ${STATUS_LABEL[status]}`,
        severity: "success",
      });
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not change the status"),
        severity: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const addRoom = async () => {
    const name = newName.trim();
    if (!name || !workspace) return;
    setBusy(true);
    try {
      // `position` continues the existing order; `project_id` is left out so
      // the room inherits the workspace's.
      const room = await createRoom({
        workspace_id: workspace.id,
        name,
        position: rooms.length,
      });

      /*
       * The members go on afterwards, because the room has no id until it
       * exists. Settled rather than all-or-nothing: a room that was created
       * should not look like a failure because one assignment did not take —
       * the reload shows exactly who made it in.
       */
      const results = await Promise.allSettled(
        picked.map((userId) => addRoomMember(room.id, userId))
      );
      const failed = results.filter((r) => r.status === "rejected").length;

      setAdding(false);
      setNewName("");
      setPicked([]);
      await load({ silent: true });
      notifyWorkspacesChanged();

      showSnackbar(
        failed
          ? {
              message: `Room "${name}" created, but ${failed} member${
                failed === 1 ? "" : "s"
              } could not be added`,
              severity: "warning",
            }
          : {
              message: picked.length
                ? `Room "${name}" created with ${picked.length} member${
                    picked.length === 1 ? "" : "s"
                  }`
                : `Room "${name}" created`,
              severity: "success",
            }
      );
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not create the room"),
        severity: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const renameRoom = async () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name || name === editing.name) {
      setEditing(null);
      return;
    }
    setBusy(true);
    try {
      await updateRoom(editing.id, { name });
      showSnackbar({
        message: `Renamed to "${name}"`,
        severity: "success",
      });
      setEditing(null);
      await load({ silent: true });
      notifyWorkspacesChanged();
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not rename the room"),
        severity: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const removeRoom = async () => {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    setBusy(true);
    try {
      await deleteRoom(id);
      setPendingDelete(null);
      await load({ silent: true });
      notifyWorkspacesChanged();
      showSnackbar({ message: `Room "${name}" deleted`, severity: "success" });
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not delete the room"),
        severity: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  /*
   * Deleting the workspace takes the page out from under itself, so the
   * navigation happens before the snackbar and there is no reload after it —
   * a re-read would only 404 on a record that is gone.
   *
   * The server is the one that decides this is allowed: an Admin-Manager who
   * did not create the workspace is answered 404, not 403, so the message
   * falls back to the API's own wording rather than guessing at the reason.
   */
  const removeWorkspace = async () => {
    if (!workspace) return;
    const name = workspace.name;
    setBusy(true);
    try {
      await deleteWorkspace(workspace.id);
      setPendingWsDelete(false);
      notifyWorkspacesChanged();
      navigate(`/${rolePath}/dashboard`, { replace: true });
      showSnackbar({ message: `Workspace "${name}" deleted`, severity: "success" });
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not delete the workspace"),
        severity: "error",
      });
      setBusy(false);
    }
  };
  const memberCount = useMemo(
    () => new Set(rooms.flatMap((r) => r.members.map((m) => m.id))).size,
    [rooms]
  );

  const copyKey = async () => {
    if (!workspace?.code) return;
    try {
      await navigator.clipboard.writeText(workspace.code);
      setCopied(true);
      // Reverts on its own, so the tick reads as a confirmation not a state.
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showSnackbar({ message: "Could not copy the key", severity: "error" });
    }
  };

  if (loading) {
    return (
      <div className="wsd">
        <div className="wsl__center">
          <CircularProgress size={26} sx={{ color: "#7c3aed" }} />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="wsd">
        <div className="wsl__center">
          <h2 className="wsl__empty-title">Workspace not found</h2>
          <p className="wsl__empty-caption">
            It may have been deleted, or you may not have access to it.
          </p>
          <button type="button" className="cws__ghost" onClick={() => navigate(-1)}>
            <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
          </button>
        </div>
      </div>
    );
  }

  /*
   * Checked before anything that reads `status`, and that order matters.
   *
   * A locked response is a four-field stub — id, name, visibility, locked —
   * with no `status` on it. Running the status gate first therefore saw
   * `undefined`, decided the workspace was not active, and showed "Not open
   * yet" instead of the key prompt, so the prompt was unreachable.
   *
   * Whether the code is needed is the server's answer, not ours: it checks
   * per request, so the creator, SP and active members simply never come back
   * `locked`.
   */
  if (workspace.locked) {
    return (
      <div className="wsd">
        <div className="wsd__lock">
          <span className="wsd__lock-icon">
            <LockOutlinedIcon sx={{ fontSize: 26 }} />
          </span>
          <h2 className="wsd__lock-title">{workspace.name} is private</h2>
          <p className="wsd__lock-caption">
            Enter the workspace code to open it — your manager has it. It is
            checked every time the workspace is opened.
          </p>

          <div className="wsd__lock-form">
            <input
              autoFocus
              className="cws__input"
              maxLength={20}
              value={codeTry}
              onChange={(e) => setCodeTry(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && codeTry.trim()) void unlock();
              }}
              placeholder="e.g. PD-2026"
              aria-label="Workspace code"
            />
            <button
              type="button"
              className="cws__primary"
              disabled={!codeTry.trim() || unlocking}
              onClick={() => void unlock()}
            >
              {unlocking ? (
                <CircularProgress size={15} sx={{ color: "#fff" }} />
              ) : (
                <LockOutlinedIcon sx={{ fontSize: 17 }} />
              )}
              Unlock
            </button>
          </div>

          <button
            type="button"
            className="cws__ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
          </button>
        </div>
      </div>
    );
  }

  /*
   * The same gate as the sidebar and the list. Checked here too because the
   * others only hide a link — the URL is still typeable, and this is the page
   * the link would have reached.
   */
  const gate = workspaceGate(workspace, user ?? undefined);
  if (!gate.open) {
    return (
      <div className="wsd">
        <div className="wsl__center">
          <span className="cws__tile cws__tile--brand">
            <MeetingRoomOutlinedIcon sx={{ fontSize: 22 }} />
          </span>
          <h2 className="wsl__empty-title">Not open yet</h2>
          <p className="wsl__empty-caption">{gate.reason}</p>
          <button type="button" className="cws__ghost" onClick={() => navigate(-1)}>
            <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wsd">
      {/* ─── Page head ─── */}
      <div className="wsd__head">
        <button
          type="button"
          className="cws__icon-btn"
          title="Back"
          onClick={() => navigate(-1)}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 className="wsd__title">{workspace.name}</h1>
          <p className="wsd__caption">
            The project, rooms and people in this workspace.
          </p>
        </div>
      </div>

      {/* ─── Hero ─── */}
      <div className="wsd__hero">
        <div className="wsd__hero-main">
        <span className="wsd__hero-badge">
          {(workspace.name[0] ?? "W").toUpperCase()}
        </span>

        <div className="wsd__hero-ident">
          <h2 className="wsd__hero-name">
            {workspace.name}
            <span
              className={`wsd__hero-chip wsd__hero-chip--${workspace.status}`}
            >
              <span className="wsd__hero-chip-dot" aria-hidden />
              {STATUS_LABEL[workspace.status] ?? workspace.status}
            </span>
          </h2>

          {/*
            * The key is only shown to the people who hand it out.
            *
            * It stopped being a label the moment it became a credential: a
            * non-member who types it gets a session unlock, so printing it to
            * every member turned each of them into a way to pass access on.
            * A member does not need it — they are already in — so there is
            * nothing lost by hiding it.
            *
            * The server should hold the same line and leave `code` out of the
            * payload for non-managers; this stops it being displayed, not
            * being sent.
            */}
          {canManage ? (
            <p className="wsd__hero-key">
              {workspace.code
                ? `Workspace Key: ${workspace.code}`
                : "No workspace key"}
              {workspace.code && (
                <button
                  type="button"
                  className="wsd__copy"
                  title={copied ? "Copied" : "Copy key"}
                  onClick={() => void copyKey()}
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
            {new Date(workspace.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="wsd__stats">
          {[
            { icon: FolderOutlinedIcon, n: workspace.project ? 1 : 0, label: "Project" },
            { icon: MeetingRoomOutlinedIcon, n: rooms.length, label: "Rooms" },
            { icon: PeopleAltOutlinedIcon, n: memberCount, label: "Users" },
          ].map(({ icon: Icon, n, label }) => (
            <div key={label} className="wsd__stat">
              <Icon sx={{ fontSize: 19, opacity: 0.85 }} />
              <span className="wsd__stat-n">{n}</span>
              <span className="wsd__stat-label">{label}</span>
            </div>
          ))}
        </div>
        </div>

        {/*
         * The life cycle across the foot of the hero: the workspace's
         * identity and the stage it is at are one statement, and the
         * status decides whether anyone else sees any of it.
         */}
        {canManage && (
          <div className="wsd__rail">
            <p className="wsd__rail-label">Workspace status</p>

            {/*
             * The three states as a track, because they are a life cycle rather
             * than an arbitrary set: a workspace is planned, opened, and
             * sometimes paused. Any stage is clickable — the order tells the
             * story, it does not constrain the move.
             */}
            <div className="wsd__rail-track" role="radiogroup" aria-label="Workspace status">
              {STATUS_CHOICES.map((c, i) => {
                const currentIndex = STATUS_CHOICES.findIndex(
                  (x) => x.value === workspace.status
                );
                const on = c.value === workspace.status;
                const behind = i < currentIndex;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`wsd__stage wsd__stage--${c.value}${
                      on ? " wsd__stage--on" : ""
                    }${behind ? " wsd__stage--past" : ""}`}
                    title={c.note}
                    disabled={busy}
                    onClick={() => void setStatus(c.value)}
                  >
                    {/* The rule joining this stage to the next. */}
                    {i < STATUS_CHOICES.length - 1 && (
                      <span className="wsd__stage-line" aria-hidden />
                    )}
                    <span className="wsd__stage-dot">
                      {busy && on ? (
                        <CircularProgress size={10} sx={{ color: "inherit" }} />
                      ) : on ? (
                        <CheckIcon sx={{ fontSize: 12 }} />
                      ) : null}
                    </span>
                    <span className="wsd__stage-name">{c.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="wsd__rail-note">
              {STATUS_CHOICES.find((c) => c.value === workspace.status)?.note}
            </p>

            {/* Set apart from the status track: the stages are reversible,
                this is not. */}
            <button
              type="button"
              className="wsd__danger"
              title={`Delete ${workspace.name}`}
              disabled={busy}
              onClick={() => setPendingWsDelete(true)}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              Delete workspace
            </button>
          </div>
        )}
      </div>

      {/* ─── Description ─── */}
      {workspace.description?.trim() && (
        <div className="wsd__note">
          <InfoOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed", flexShrink: 0 }} />
          {workspace.description}
        </div>
      )}

      {/* ─── Rooms, hung off the workspace ─── */}
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
              onClick={openAdd}
            >
              <AddIcon sx={{ fontSize: 22 }} />
            </button>
          )}
        </div>

        {rooms.length === 0 ? (
          <p className="cws__empty">
            {canManage
              ? "No rooms yet — use Add Room to create the first one."
              : /*
                 * An unlocked non-member gets the shell with `rooms: []`: the
                 * key buys sight of the workspace, a manager still has to put
                 * them in a room. Saying "this workspace has no rooms" would
                 * be wrong — there may be plenty, just none they can see.
                 */
                "You can see this workspace, but not any rooms yet — a manager needs to add you to one."}
          </p>
        ) : (
          /*
           * One chart rather than a chart plus a grid: the branches end in the
           * room cards themselves, so each card is visibly the workspace's
           * child. The connectors are borders, not SVG — the bus is the top
           * edge of each branch, so segments meet with no gap, and the first
           * and last branches trim their outer half.
           */
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
                {/* Carries the spine down from the row above. */}
                {rowIndex > 0 && <span className="wsd__tree-stem" />}
                <div className="wsd__tree-row">
                  {row.map((room) => (
                <div key={room.id} className="wsd__tree-branch">
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
                            onClick={() => {
                              setEditName(room.name);
                              setEditing(room);
                            }}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 16 }} />
                          </button>
                          <button
                            type="button"
                            className="wsd__room-act wsd__room-act--danger"
                            title={`Delete ${room.name}`}
                            aria-label={`Delete ${room.name}`}
                            disabled={busy}
                            onClick={() => setPendingDelete(room)}
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
                          <span className="cws__avatar cws__avatar--sm">
                            {initials(m.fullName)}
                          </span>
                          <span className="wsd__room-member-name">
                            {m.fullName}
                          </span>
                          <span className="wsd__room-member-role">{m.role}</span>
                        </div>
                      ))}
                      {room.members.length > 4 && (
                        <p className="wsd__room-more">
                          +{room.members.length - 4} more
                        </p>
                      )}
                      {room.members.length === 0 && (
                        <p className="wsd__room-more">Nobody in this room yet.</p>
                      )}
                    </div>

                    <Link
                      to={`/${rolePath}/room?ws=${encodeURIComponent(
                        workspace.id
                      )}&id=${encodeURIComponent(room.id)}`}
                      className="wsd__room-enter"
                    >
                      View Room
                      <ChevronRightIcon sx={{ fontSize: 17 }} />
                    </Link>
                  </section>
                </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Name the room and, optionally, staff it in the same step. */}
      <Dialog
        open={adding}
        onClose={() => !busy && setAdding(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              backgroundColor: "var(--bg-card)",
              backgroundImage: "none",
            },
          },
        }}
      >
        <div className="wsd__modal">
          <div className="wsd__modal-head">
            <span className="cws__tile cws__tile--project">
              <MeetingRoomOutlinedIcon sx={{ fontSize: 20 }} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 className="wsd__modal-title">Add a room</h3>
              <p className="wsd__modal-caption">
                Name it, and pick who should be in it.
              </p>
            </div>
            <button
              type="button"
              className="cws__icon-btn"
              title="Close"
              onClick={() => setAdding(false)}
            >
              <CloseIcon sx={{ fontSize: 19 }} />
            </button>
          </div>

          <p className="cws__label">
            Room name<span className="cws__req">*</span>
          </p>
          <input
            autoFocus
            className="cws__input"
            maxLength={40}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) void addRoom();
            }}
            placeholder="e.g. Design Team"
          />

          <p className="cws__label">
            Members{" "}
            <span className="wsd__modal-count">
              {picked.length ? `· ${picked.length} selected` : "· optional"}
            </span>
          </p>

          <div className="wsd__pick">
            {loadingPeople && <p className="cws__empty">Loading users…</p>}
            {!loadingPeople && people.length === 0 && (
              <p className="cws__empty">
                Nobody is assigned to {workspace.project?.name ?? "this project"},
                and no shared users.
              </p>
            )}
            {people.map((u) => {
              const on = picked.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  className={`wsd__pick-row${on ? " wsd__pick-row--on" : ""}`}
                  onClick={() => togglePicked(u.id)}
                >
                  <span className="cws__avatar cws__avatar--sm">
                    {initials(u.name)}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="wsd__pick-name">{u.name}</span>
                    <span className="wsd__pick-role">
                      {u.role}
                      {u.shared && <span className="cws__shared-tag">Shared</span>}
                    </span>
                  </span>
                  <span className="wsd__pick-tick">
                    {on && <CheckIcon sx={{ fontSize: 14 }} />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="wsd__modal-foot">
            <button
              type="button"
              className="cws__ghost"
              disabled={busy}
              onClick={() => setAdding(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="cws__primary"
              disabled={!newName.trim() || busy}
              onClick={() => void addRoom()}
            >
              {busy ? (
                <CircularProgress size={15} sx={{ color: "#fff" }} />
              ) : (
                <AddIcon sx={{ fontSize: 17 }} />
              )}
              Create room
            </button>
          </div>
        </div>
      </Dialog>

      {/* Rename, in a dialog rather than in place: the name is the card's
          heading, and editing it there gave no way to cancel deliberately. */}
      <Dialog
        open={!!editing}
        onClose={() => !busy && setEditing(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              backgroundColor: "var(--bg-card)",
              backgroundImage: "none",
            },
          },
        }}
      >
        <div className="wsd__modal">
          <div className="wsd__modal-head">
            <span className="cws__tile cws__tile--project">
              <EditOutlinedIcon sx={{ fontSize: 20 }} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 className="wsd__modal-title">Rename room</h3>
              <p className="wsd__modal-caption">
                Currently &ldquo;{editing?.name}&rdquo;.
              </p>
            </div>
          </div>

          <p className="cws__label">
            Room name<span className="cws__req">*</span>
          </p>
          <input
            autoFocus
            className="cws__input"
            maxLength={40}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && editName.trim()) void renameRoom();
            }}
          />

          <div className="wsd__modal-foot">
            <button
              type="button"
              className="cws__ghost"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="cws__primary"
              disabled={
                busy || !editName.trim() || editName.trim() === editing?.name
              }
              onClick={() => void renameRoom()}
            >
              {busy ? (
                <CircularProgress size={15} sx={{ color: "#fff" }} />
              ) : (
                <CheckIcon sx={{ fontSize: 17 }} />
              )}
              Save
            </button>
          </div>
        </div>
      </Dialog>

      {/* The app's shared confirm, with the room and its members named — a
          generic "delete this room?" hides what is about to be lost. */}
      <Dialoge
        open={!!pendingDelete}
        data="deleteRoom"
        busy={busy}
        title={`Delete "${pendingDelete?.name}"?`}
        confirmLabel="Yes, Delete Room"
        message={
          pendingDelete?.members.length
            ? `Are you sure you want to delete the room "${pendingDelete.name}" from ` +
              `${workspace.name}? Its ${pendingDelete.members.length} member` +
              `${pendingDelete.members.length === 1 ? "" : "s"} will be taken out of ` +
              // Worth saying: with a person able to be in several rooms,
              // deleting one does not remove them from the workspace.
              `this room, but they stay in the workspace and in any other rooms ` +
              `they belong to. This action cannot be undone.`
            : `Are you sure you want to delete the room "${pendingDelete?.name}" from ` +
              `${workspace.name}? It is removed for everyone in the workspace. ` +
              `This action cannot be undone.`
        }
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void removeRoom()}
      />

      {/* Named, and counted: what goes with the workspace is the whole reason
          to hesitate, so the confirm says how much of it there is. */}
      <Dialoge
        open={pendingWsDelete}
        data="deleteWorkspace"
        busy={busy}
        title={`Delete "${workspace.name}"?`}
        confirmLabel="Yes, Delete Workspace"
        message={
          `Are you sure you want to delete the workspace "${workspace.name}"? ` +
          (rooms.length
            ? `Its ${rooms.length} room${rooms.length === 1 ? "" : "s"} and the ` +
              `${memberCount} member${memberCount === 1 ? "" : "s"} placed in them ` +
              `go with it. `
            : "") +
          // The project outlives the workspace — worth saying, since the
          // workspace is the only place most people see it from.
          `The project itself is not deleted. This action cannot be undone.`
        }
        onClose={() => setPendingWsDelete(false)}
        onConfirm={() => void removeWorkspace()}
      />
    </div>
  );
}
