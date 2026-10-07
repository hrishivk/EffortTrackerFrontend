import { fetchUsers } from "../../../core/actions/spAction";
import type { AssignablePerson, UserRow } from "../types";

export type { AssignablePerson };


const NON_MEMBER_ROLES = ["AM"];

const isMemberRole = (role: string) =>
  !NON_MEMBER_ROLES.includes((role || "").toUpperCase());

const toPerson = (u: UserRow): AssignablePerson => ({
  id: String(u.id),
  name: u.fullName,
  role: u.role,
  projectIds: (u.projects ?? []).map((x) => String(x.id)),
  shared: !!u.is_shared,
  managerId: u.manager_id == null ? "" : String(u.manager_id),
});

const ownedBy = (
  person: AssignablePerson,
  manager?: { id?: string | number | null; role?: string } | null
): boolean => {
  if (manager?.role === "SP") return true;
  if (person.shared) return true;
  if (!person.managerId) return true;
  return person.managerId === String(manager?.id);
};

export const fetchAssignablePeople = async (
  projectId: string,
  manager?: { id?: string | number | null; role?: string } | null
): Promise<AssignablePerson[]> => {
  const [teamRes, sharedRes] = await Promise.allSettled([
    fetchUsers({ project_id: projectId, limit: 100 }),
    fetchUsers({ limit: 100 }),
  ]);

  if (teamRes.status === "rejected" && sharedRes.status === "rejected") {
    throw teamRes.reason;
  }

  const team =
    teamRes.status === "fulfilled"
      ? (teamRes.value?.users ?? [])
          .filter((u) => !!u.id)
          .map(toPerson)
          .filter((u) => u.projectIds.includes(projectId))
          .filter((u) => isMemberRole(u.role))
          .filter((u) => ownedBy(u, manager))
      : [];

  const shared =
    sharedRes.status === "fulfilled"
      ? (sharedRes.value?.users ?? [])
          .filter((u) => !!u.id)
          .map(toPerson)
          .filter((u) => u.shared)
          .filter((u) => isMemberRole(u.role))
          .filter((u) => ownedBy(u, manager))
      : [];

  const byId = new Map(shared.map((u) => [u.id, u]));
  team.forEach((u) => byId.set(u.id, u));
  return [...byId.values()];
};
