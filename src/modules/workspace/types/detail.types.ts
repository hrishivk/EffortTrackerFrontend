import type { Workspace, WorkspaceRoom, WorkspaceStatus } from "../../user/types";
import type { useAnnounce } from "../components/detail/useAnnounce";
import type { useCoManagers } from "../components/detail/useCoManagers";
import type { AssignablePerson } from "./people.types";

export type AnnounceState = ReturnType<typeof useAnnounce>;

export type CoManagersState = ReturnType<typeof useCoManagers>;

export interface WorkspaceHeroProps {
  workspace: Workspace;
  roomCount: number;
  memberCount: number;
  canManage: boolean;
  canAssignManagers: boolean;
  showAssign: boolean;
  busy: boolean;
  copied: boolean;
  onCopyKey: () => void;
  onSetStatus: (status: WorkspaceStatus) => void;
  onAssign: () => void;
  onDelete: () => void;
}

export interface RoomsChartProps {
  workspace: Workspace;
  rooms: WorkspaceRoom[];
  rolePath: string;
  canManage: boolean;
  busy: boolean;
  onAdd: () => void;
  onRename: (room: WorkspaceRoom) => void;
  onDelete: (room: WorkspaceRoom) => void;
}

export interface RoomCardProps {
  room: WorkspaceRoom;
  workspaceId: string;
  rolePath: string;
  canManage: boolean;
  busy: boolean;
  onRename: (room: WorkspaceRoom) => void;
  onDelete: (room: WorkspaceRoom) => void;
}

export interface AnnounceStripProps {
  announcedTo: number;
  onAnnounce: () => void;
}

export interface AnnounceDialogProps {
  workspace: Workspace;
  announce: AnnounceState;
}

export interface CoManagersDialogProps {
  workspace: Workspace;
  canAssignManagers: boolean;
  co: CoManagersState;
}

export interface AddRoomDialogProps {
  open: boolean;
  busy: boolean;
  projectName?: string;
  newName: string;
  setNewName: (value: string) => void;
  people: AssignablePerson[];
  loadingPeople: boolean;
  picked: string[];
  setPicked: (ids: string[]) => void;
  onClose: () => void;
  onCreate: () => void;
}

export interface RenameRoomDialogProps {
  editing: WorkspaceRoom | null;
  busy: boolean;
  editName: string;
  setEditName: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export interface WorkspaceNotFoundProps {
  onBack: () => void;
}

export interface WorkspaceNotOpenProps {
  reason: string;
  onBack: () => void;
}

export interface WorkspaceLockedProps {
  name: string;
  codeTry: string;
  setCodeTry: (value: string) => void;
  unlocking: boolean;
  onUnlock: () => void;
  onBack: () => void;
}
