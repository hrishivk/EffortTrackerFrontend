import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../../store/configureStore";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import {
  assignWorkspaceManagers,
  createWorkspace,
  fetchNotifyTargets,
  fetchWorkspaces,
} from "../../../../core/actions/workspaceAction";
import { fetchAllExistProjects } from "../../../../core/actions/spAction";
import {
  fetchAssignablePeople,
  type AssignablePerson,
} from "../../data/assignablePeople";
import type { WorkspaceStatus, WorkspaceVisibility } from "../../../user/types";
import type { DraftRoom, ManagerOption, PickProject } from "../../types";
import { draftId } from "../../data/workspaceHelpers";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import { toggleId } from "../common/PickList";

export function useWorkspaceFlow() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { user } = useAppSelector((state) => state.user);
  const creator = user?.fullName
    ? user.fullName.charAt(0).toUpperCase() + user.fullName.slice(1)
    : "";
  const leave = () => navigate(-1);
  const roleBase = `/${(user?.role ?? "").toLowerCase()}`;

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<PickProject[]>([]);
  const [people, setPeople] = useState<AssignablePerson[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [usedProjectCount, setUsedProjectCount] = useState(0);
  const [loadingPeople, setLoadingPeople] = useState(true);

  const canPickManagers = user?.role === "AM";
  const [amOptions, setAmOptions] = useState<ManagerOption[]>([]);
  const [loadingAms, setLoadingAms] = useState(false);
  const [managerIds, setManagerIds] = useState<string[]>([]);

  const [wsName, setWsName] = useState("");
  const [wsNote, setWsNote] = useState("");
  const [wsStatus, setWsStatus] = useState("planning");
  const [wsCode, setWsCode] = useState("");
  const [wsVisibility, setWsVisibility] = useState("private");

  const [projectId, setProjectId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<DraftRoom[]>([]);
  const [roomFor, setRoomFor] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [menu, setMenu] = useState<{ id: string; el: HTMLElement } | null>(null);

  const [dragUser, setDragUser] = useState<string | null>(null);
  const [overRoom, setOverRoom] = useState<string | null>(null);
  const [overPool, setOverPool] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const [addFor, setAddFor] = useState<{ roomId: string; el: HTMLElement } | null>(null);

  const project = projects.find((p) => p.id === projectId) ?? null;
  const chosenProjects = project ? [project] : [];
  const userOf = (id: string) => people.find((u) => u.id === id);

  const assigned = useMemo(
    () => new Set(rooms.flatMap((r) => r.memberIds)),
    [rooms]
  );
  const unplaced = people.filter((u) => !assigned.has(u.id)).length;

  const candidatesFor = (roomId: string) => {
    const here = rooms.find((r) => r.id === roomId)?.memberIds ?? [];
    return people.filter((u) => !here.includes(u.id));
  };

  const roomsOfUser = (userId: string) =>
    rooms.filter((r) => r.memberIds.includes(userId));

  const unassign = (userId: string) =>
    setRooms((rs) =>
      rs.map((r) => ({ ...r, memberIds: r.memberIds.filter((id) => id !== userId) }))
    );

  const details = [wsName.trim(), wsCode, wsNote.trim()];
  const filled = details.filter(Boolean).length;
  const completeness = Math.round((filled / details.length) * 100);

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
    setRoomName("");
  };

  const removeRoom = (roomId: string) =>
    setRooms((rs) => rs.filter((x) => x.id !== roomId));

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
      const [res, existing] = await Promise.all([
        fetchAllExistProjects(),
        fetchWorkspaces().catch(() => []),
      ]);
      const used = new Set(
        (existing ?? [])
          .map((ws) => ws.project_id ?? ws.project?.id)
          .filter(Boolean)
          .map(String)
      );
      const rows = (res?.data ?? []) as PickProject[];
      const free = rows.filter((r) => !used.has(String(r.id)));
      setUsedProjectCount(rows.length - free.length);
      setProjects(free.map((r) => ({ id: String(r.id), name: r.name })));
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not load projects"),
        severity: "error",
      });
    } finally {
      setLoadingProjects(false);
    }
  }, [showSnackbar]);

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
    if (!canPickManagers) return;
    setLoadingAms(true);
    fetchNotifyTargets()
      .then((rows) =>
        setAmOptions(
          rows
            .filter((t) => !!t.id && (t.role || "").toUpperCase() === "AM")
            .filter((t) => String(t.id) !== String(user?.id))
            .map((t) => ({ id: String(t.id), name: t.fullName, email: t.email }))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      )
      .catch(() => setAmOptions([]))
      .finally(() => setLoadingAms(false));
  }, [canPickManagers, user?.id]);

  const toggleManager = (id: string) => setManagerIds((list) => toggleId(list, id));

  useEffect(() => {
    if (!projectId) {
      setPeople([]);
      return;
    }
    void loadPeople(projectId);
  }, [projectId, loadPeople]);

  const finish = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const created = await createWorkspace({
        name: wsName.trim(),
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

      if (managerIds.length && created?.id) {
        try {
          await assignWorkspaceManagers(created.id, managerIds);
        } catch (error) {
          showSnackbar({
            message: apiMessage(
              error,
              "Workspace created, but the account managers could not be assigned. Assign them from the workspace page."
            ),
            severity: "warning",
          });
        }
      }
      setDone(true);
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Failed to create workspace"),
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

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
    setManagerIds([]);
    void loadProjects();
  };

  return {
    creator, leave, roleBase,
    step, setStep, done, saving,
    projects, people, loadingProjects, usedProjectCount, loadingPeople,
    canPickManagers, amOptions, loadingAms, managerIds, toggleManager,
    wsName, setWsName, wsNote, setWsNote, wsStatus, setWsStatus,
    wsCode, setWsCode, wsVisibility, setWsVisibility,
    projectId, rooms, roomFor, setRoomFor, roomName, setRoomName, menu, setMenu,
    dragUser, setDragUser, overRoom, setOverRoom, overPool, setOverPool,
    poolOpen, setPoolOpen, addFor, setAddFor,
    project, chosenProjects, userOf, assigned, unplaced, candidatesFor, roomsOfUser,
    unassign, details, filled, completeness, isPrivate, codeMissing, ready,
    pickProject, clearRooms, addRoom, removeRoom, putInRoom, removeFromRoom,
    finish, restart,
  };
}

export type WorkspaceFlowState = ReturnType<typeof useWorkspaceFlow>;
