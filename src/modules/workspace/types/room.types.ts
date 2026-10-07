import type { WorkspaceRoom } from "../../user/types";
import type { AssignablePerson } from "./people.types";

export type RoomMember = WorkspaceRoom["members"][number];

export type Candidate = AssignablePerson & { currentRooms: string[] };

export interface RingNode {
  member: RoomMember;
  left: number;
  top: number;
  side: "right" | "left";
  dot: { left: number; top: number } | null;
}

export interface Ring {
  start: number;
  end: number;
  ry: number;
  nodes: RingNode[];
}

export interface RoomMemberNodeProps {
  node: RingNode;
  canManage: boolean;
  canOpen: boolean;
  tasksPath: string;
  onRemove: (id: string, name: string) => void;
}

export interface RoomLegendProps {
  byRole: [string, number][];
  total: number;
}

export interface RoomFanProps {
  candidates: Candidate[];
  busy: boolean;
  drag: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}
