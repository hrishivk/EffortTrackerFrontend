import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import TagIcon from "@mui/icons-material/Tag";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { useAppSelector } from "../../../store/configureStore";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { createWorkspace } from "../../../core/actions/workspaceAction";
import { fetchAllExistProjects } from "../../../core/actions/spAction";
import {
  fetchAssignablePeople,
  type AssignablePerson,
} from "../data/assignablePeople";
import type { WorkspaceStatus, WorkspaceVisibility } from "../../user/types";
import { draftId, initials } from "../data/workspaceHelpers";

/**
 * Create Workspace — a four-step wizard.
 *
 *   1. Workspace Details   name it
 *   2. Projects & Rooms    assign projects, then build the rooms inside each
 *   3. Assign Users        drag people into rooms
 *   4. Review & Create     confirm
 *
 * Projects and rooms share a step because a room only means anything inside a
 * project: the step lists the projects as cards, one is picked, and its rooms
 * are created underneath — so the hierarchy is visible rather than described.
 *
 * A workspace covers a single project, so choosing a different card discards
 * the rooms built under the previous one; they could never have been saved.
 *
 * A step only unlocks once the one before it has what it needs, so a user can
 * only be put in a room that exists.
 *
 * There are no workspace or room endpoints yet, so this holds everything in
 * state and finishes with a summary rather than a save.
 */

/** Only what the wizard needs off `/list-projects` and `/list-users`. */
interface PickProject {
  id: string;
  name: string;
}

interface DraftRoom {
  id: string;
  name: string;
  projectId: string;
  memberIds: string[];
}

/** Matches `.cws__input`, so the selects sit level with the text fields. */
const selectSx = {
  "& .MuiOutlinedInput-root": {
    height: 44,
    borderRadius: "10px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      borderWidth: 1,
      boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.12)",
    },
  },
  "& .MuiSvgIcon-root": { color: "var(--text-faint)" },
};

const menuProps = {
  PaperProps: {
    sx: {
      borderRadius: 2.5,
      marginTop: 0.5,
      backgroundColor: "var(--bg-card)",
      backgroundImage: "none",
      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
      "& .MuiMenuItem-root": { fontSize: 13, color: "var(--text-primary)" },
    },
  },
};


/**
 * The caps the API validates on. Enforced in the inputs so a 400 is something
 * that only happens if the two ever drift apart.
 */
const MAX = { name: 60, code: 20, description: 2000, room: 40 };

const VISIBILITY = [
  {
    value: "private",
    label: "Private",
    caption: "Only its assigned users, signing in with the workspace code.",
    icon: LockOutlinedIcon,
  },
  {
    value: "public",
    label: "Public",
    caption: "Anyone in the organisation can open it.",
    icon: PublicOutlinedIcon,
  },
];

const STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
];






/**
 * One row of the live summary beside the form. An unfilled row is dimmed rather
 * than hidden, so the card shows what is still missing.
 */
function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className={`cws__fact${value ? "" : " cws__fact--empty"}`}>
      <span className="cws__fact-icon">
        <Icon sx={{ fontSize: 15 }} />
      </span>
      <dt className="cws__fact-label">{label}</dt>
      <dd className="cws__fact-value">{value || "Not set"}</dd>
    </div>
  );
}

const STEPS = [
  { label: "Workspace Details", caption: "Name your workspace" },
  { label: "Projects & Rooms", caption: "Add projects and create rooms" },
  { label: "Assign Users", caption: "Add users to rooms" },
  { label: "Review & Create", caption: "Review settings & create" },
];

/** The title + caption every step opens with. */
function SectionHead({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="cws__section-head">
      <h2 className="cws__section-title">{title}</h2>
      <p className="cws__section-caption">{caption}</p>
    </div>
  );
}

