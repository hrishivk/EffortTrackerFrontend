import { userServiceMethood } from "../services/userService";
import type {
  CreateWorkspacePayload,
  Workspace,
  WorkspaceRoom,
} from "../../modules/user/types";


export const fetchWorkspaces = async () => {
  const response = await userServiceMethood.listWorkspaces("/workspaces");
  return response.data.data as Workspace[];
};

/** One workspace with its full tree — `project` and `rooms[].members[]`. */
export const fetchWorkspace = async (id: string) => {
  const response = await userServiceMethood.listWorkspaces(
    `/workspaces?id=${encodeURIComponent(id)}`
  );
  return response.data.data as Workspace;
};


export const createWorkspace = async (data: CreateWorkspacePayload) => {
  const response = await userServiceMethood.createWorkspace("/workspaces", data);
  return response.data.data as Workspace;
};


export const updateWorkspace = async (
  id: string,
  data: Partial<Omit<CreateWorkspacePayload, "rooms">>
) => {
  const response = await userServiceMethood.patchWorkspace(
    `/workspaces?id=${encodeURIComponent(id)}`,
    data
  );
  return response.data.data as Workspace;
};

/** Cascades to every room and assignment under it. */
export const deleteWorkspace = async (id: string) => {
  const response = await userServiceMethood.deleteWorkspace(
    `/workspaces?id=${encodeURIComponent(id)}`
  );
  return response.data;
};


export const joinWorkspace = async (key: string, roomId?: string) => {
  const response = await userServiceMethood.joinWorkspace("/workspaces/join", {
    key,
    ...(roomId ? { room_id: roomId } : {}),
  });
  return response.data;
};


export const createRoom = async (data: {
  workspace_id: string;
  name: string;
  position?: number;
}) => {
  const response = await userServiceMethood.createRoom("/rooms", data);
  return response.data.data as WorkspaceRoom;
};

export const updateRoom = async (
  id: string,
  data: { name?: string; position?: number }
) => {
  const response = await userServiceMethood.patchRoom(
    `/rooms?id=${encodeURIComponent(id)}`,
    data
  );
  return response.data.data as WorkspaceRoom;
};


export const deleteRoom = async (id: string) => {
  const response = await userServiceMethood.deleteRoom(
    `/rooms?id=${encodeURIComponent(id)}`
  );
  return response.data;
};


export const addRoomMember = async (roomId: string, userId: string) => {
  const response = await userServiceMethood.addRoomMember("/room-members", {
    room_id: roomId,
    user_id: userId,
  });
  return response.data.data as WorkspaceRoom;
};


export const removeRoomMember = async (roomId: string, userId: string) => {
  const response = await userServiceMethood.removeRoomMember(
    `/room-members?room_id=${encodeURIComponent(
      roomId
    )}&user_id=${encodeURIComponent(userId)}`
  );
  return response.data.data as {
    room_id: string;
    user_id: string;
    removed: boolean;
  };
};

/** A manager this caller may announce a finished workspace to. */
export type NotifyTarget = {
  id: string;
  fullName: string;
  email?: string;
  role: string;
  /** True for the caller's own manager — the one most likely to want telling. */
  is_my_manager?: boolean;
};

/**
 * Who can be told. Purpose-built for this picker: it works for an SP or an AM
 * caller, already leaves the caller out, and flags their own manager.
 *
 * Not `list-users?role=AM`, which looks like it would do the job and does not:
 * it is `AdminOrSuperAdmin`-guarded, silently scopes to `manager_id = caller`
 * for an AM — so an AM asking for AMs gets nothing — and ignores `role=SP`
 * entirely, since SP accounts are excluded from that list globally.
 */
export const fetchNotifyTargets = async (): Promise<NotifyTarget[]> => {
  const response = await userServiceMethood.listNotifyTargets(
    "/workspaces/notify-targets"
  );
  /*
   * The wrapper is `{ success, message, data }` everywhere, but `list-users`
   * nests one level deeper than the rest, so the shape here is worth reading
   * defensively rather than assuming which of the two this one follows.
   */
  const body = response.data;
  const rows = [body?.data, body?.data?.targets, body?.data?.users, body].find(
    (candidate) => Array.isArray(candidate)
  );
  return (rows ?? []) as NotifyTarget[];
};

/**
 * Tell the chosen managers a workspace is finished.
 *
 * `user_ids` is who to notify — the reader picked them, so the API does not
 * have to work out an audience. Resolves once it has been sent.
 */
export const notifyWorkspaceCompleted = async (
  workspaceId: string,
  userIds: string[]
) => {
  const response = await userServiceMethood.notifyWorkspaceCompleted(
    "/workspaces/notify-completed",
    { workspace_id: workspaceId, user_ids: userIds }
  );
  return response.data;
};
