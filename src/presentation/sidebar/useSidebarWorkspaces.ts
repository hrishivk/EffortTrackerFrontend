import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchWorkspace, fetchWorkspaces } from "../../core/actions/workspaceAction";
import { WORKSPACES_CHANGED } from "../../modules/workspace/data/workspaceHelpers";
import type { Workspace } from "../../modules/user/types";

const WORKSPACE_PAGES = ["/workspace", "/room", "/room-tasks"];

/** Workspace list, the open workspace, and its lazily-fetched room tree. */
export const useSidebarWorkspaces = (pathname: string, search: string) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [openWs, setOpenWs] = useState<string | null>(null);
  const [roomsOpen, setRoomsOpen] = useState(true);
  const [trees, setTrees] = useState<Record<string, Workspace>>({});
  const [loadingTree, setLoadingTree] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    try {
      setWorkspaces(await fetchWorkspaces());
    } catch {
      setWorkspaces([]);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces, pathname]);

  useEffect(() => {
    const onChanged = () => {
      setTrees({});
      void loadWorkspaces();
    };
    window.addEventListener(WORKSPACES_CHANGED, onChanged);
    return () => window.removeEventListener(WORKSPACES_CHANGED, onChanged);
  }, [loadWorkspaces]);

  const activeWsId = useMemo(() => {
    const onWorkspacePage = WORKSPACE_PAGES.some((suffix) => pathname.endsWith(suffix));
    if (!onWorkspacePage) return "";
    return new URLSearchParams(search).get("ws") || "";
  }, [pathname, search]);

  useEffect(() => {
    if (activeWsId) setOpenWs(activeWsId);
  }, [activeWsId]);

  useEffect(() => {
    if (!openWs || trees[openWs]) return;
    let live = true;
    setLoadingTree(true);
    void fetchWorkspace(openWs)
      .then((tree) => {
        if (live) setTrees((t) => ({ ...t, [openWs]: tree }));
      })
      .catch(() => {})
      .finally(() => {
        if (live) setLoadingTree(false);
      });
    return () => {
      live = false;
    };
  }, [openWs, trees]);

  return {
    workspaces,
    openWs,
    setOpenWs,
    roomsOpen,
    toggleRooms: () => setRoomsOpen((o) => !o),
    trees,
    loadingTree,
  };
};

export type SidebarWorkspaces = ReturnType<typeof useSidebarWorkspaces>;