/** The server's own message, which names the offending room or user ids. */
const apiMessage = (error: unknown, fallback: string): string => {
  const res = (error as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message || fallback;
};

export default function WorkspaceFlow() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { user } = useAppSelector((state) => state.user);
  /** The workspace is created by whoever is signed in, so this is not editable. */
  const creator = user?.fullName
    ? user.fullName.charAt(0).toUpperCase() + user.fullName.slice(1)
    : "";
  /** Leaving the wizard goes back to wherever the manager came from. */
  const leave = () => navigate(-1);
  const roleBase = `/${(user?.role ?? "").toLowerCase()}`;

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<PickProject[]>([]);
  const [people, setPeople] = useState<AssignablePerson[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);

  const [wsName, setWsName] = useState("");
  const [wsNote, setWsNote] = useState("");
  const [wsStatus, setWsStatus] = useState("planning");
  const [wsCode, setWsCode] = useState("");
  const [wsVisibility, setWsVisibility] = useState("private");

  /** The one project this workspace covers. */
  const [projectId, setProjectId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<DraftRoom[]>([]);
  /** The project whose "Add Room" tile is currently an input. */
  const [roomFor, setRoomFor] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  /** Anchor for the project options menu. */
  const [menu, setMenu] = useState<{ id: string; el: HTMLElement } | null>(null);

  const [dragUser, setDragUser] = useState<string | null>(null);
  const [overRoom, setOverRoom] = useState<string | null>(null);
  /** True while a room member is being dragged over the unassign strip. */
  const [overPool, setOverPool] = useState(false);
  /** The + reveals the faces waiting to be placed. */
  const [poolOpen, setPoolOpen] = useState(false);
  /** Anchor for a room's "Add User" picker. */
  const [addFor, setAddFor] = useState<{ roomId: string; el: HTMLElement } | null>(null);

  const project = projects.find((p) => p.id === projectId) ?? null;
  /** Kept as a list so the review and the summary read the same as before. */
  const chosenProjects = project ? [project] : [];
  const userOf = (id: string) => people.find((u) => u.id === id);

  const assigned = useMemo(
    () => new Set(rooms.flatMap((r) => r.memberIds)),
    [rooms]
  );
  /**
   * Everyone assignable, not only those not yet placed — a person can be in
   * several rooms, so being in one must not take them out of the pool.
   */
  const unplaced = people.filter((u) => !assigned.has(u.id)).length;

  /** Anyone not already in that particular room. */
  const candidatesFor = (roomId: string) => {
    const here = rooms.find((r) => r.id === roomId)?.memberIds ?? [];
    return people.filter((u) => !here.includes(u.id));
  };

  /** Every room a person is in, for the review list. */
  const roomsOfUser = (userId: string) =>
    rooms.filter((r) => r.memberIds.includes(userId));

  /** Drops a user from every room, back to being unplaced. */
  const unassign = (userId: string) =>
    setRooms((rs) =>
      rs.map((r) => ({ ...r, memberIds: r.memberIds.filter((id) => id !== userId) }))
    );

  const labelOf = (list: { value: string; label: string }[], v: string) =>
    list.find((x) => x.value === v)?.label ?? "";
  // Drives the meter on the summary card: the two required fields plus the
  // optional ones worth filling in.
  const details = [wsName.trim(), wsCode, wsNote.trim()];
  const filled = details.filter(Boolean).length;
  const completeness = Math.round((filled / details.length) * 100);

  /**
   * Access to a private workspace is by code, so one without a code would lock
   * out the very users it was created for. Required when private, optional
   * when public.
   */
  const isPrivate = wsVisibility === "private";
  const codeMissing = isPrivate && !wsCode.trim();

  const roomsStaffed = rooms.length > 0 && rooms.every((r) => r.memberIds.length > 0);
  const ready = [
    !!wsName.trim() && !codeMissing,
    !!projectId && rooms.length > 0,
    roomsStaffed,
    true,
  ];

  const pickProject = (id: string) => {
    if (id === projectId) return;
    setProjectId(id);
    // Rooms belong to a project, so they do not survive the switch.
    setRooms([]);
    setRoomFor(null);
    setRoomName("");
  };

  const clearRooms = () => {
    setRooms([]);
    setMenu(null);
  };

  const addRoom = () => {
    const name = roomName.trim();
    if (!name || !projectId) return;
    setRooms((rs) => [...rs, { id: draftId("r"), name, projectId, memberIds: [] }]);
    // The field stays open so several rooms can be typed in a row.
    setRoomName("");
  };

  /**
   * Adds, rather than moves. A person can be in several rooms of one
   * workspace, so joining one leaves their other memberships alone.
   */
  const putInRoom = (roomId: string, userId: string) =>
    setRooms((rs) =>
      rs.map((r) =>
        r.id === roomId && !r.memberIds.includes(userId)
          ? { ...r, memberIds: [...r.memberIds, userId] }
          : r
      )
    );

  const removeFromRoom = (roomId: string, userId: string) =>
    setRooms((rs) =>
      rs.map((r) =>
        r.id === roomId
          ? { ...r, memberIds: r.memberIds.filter((id) => id !== userId) }
          : r
      )
    );

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetchAllExistProjects();
      const rows = (res?.data ?? []) as { id: string; name: string }[];
      setProjects(rows.map((r) => ({ id: String(r.id), name: r.name })));
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not load projects"),
        severity: "error",
      });
    } finally {
      setLoadingProjects(false);
    }
  }, [showSnackbar]);

  /**
   * The people who can be put in a room are the ones assigned to the chosen
   * project, so the list is read per project rather than once for everybody.
   *
   * `list-users` takes `project_id` and caps at 100 rows. Scoping the request
   * matters for both reasons: it is the right set, and one project is far less
   * likely to hit the cap than the whole organisation. The rows are filtered
   * again here against each user's own `projects`, so the pool is correct even
   * if the parameter is ever ignored server-side.
   */
  const loadPeople = useCallback(
    async (project: string) => {
      setLoadingPeople(true);
      try {
        setPeople(await fetchAssignablePeople(project, user));
      } catch (error) {
        showSnackbar({
          message: apiMessage(error, "Could not load the project's users"),
          severity: "error",
        });
        setPeople([]);
      } finally {
        setLoadingPeople(false);
      }
    },
    [showSnackbar, user]
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!projectId) {
      setPeople([]);
      return;
    }
    void loadPeople(projectId);
  }, [projectId, loadPeople]);

  /**
   * The one write the wizard makes. The server creates the workspace, every
   * room and every assignment in a single transaction, so a failure leaves
   * nothing behind and the user can just correct and press again.
   */
  const finish = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await createWorkspace({
        name: wsName.trim(),
        // Blank optional fields are omitted rather than sent as "".
        ...(wsCode.trim() ? { code: wsCode.trim() } : {}),
        status: wsStatus as WorkspaceStatus,
        visibility: wsVisibility as WorkspaceVisibility,
        ...(wsNote.trim() ? { description: wsNote.trim() } : {}),
        project_id: projectId,
        rooms: rooms.map((r, i) => ({
          name: r.name.trim(),
          position: i,
          member_ids: r.memberIds,
        })),
      });
      setDone(true);
    } catch (error) {
      // The server's message names the offending room or user ids, so it is
      // more useful than anything we could write here.
      showSnackbar({
        message: apiMessage(error, "Failed to create workspace"),
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  /** Clears the draft only — the fetched pickers are still valid. */
  const restart = () => {
    setStep(0);
    setDone(false);
    setWsName("");
    setWsNote("");
    setWsStatus("planning");
    setWsCode("");
    setWsVisibility("private");
    setProjectId(null);
    setRooms([]);
    setRoomFor(null);
    setRoomName("");
    setPoolOpen(false);
  };

  // ─── Done ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="cws">
        <div className="cws__finished">
          <CheckCircleIcon sx={{ fontSize: 52, color: "#16a34a" }} />
          <h2 className="cws__finished-title">{wsName} is ready</h2>
          <p className="cws__finished-caption">
            {chosenProjects.length} project{chosenProjects.length === 1 ? "" : "s"},{" "}
            {rooms.length} room{rooms.length === 1 ? "" : "s"} and {assigned.size} member
            {assigned.size === 1 ? "" : "s"} created.
          </p>
          <div className="cws__finished-actions">
            <button type="button" className="cws__ghost" onClick={restart}>
              Create another
            </button>
            <button type="button" className="cws__primary" onClick={leave}>
              Done <ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cws">
      {/* ─── Header ─── */}
      <div className="cws__head">
        <span className="cws__tile cws__tile--brand">
          <WorkspacesOutlinedIcon sx={{ fontSize: 21 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="cws__title">Create Workspace</h1>
          <p className="cws__caption">
            Set up your workspace in a few simple steps and get your team organized.
          </p>
        </div>
        <button type="button" className="cws__x" onClick={leave} title="Close">
          <CloseIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      {/* ─── Stepper ─── */}
      <ol className="cws__steps">
        {STEPS.map((s, i) => {
          const state = i === step ? "on" : i < step ? "past" : "next";
          return (
            <li key={s.label} className={`cws__step cws__step--${state}`}>
              <button
                type="button"
                className="cws__step-btn"
                // Only a completed step can be jumped back to.
                disabled={i > step}
                onClick={() => setStep(i)}
              >
                <span className="cws__step-dot">
                  {i < step ? <CheckIcon sx={{ fontSize: 16 }} /> : i + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="cws__step-label">{s.label}</span>
                  <span className="cws__step-caption">{s.caption}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && <span className="cws__step-link" />}
            </li>
          );
        })}
      </ol>

      {/* ─── Step content ─── */}
      <div className="cws__main">
        {/* 1 — details */}
        {step === 0 && (
          <>
            <SectionHead
              title="Workspace Details"
              caption="Give the workspace a name your team will recognise."
            />
            <div className="cws__split">
              <div className="cws__form">
                <p className="cws__label">
                  Workspace name<span className="cws__req">*</span>
                </p>
                <input
                  autoFocus
                  className="cws__input"
                  maxLength={MAX.name}
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Product Delivery"
                />

                <div className="cws__grid">
                  <div>
                    <p className="cws__label">
                      Workspace code
                      {isPrivate && <span className="cws__req">*</span>}
                    </p>
                    <input
                      className="cws__input"
                      maxLength={MAX.code}
                      value={wsCode}
                      onChange={(e) => setWsCode(e.target.value.toUpperCase())}
                      placeholder="e.g. PD-2026"
                    />
                    {isPrivate && (
                      <p
                        className={`cws__note${
                          codeMissing ? " cws__note--warn" : ""
                        }`}
                      >
                        {codeMissing
                          ? "A private workspace needs a code — its members sign in with it."
                          : "Members sign in to this workspace with this code."}
                      </p>
                    )}
                  </div>
                  <div>
                    {/*
                     * Two chips rather than a dropdown: the choice is binary and
                     * both options are worth seeing at once. The line underneath
                     * carries the consequence of whichever is picked.
                     */}
                    <p className="cws__label">Access</p>
                    <div className="cws__chips" role="radiogroup" aria-label="Access">
                      {VISIBILITY.map(({ value, label, icon: Icon }) => {
                        const on = wsVisibility === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            className={`cws__chip${on ? " cws__chip--on" : ""}`}
                            onClick={() => setWsVisibility(value)}
                          >
                            <Icon sx={{ fontSize: 15 }} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="cws__note">
                      {VISIBILITY.find((v) => v.value === wsVisibility)?.caption}
                    </p>
                  </div>
                  <div>
                    <p className="cws__label">Creator</p>
                    <input
                      readOnly
                      className="cws__input cws__input--locked"
                      value={creator}
                      placeholder="Signed-in user"
                    />
                  </div>
                  <div>
                    <p className="cws__label">Status</p>
                    <FormControl fullWidth size="small" sx={selectSx}>
                      <Select
                        value={wsStatus}
                        onChange={(e) => setWsStatus(e.target.value)}
                        MenuProps={menuProps}
                      >
                        {STATUSES.map((x) => (
                          <MenuItem key={x.value} value={x.value}>
                            {x.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                </div>

                <p className="cws__label">Description (optional)</p>
                <textarea
                  className="cws__textarea"
                  maxLength={MAX.description}
                  value={wsNote}
                  onChange={(e) => setWsNote(e.target.value)}
                  placeholder="What does this workspace cover?"
                />
              </div>

              {/* Fills the right of the step, and shows the form taking shape. */}
              <aside className="cws__side">
                <div className="cws__side-card">
                  <div className="cws__side-banner">
                    <span className="cws__side-badge">{initials(wsName) || "W"}</span>
                    <span className="cws__side-ident">
                      <span className="cws__side-name">
                        {wsName.trim() || "Untitled workspace"}
                      </span>
                      <span className="cws__side-caption">
                        {wsCode || "No code yet"}
                      </span>
                    </span>
                    <span className="cws__side-chip">
                      {labelOf(STATUSES, wsStatus)}
                    </span>
                  </div>

                  <dl className="cws__facts">
                    <Fact icon={TagIcon} label="Code" value={wsCode} />
                    <Fact
                      icon={isPrivate ? LockOutlinedIcon : PublicOutlinedIcon}
                      label="Access"
                      value={labelOf(VISIBILITY, wsVisibility)}
                    />
                    <Fact icon={PersonOutlineIcon} label="Creator" value={creator} />
                  </dl>

                  <div className="cws__meter">
                    <span className="cws__meter-top">
                      <span className="cws__meter-label">Details filled</span>
                      <span className="cws__meter-count">
                        {filled}/{details.length}
                      </span>
                    </span>
                    <span className="cws__meter-track">
                      <span
                        className="cws__meter-fill"
                        style={{ width: `${completeness}%` }}
                      />
                    </span>
                  </div>
                </div>

                <div className="cws__side-next">
                  <p className="cws__side-next-title">What happens next</p>
                  <ol className="cws__side-steps">
                    <li>Pick the project this workspace covers.</li>
                    <li>Create the rooms (teams) inside it.</li>
                    <li>Assign people to each room.</li>
                  </ol>
                </div>
              </aside>
            </div>
          </>
        )}

        {/* 2 — projects, and the rooms inside each */}
        {step === 1 && (
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
                      {on ? (
                        <CheckIcon sx={{ fontSize: 15 }} />
                      ) : (
                        <AddCircleIcon sx={{ fontSize: 16 }} />
                      )}
                    </span>
                  </button>
                );
              })}

              {loadingProjects && (
                <p className="cws__empty">Loading projects…</p>
              )}
            </div>

            {/*
             * Nothing to pick from. A workspace covers one project and takes
             * its people from that project's team, so both are prerequisites —
             * the steps say so rather than leaving the step looking broken.
             */}
            {!loadingProjects && projects.length === 0 && (
              <div className="cws__setup">
                <span className="cws__setup-icon">
                  <FolderOutlinedIcon sx={{ fontSize: 24 }} />
                </span>

                <h3 className="cws__setup-title">No projects yet</h3>
                <p className="cws__setup-caption">
                  A workspace covers one project, and its rooms are staffed from
                  that project's team. Create one first:
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
                      onClick={() => {
                        setRoomFor(project.id);
                        setRoomName("");
                      }}
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
                            onClick={() =>
                              setRooms((rs) => rs.filter((x) => x.id !== r.id))
                            }
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
                          onClick={() => {
                            setRoomFor(project.id);
                            setRoomName("");
                          }}
                        >
                          <AddCircleIcon sx={{ fontSize: 18 }} /> Add Room
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <p className="cws__empty">
                Select a project above to start creating its rooms.
              </p>
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
                  setRoomFor(menu.id);
                  setRoomName("");
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
        )}

        {/* 3 — assign users */}
        {step === 2 && (
          <>
            <SectionHead
              title="Assign Users to Rooms"
              caption="Organize your team by adding users to the right rooms."
            />

            <div className="cws__assign">
              {/* The pool of people to place: a + that pops the faces open. */}
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
                    ? `Nobody is assigned to ${
                        project?.name ?? "this project"
                      }, and no shared users`
                    : poolOpen
                      ? "Drag an avatar into a room — one person can be in several"
                      : `${people.length} user${
                          people.length === 1 ? "" : "s"
                        }, ${unplaced} not yet placed`}
                </p>

                {poolOpen && people.length > 0 && (
                  <div className="cws__faces">
                    {people.map((u, i) => (
                      <div
                        key={u.id}
                        draggable
                        // Staggered, so the faces arrive one after another.
                        style={{ animationDelay: `${i * 55}ms` }}
                        onDragStart={(e: DragEvent<HTMLDivElement>) => {
                          e.dataTransfer.effectAllowed = "move";
                          // Firefox needs a payload for the drag to begin.
                          e.dataTransfer.setData("text/plain", u.id);
                          setDragUser(u.id);
                        }}
                        onDragEnd={() => {
                          setDragUser(null);
                          setOverRoom(null);
                          setOverPool(false);
                        }}
                        className={`cws__face${dragUser === u.id ? " cws__face--dragging" : ""}`}
                        title={`${u.name} — ${u.role}${
                          u.shared ? " · shared user" : ""
                        }`}
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

              {/* The project and its rooms */}
              <div className="cws__board">
                <header className="cws__board-head">
                  <span className="cws__tile cws__tile--sm cws__tile--project">
                    <FolderOutlinedIcon sx={{ fontSize: 17 }} />
                  </span>
                  <h3 className="cws__board-title">
                    Project: {project?.name ?? "—"}
                  </h3>
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
                          <span className="cws__rcard-num">
                            {r.memberIds.length}
                          </span>
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
                                draggable
                                onDragStart={(e: DragEvent<HTMLDivElement>) => {
                                  e.dataTransfer.effectAllowed = "move";
                                  e.dataTransfer.setData("text/plain", id);
                                  setDragUser(id);
                                }}
                                onDragEnd={() => {
                                  setDragUser(null);
                                  setOverRoom(null);
                                  setOverPool(false);
                                }}
                                className={`cws__member${dragUser === id ? " cws__member--dragging" : ""}`}
                              >
                                <span className="cws__avatar cws__avatar--sm">
                                  {initials(u?.name ?? "?")}
                                </span>
                                <span style={{ minWidth: 0, flex: 1 }}>
                                  <span className="cws__person-name">{u?.name}</span>
                                  <span className="cws__person-role">
                                    {u?.role}
                                    {u?.shared && (
                                      <span className="cws__shared-tag">Shared</span>
                                    )}
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
                            <p className="cws__rcard-empty">
                              Drop a user here, or add one below.
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          className="cws__rcard-add"
                          disabled={candidatesFor(r.id).length === 0}
                          onClick={(e) =>
                            setAddFor({ roomId: r.id, el: e.currentTarget })
                          }
                        >
                          <AddIcon sx={{ fontSize: 17 }} /> Add User
                        </button>
                      </div>
                    );
                  })}

                  {rooms.length === 0 && (
                    <p className="cws__empty">
                      No rooms yet — go back a step to create one.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dropping here pulls someone back out of their room. */}
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
                <span className="cws__unassign-title">
                  Drag users here to remove from rooms
                </span>
                <span className="cws__unassign-caption">
                  Takes them out of every room in this workspace
                </span>
              </span>
            </div>

            {/* Picks who joins a room without needing a drag. */}
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
                  <span className="cws__avatar cws__avatar--sm">
                    {initials(u.name)}
                  </span>
                  {u.name} — {u.role}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* 4 — review */}
        {step === 3 && (
          <>
            <div className="cws__rv-head">
              <div style={{ minWidth: 0 }}>
                <h2 className="cws__section-title">Review &amp; Confirm</h2>
                <p className="cws__section-caption">
                  Please review all the details below. You can go back to make
                  changes if needed.
                </p>
              </div>
              <button
                type="button"
                className="cws__ghost"
                // Straight back to the first step, where every field lives.
                onClick={() => setStep(0)}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} /> Edit All
              </button>
            </div>

            {/* Hero */}
            <div className="cws__hero">
              <span className="cws__hero-badge">{initials(wsName) || "W"}</span>

              <div className="cws__hero-ident">
                <h3 className="cws__hero-name">{wsName.trim() || "Untitled"}</h3>
                <p className="cws__hero-key">
                  {wsCode ? `Workspace Key: ${wsCode}` : "No workspace key"}
                  <span className="cws__hero-chip">
                    {labelOf(STATUSES, wsStatus)}
                  </span>
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

            {/* Three cards */}
            <div className="cws__rv-grid">
              {/* Project & rooms */}
              <section className="cws__rv-card">
                <header className="cws__rv-card-head">
                  <span className="cws__tile cws__tile--sm cws__tile--project">
                    <FolderOutlinedIcon sx={{ fontSize: 17 }} />
                  </span>
                  <h4 className="cws__rv-card-title">Project &amp; Rooms</h4>
                </header>

                <div className="cws__rv-card-body">
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
                        {rooms.length === 0 && (
                          <p className="cws__empty">No rooms.</p>
                        )}
                      </ul>
                    </>
                  ) : (
                    <p className="cws__empty">No project selected.</p>
                  )}
                </div>
              </section>

              {/* Assigned users */}
              <section className="cws__rv-card">
                <header className="cws__rv-card-head">
                  <span className="cws__tile cws__tile--sm cws__tile--project">
                    <PeopleAltOutlinedIcon sx={{ fontSize: 17 }} />
                  </span>
                  <h4 className="cws__rv-card-title">Assigned Users</h4>
                </header>

                <div className="cws__rv-card-body">
                  {people.filter((u) => assigned.has(u.id)).map((u) => (
                    <div key={u.id} className="cws__rv-user">
                      <span className="cws__avatar">{initials(u.name)}</span>
                      <span className="cws__rv-user-name">{u.name}</span>
                      <span className="cws__rv-user-role">{u.role}</span>
                      <span className="cws__proj-pill">
                        {roomsOfUser(u.id)
                          .map((r) => r.name)
                          .join(", ") || "—"}
                      </span>
                    </div>
                  ))}
                  {assigned.size === 0 && (
                    <p className="cws__empty">Nobody assigned yet.</p>
                  )}
                </div>

                <footer className="cws__rv-card-foot">
                  <span>Total Users</span>
                  <strong>{assigned.size}</strong>
                </footer>
              </section>

              {/* Summary */}
              <section className="cws__rv-card">
                <header className="cws__rv-card-head">
                  <span className="cws__tile cws__tile--sm cws__tile--project">
                    <VerifiedUserOutlinedIcon sx={{ fontSize: 17 }} />
                  </span>
                  <h4 className="cws__rv-card-title">Workspace Summary</h4>
                </header>

                <div className="cws__rv-card-body">
                  <div className="cws__rv-row">
                    <FolderOutlinedIcon sx={{ fontSize: 15 }} />
                    <span className="cws__rv-row-label">Total Projects</span>
                    <span className="cws__rv-row-value">{chosenProjects.length}</span>
                  </div>
                  <div className="cws__rv-row">
                    <MeetingRoomOutlinedIcon sx={{ fontSize: 15 }} />
                    <span className="cws__rv-row-label">Total Rooms</span>
                    <span className="cws__rv-row-value">{rooms.length}</span>
                  </div>
                  <div className="cws__rv-row">
                    <PeopleAltOutlinedIcon sx={{ fontSize: 15 }} />
                    <span className="cws__rv-row-label">Total Users</span>
                    <span className="cws__rv-row-value">{assigned.size}</span>
                  </div>
                  <div className="cws__rv-row">
                    <PersonOutlineIcon sx={{ fontSize: 15 }} />
                    <span className="cws__rv-row-label">Created by</span>
                    <span className="cws__rv-row-value">{creator || "—"}</span>
                  </div>
                  <div className="cws__rv-row">
                    {isPrivate ? (
                      <LockOutlinedIcon sx={{ fontSize: 15 }} />
                    ) : (
                      <PublicOutlinedIcon sx={{ fontSize: 15 }} />
                    )}
                    <span className="cws__rv-row-label">Access</span>
                    <span className="cws__proj-pill">
                      {labelOf(VISIBILITY, wsVisibility)}
                    </span>
                  </div>
                  <div className="cws__rv-row">
                    <FlagOutlinedIcon sx={{ fontSize: 15 }} />
                    <span className="cws__rv-row-label">Workspace Status</span>
                    <span className="cws__proj-pill">
                      {labelOf(STATUSES, wsStatus)}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Sign-off */}
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

            {wsNote.trim() && (
              <p className="cws__signoff-note">{wsNote}</p>
            )}
          </>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="cws__foot">
        {step > 0 ? (
          <button type="button" className="cws__ghost" onClick={() => setStep(step - 1)}>
            <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
          </button>
        ) : (
          <span />
        )}

        <div className="cws__progress">
          <span className="cws__progress-label">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="cws__progress-bar">
            {STEPS.map((s, i) => (
              <span
                key={s.label}
                className={`cws__progress-seg${i <= step ? " cws__progress-seg--on" : ""}`}
              />
            ))}
          </span>
        </div>

        <div className="cws__foot-right">
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="cws__primary"
              disabled={!ready[step]}
              onClick={() => setStep(step + 1)}
            >
              Continue <ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />
            </button>
          ) : (
            <button
              type="button"
              className="cws__primary"
              disabled={saving}
              onClick={() => void finish()}
            >
              {saving ? (
                <CircularProgress size={15} sx={{ color: "#fff" }} />
              ) : (
                <RocketLaunchOutlinedIcon sx={{ fontSize: 17 }} />
              )}
              Create Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
