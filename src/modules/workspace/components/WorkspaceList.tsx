import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiGlobe, FiLock, FiUsers } from "react-icons/fi";

import TableList from "../../../shared/components/Table/Table";
import type { Column } from "../../../shared/components/Table/types";
import { fetchWorkspacePage } from "../../../core/actions/workspaceAction";
import { useAppSelector } from "../../../store/configureStore";
import { visibleWorkspaces, WORKSPACES_CHANGED } from "../data/workspaceHelpers";
import type { Workspace } from "../../user/types";

/**
 * Every workspace a manager can see, as a table.
 *
 * The sidebar lists workspaces as a tree, which is right for a member: two or
 * three of them, each one somewhere they work, so the list is their navigation.
 * A manager has every workspace in the system — or every one they raised — a
 * list that grows without limit and that they read across rather than navigate
 * into. That is a table, so SP and AM get this page and the tree stops at
 * members.
 */

/** Rows asked for per request, and the page size the pager counts in. */
const ITEMS_PER_PAGE = 10;

const STATUS_FACE: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: "Planning", color: "#d97706", bg: "rgba(245, 158, 11, 0.14)" },
  active: { label: "Active", color: "#16a34a", bg: "rgba(34, 197, 94, 0.14)" },
  on_hold: { label: "On Hold", color: "#64748b", bg: "rgba(100, 116, 139, 0.16)" },
  completed: { label: "Completed", color: "#2563eb", bg: "rgba(59, 130, 246, 0.14)" },
};

const showDate = (value?: string | null) => {
  if (!value) return "--";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "--"
    : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const projectName = (ws: Workspace) => ws.project?.name ?? "";

/** The list nests rooms now, so the names are already in hand. */
const roomNames = (ws: Workspace) => (ws.rooms ?? []).map((r) => r.name);

const countOf = (ws: Workspace, key: "room_count" | "member_count") =>
  ws[key] ?? (key === "room_count" ? ws.rooms?.length ?? 0 : 0);

export default function WorkspaceList() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const rolePath = `/${(role ?? "").toLowerCase()}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWorkspacePage({ page, limit: ITEMS_PER_PAGE });
      setWorkspaces(res.data);
      setTotalPages(res.totalPages);
    } catch {
      setWorkspaces([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Created, renamed or deleted elsewhere — the same event the sidebar listens
  // for, so the two never disagree about what exists.
  useEffect(() => {
    const onChanged = () => void load();
    window.addEventListener(WORKSPACES_CHANGED, onChanged);
    return () => window.removeEventListener(WORKSPACES_CHANGED, onChanged);
  }, [load]);

  /**
   * The same scoping the sidebar applies: an SP sees everything, an AM sees
   * what they raised. Kept in the one helper so a page and a tree cannot drift
   * into giving different answers to the same question.
   *
   * It is a guard, not the fix. The server is the one that should be scoping
   * this list (docs: `GET /workspaces` must return only what the caller is in),
   * and while it over-returns, dropping rows here after the server has already
   * cut the page leaves a page shorter than its count claims. That is a reason
   * to fix the API, not to widen this.
   */
  const rows = useMemo(
    () => visibleWorkspaces(workspaces, user ?? undefined),
    [workspaces, user]
  );

  const open = (ws: Workspace) =>
    navigate(`${rolePath}/workspace?ws=${encodeURIComponent(ws.id)}`);

  const columns: Column<Workspace>[] = [
    {
      key: "name",
      header: "Workspace",
      width: "30%",
      render: (ws) => (
        <div className="um-user-name">
          <div className="um-avatar">{(ws.name[0] ?? "W").toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <button
              type="button"
              className="task-name-btn"
              title={`Open ${ws.name}`}
              onClick={() => open(ws)}
            >
              {ws.name}
            </button>
            {ws.description && (
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "var(--text-faint)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "min(320px, 24vw)",
                }}
              >
                {ws.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (ws) =>
        projectName(ws) ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#7c3aed",
              backgroundColor: "rgba(124, 58, 237, 0.12)",
              padding: "3px 10px",
              borderRadius: 8,
              whiteSpace: "nowrap",
            }}
          >
            {projectName(ws)}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (ws) => {
        const face = STATUS_FACE[ws.status] ?? {
          label: ws.status,
          color: "var(--text-muted)",
          bg: "var(--bg-hover)",
        };
        return (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: face.color,
              backgroundColor: face.bg,
              padding: "3px 10px",
              borderRadius: 7,
              whiteSpace: "nowrap",
            }}
          >
            {face.label}
          </span>
        );
      },
    },
    {
      key: "rooms",
      header: "Rooms",
      render: (ws) => {
        const names = roomNames(ws);
        const total = countOf(ws, "room_count");
        if (!total) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>--</span>;
        return (
          <span
            className="d-flex align-items-center gap-1"
            style={{ flexWrap: "wrap" }}
            // Every room, even the ones the chips had to drop.
            title={names.join(", ")}
          >
            {names.slice(0, 2).map((n) => (
              <span
                key={n}
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--bg-hover)",
                  padding: "2px 8px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {n}
              </span>
            ))}
            {total > names.slice(0, 2).length && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-faint)" }}>
                +{total - names.slice(0, 2).length}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "members",
      header: "People",
      render: (ws) => (
        <span
          className="d-flex align-items-center gap-1"
          style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}
          title="Distinct people across its rooms"
        >
          <FiUsers size={12} style={{ color: "var(--text-faint)" }} />
          {countOf(ws, "member_count")}
        </span>
      ),
    },
    {
      key: "visibility",
      header: "Access",
      render: (ws) => {
        const shut = ws.visibility === "private";
        return (
          <span
            className="d-flex align-items-center gap-1"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: shut ? "#d97706" : "#16a34a",
              backgroundColor: shut ? "rgba(245, 158, 11, 0.14)" : "rgba(34, 197, 94, 0.14)",
              padding: "3px 9px",
              borderRadius: 7,
              width: "fit-content",
              whiteSpace: "nowrap",
            }}
            title={
              shut
                ? "Private — its members sign in with the workspace code"
                : "Public — anyone in the organisation can open it"
            }
          >
            {shut ? <FiLock size={11} /> : <FiGlobe size={11} />}
            {shut ? "Private" : "Public"}
          </span>
        );
      },
    },
    {
      key: "created",
      header: "Created",
      render: (ws) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          {showDate(ws.created_at)}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      width: 110,
      render: (ws) => (
        <button className="btn btn-sm um-view-tasks-btn" onClick={() => open(ws)}>
          Open
        </button>
      ),
    },
  ];

  return (
    <motion.div
      className="um-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="um-header">
        <div className="um-title">
          <h2>Workspaces</h2>
          <p>
            {role === "SP"
              ? "Every workspace in the system"
              : "The workspaces you have set up"}
          </p>
        </div>

        {/*
         * Setting one up is the AM's job. An SP reads across every workspace in
         * the system from here; raising them is not what this page is for.
         */}
        {role === "AM" && (
          <div className="um-filters">
            <button
              className="um-add-btn"
              onClick={() => navigate(`${rolePath}/workspace-setup`)}
            >
              + New Workspace
            </button>
          </div>
        )}
      </div>

      <TableList<Workspace>
        columns={columns}
        data={rows}
        // The rows handed over are already one page, cut by the server, so the
        // table renders them as given and only drives the pager.
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
        emptyMessage={
          loading
            ? "Loading workspaces..."
            : "No workspaces yet"
        }
      />
    </motion.div>
  );
}
