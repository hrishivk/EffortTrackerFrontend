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
