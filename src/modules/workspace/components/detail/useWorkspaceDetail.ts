import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  addRoomMember,
  createRoom,
  deleteRoom,
  deleteWorkspace,
  fetchWorkspace,
  joinWorkspace,
  updateRoom,
  updateWorkspace,
} from "../../../../core/actions/workspaceAction";
import {
  fetchAssignablePeople,
  type AssignablePerson,
} from "../../data/assignablePeople";
import { useAppSelector } from "../../../../store/configureStore";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import {
  canManageWorkspace,
  notifyWorkspacesChanged,
} from "../../data/workspaceHelpers";
import type {
  Workspace,
  WorkspaceRoom,
  WorkspaceStatus,
} from "../../../user/types";
import { STATUS_LABEL } from "./constants";

export function useWorkspaceDetail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showSnackbar } = useSnackbar();
  const [params] = useSearchParams();
  const id = params.get("ws");
  const rolePath = pathname.split("/")[1] ?? "";
  const { user } = useAppSelector((state) => state.user);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [people, setPeople] = useState<AssignablePerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [editing, setEditing] = useState<WorkspaceRoom | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<WorkspaceRoom | null>(null);
  const [pendingWsDelete, setPendingWsDelete] = useState(false);
  const [codeTry, setCodeTry] = useState("");
  const [unlocking, setUnlocking] = useState(false);

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
  const memberCount = useMemo(
    () => new Set(rooms.flatMap((r) => r.members.map((m) => m.id))).size,
    [rooms]
  );

  const canManage = canManageWorkspace(workspace, user);
  const canAssignManagers =
    workspace?.can_assign_managers ??
    (user?.role === "SP" ||
      (!!workspace?.created_by &&
        String(workspace.created_by) === String(user?.id)));

  const openAdd = () => {
    setNewName("");
    setPicked([]);
    setAdding(true);
    if (!workspace?.project?.id || people.length) return;
    setLoadingPeople(true);
    void fetchAssignablePeople(String(workspace.project.id), user)
      .then(setPeople)
      .catch(() => setPeople([]))
      .finally(() => setLoadingPeople(false));
  };

  const unlock = async () => {
    const key = codeTry.trim();
    if (!key || !workspace) return;
    setUnlocking(true);
    try {
      await joinWorkspace(key);
      setCodeTry("");
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
      const room = await createRoom({
        workspace_id: workspace.id,
        name,
        position: rooms.length,
      });

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

  const startRename = (room: WorkspaceRoom) => {
    setEditName(room.name);
    setEditing(room);
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

  const copyKey = async () => {
    if (!workspace?.code) return;
    try {
      await navigator.clipboard.writeText(workspace.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showSnackbar({ message: "Could not copy the key", severity: "error" });
    }
  };

  return {
    user,
    rolePath,
    workspace,
    setWorkspace,
    loading,
    rooms,
    memberCount,
    canManage,
    canAssignManagers,
    busy,
    copied,
    copyKey,
    adding,
    setAdding,
    newName,
    setNewName,
    picked,
    setPicked,
    people,
    loadingPeople,
    openAdd,
    addRoom,
    editing,
    setEditing,
    editName,
    setEditName,
    startRename,
    renameRoom,
    pendingDelete,
    setPendingDelete,
    removeRoom,
    pendingWsDelete,
    setPendingWsDelete,
    removeWorkspace,
    codeTry,
    setCodeTry,
    unlocking,
    unlock,
    setStatus,
  };
}
