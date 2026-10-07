import { useState, type Dispatch, type SetStateAction } from "react";
import {
  assignWorkspaceManagers,
  fetchWorkspaceManagerCandidates,
  removeWorkspaceManager,
  type WorkspaceManager,
} from "../../../../core/actions/workspaceAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import { notifyWorkspacesChanged } from "../../data/workspaceHelpers";
import type { Workspace } from "../../../user/types";
import type { ManagerRef } from "../../types";

export function useCoManagers(
  workspace: Workspace | null,
  setWorkspace: Dispatch<SetStateAction<Workspace | null>>
) {
  const { showSnackbar } = useSnackbar();
  const [coOpen, setCoOpen] = useState(false);
  const [coCandidates, setCoCandidates] = useState<WorkspaceManager[]>([]);
  const [coLoading, setCoLoading] = useState(false);
  const [coPicked, setCoPicked] = useState<string[]>([]);
  const [coSaving, setCoSaving] = useState(false);
  const [coRemoving, setCoRemoving] = useState<string | null>(null);

  const applyManagers = (managers: WorkspaceManager[]) =>
    setWorkspace((ws) =>
      ws
        ? { ...ws, managers: managers.map(({ id, fullName }) => ({ id, fullName })) }
        : ws
    );

  const loadCoCandidates = async (workspaceId: string) => {
    setCoLoading(true);
    try {
      setCoCandidates(await fetchWorkspaceManagerCandidates(workspaceId));
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not load the account managers"),
        severity: "error",
      });
      setCoCandidates([]);
    } finally {
      setCoLoading(false);
    }
  };

  const openCoManagers = () => {
    if (!workspace) return;
    setCoPicked([]);
    setCoOpen(true);
    void loadCoCandidates(workspace.id);
  };

  const assignCoManagers = async () => {
    if (!workspace || coPicked.length === 0) return;
    setCoSaving(true);
    try {
      applyManagers(await assignWorkspaceManagers(workspace.id, coPicked));
      showSnackbar({
        message:
          coPicked.length === 1
            ? "Account manager assigned"
            : `${coPicked.length} account managers assigned`,
        severity: "success",
      });
      setCoPicked([]);
      await loadCoCandidates(workspace.id);
      notifyWorkspacesChanged();
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not assign those managers"),
        severity: "error",
      });
    } finally {
      setCoSaving(false);
    }
  };

  const removeCoManager = async (manager: ManagerRef) => {
    if (!workspace) return;
    setCoRemoving(manager.id);
    try {
      applyManagers(await removeWorkspaceManager(workspace.id, manager.id));
      showSnackbar({
        message: `${manager.fullName} unassigned from ${workspace.name}`,
        severity: "success",
      });
      await loadCoCandidates(workspace.id);
      notifyWorkspacesChanged();
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not unassign that manager"),
        severity: "error",
      });
    } finally {
      setCoRemoving(null);
    }
  };

  return {
    coOpen,
    setCoOpen,
    coCandidates,
    coLoading,
    coPicked,
    setCoPicked,
    coSaving,
    coRemoving,
    openCoManagers,
    assignCoManagers,
    removeCoManager,
  };
}

export type CoManagersState = ReturnType<typeof useCoManagers>;
