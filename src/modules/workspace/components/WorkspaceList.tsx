import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import SpinLoader from "../../../presentation/SpinLoader";
import TableList from "../../../shared/components/Table/Table";
import { fetchWorkspacePage } from "../../../core/actions/workspaceAction";
import { useAppSelector } from "../../../store/configureStore";
import { visibleWorkspaces, WORKSPACES_CHANGED } from "../data/workspaceHelpers";
import type { Workspace } from "../../user/types";
import { getWorkspaceColumns } from "./list/workspaceColumns";

const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    const onChanged = () => void load();
    window.addEventListener(WORKSPACES_CHANGED, onChanged);
    return () => window.removeEventListener(WORKSPACES_CHANGED, onChanged);
  }, [load]);

  const rows = useMemo(
    () => visibleWorkspaces(workspaces, user ?? undefined),
    [workspaces, user]
  );

  const columns = getWorkspaceColumns((ws) =>
    navigate(`${rolePath}/workspace?ws=${encodeURIComponent(ws.id)}`)
  );

  return (
    <motion.div
      className="um-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <SpinLoader isLoading={loading} />

      <div className="um-header">
        <div className="um-title">
          <h2>Workspaces</h2>
          <p>
            {role === "SP"
              ? "Every workspace in the system"
              : "The workspaces you have set up"}
          </p>
        </div>

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
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
        emptyMessage={loading ? "" : "No workspaces yet"}
      />
    </motion.div>
  );
}
