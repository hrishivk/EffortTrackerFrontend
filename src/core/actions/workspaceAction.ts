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


export const fetchWorkspacePage = async (pagination?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Workspace[]; totalPages: number }> => {
  const response = await userServiceMethood.listWorkspaces("/workspaces", pagination);
  const body = response.data ?? {};
  const rows = (body.data ?? []) as Workspace[];

 
  const limit = pagination?.limit || rows.length || 1;
  const totalPages =
    body.totalPages ??
    (typeof body.total === "number" ? Math.ceil(body.total / limit) : 1);

  return { data: rows, totalPages: Math.max(1, Number(totalPages) || 1) };
};

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


export type NotifyTarget = {
  id: string;
  fullName: string;
  email?: string;
  role: string;

  is_my_manager?: boolean;
};


export const fetchNotifyTargets = async (): Promise<NotifyTarget[]> => {
  const response = await userServiceMethood.listNotifyTargets(
    "/workspaces/notify-targets"
  );

  const body = response.data;    
  const rows = [body?.data, body?.data?.targets, body?.data?.users, body].find(
    (candidate) => Array.isArray(candidate)
  );
  return (rows ?? []) as NotifyTarget[];
};

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
