import type { AssignablePerson, Candidate, Ring, RoomMember } from "../../types";

export const ORBIT_RX = 19;
const ORBIT_RY_MIN = 24;
const ORBIT_RY_MAX = 40;
const ORBIT_ARC = (Math.PI / 180) * 150;
const ORBIT_STEP = (Math.PI / 180) * 40;
const ORBIT_LEFT_SQUEEZE = 0.78;
const ORBIT_PER_RING = 10;
export const ORBIT_MAX = 40;

const FAN_R = 43;
export const FAN_MAX = 12;

export const buildRings = (members: RoomMember[]): Ring[] => {
  const all = members.slice(0, ORBIT_MAX);
  const out: Ring[] = [];

  for (let start = 0; start < Math.max(all.length, 1); start += ORBIT_PER_RING) {
    const list = all.slice(start, start + ORBIT_PER_RING);
    const rightCount = Math.ceil(list.length / 2);
    const leftCount = list.length - rightCount;
    const ry = Math.min(
      ORBIT_RY_MAX,
      ORBIT_RY_MIN + Math.max(0, rightCount - 1) * 4
    );

    const slot = (column: number, count: number, right: boolean) => {
      const spread =
        Math.min(ORBIT_ARC, Math.max(count - 1, 0) * ORBIT_STEP) *
        (right ? 1 : ORBIT_LEFT_SQUEEZE);
      const offset = count > 1 ? (column / (count - 1) - 0.5) * spread : 0;
      return right ? offset : Math.PI - offset;
    };

    const point = (angle: number) => ({
      left: 50 + Math.cos(angle) * ORBIT_RX,
      top: 50 + Math.sin(angle) * ry,
    });

    out.push({
      start,
      end: start + list.length,
      ry,
      nodes: list.map((m, i) => {
        const right = i < rightCount;
        const column = right ? i : i - rightCount;
        const count = right ? rightCount : leftCount;
        const angle = slot(column, count, right);
        const next = column + 1 < count ? slot(column + 1, count, right) : null;
        return {
          member: m,
          ...point(angle),
          side: right ? "right" : "left",
          dot: next === null ? null : point((angle + next) / 2),
        };
      }),
    });
  }

  return out;
};

export const countByRole = (members: RoomMember[]) => {
  const counts = new Map<string, number>();
  members.forEach((m) => counts.set(m.role, (counts.get(m.role) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

export const buildCandidates = (
  people: AssignablePerson[],
  room: WorkspaceRoom | null,
  rooms: WorkspaceRoom[]
): Candidate[] => {
  const here = new Set((room?.members ?? []).map((m) => m.id));
  const elsewhere = new Map<string, string[]>();
  rooms
    .filter((r) => r.id !== room?.id)
    .forEach((r) =>
      r.members.forEach((m) =>
        elsewhere.set(m.id, [...(elsewhere.get(m.id) ?? []), r.name])
      )
    );
  return people
    .filter((p) => !here.has(p.id))
    .map((p) => ({ ...p, currentRooms: elsewhere.get(p.id) ?? [] }));
};

export const buildFan = (candidates: Candidate[]) => {
  const list = candidates.slice(0, FAN_MAX);
  const step = (Math.PI * 2) / Math.max(list.length, 1);
  const turn = list.length > 1 && list.length % 2 === 0 ? step / 4 : 0;
  return list.map((c, i) => {
    const angle = i * step - Math.PI / 2 + turn;
    return {
      person: c,
      left: 50 + Math.cos(angle) * FAN_R,
      top: 50 + Math.sin(angle) * FAN_R,
    };
  });
};
