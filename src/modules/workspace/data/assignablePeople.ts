import { fetchUsers } from "../../../core/actions/spAction";

/**
 * Who can be put into a workspace's rooms.
 *
 * Two sources: the chosen project's own team, and the shared users, who are
 * available to every manager whatever project they are on. The wizard and the
 * room page both need this, and the rule is subtle enough that two copies
 * would drift — so it lives here.
 */

/**
 * Roles that manage rather than sit in a room, so they are never offered as
 * room members. Add to this rather than filtering at a call site — the wizard
 * and the room page both read this module so the two stay in step.
 */
const NON_MEMBER_ROLES = ["AM"];

const isMemberRole = (role: string) =>
  !NON_MEMBER_ROLES.includes((role || "").toUpperCase());

export interface AssignablePerson {
  id: string;
  name: string;
  role: string;
  /** Which projects they are on, used to re-check the server's scoping. */
  projectIds: string[];
  /** Available to every manager, so assignable whatever the project. */
  shared: boolean;
  /** The manager who owns them, when the server says. */
  managerId: string;
}

interface UserRow {
  id?: string;
  fullName: string;
  role: string;
  projects?: { id: string; name: string }[];
  is_shared?: boolean;
  /** The manager who owns this user. See `ownedBy` below. */
  manager_id?: string | number | null;
}

const toPerson = (u: UserRow): AssignablePerson => ({
  id: String(u.id),
  name: u.fullName,
  role: u.role,
  projectIds: (u.projects ?? []).map((x) => String(x.id)),
  shared: !!u.is_shared,
  managerId: u.manager_id == null ? "" : String(u.manager_id),
});

/**
 * Whether this person is the viewing manager's to assign.
 *
 * A manager may only put **their own** users into a workspace. One manager's
 * team has no business appearing in another manager's room, and it is what
 * keeps a workspace out of the wrong people's sidebar: assign nobody from
 * another manager's team and nobody from it can see the workspace.
 *
 * Three ways through:
 *
 * - **SP** assigns anyone. They administer the system.
 * - **Shared users** are assignable by every manager — that is what
 *   `is_shared` means, and it is deliberate (they were asked for explicitly).
 * - **No `manager_id` on the row** passes as well, and that is the important
 *   case today: `GET /list-users` does not currently return the field, so
 *   this filter is a no-op until the backend adds it. It cannot empty the
 *   picker in the meantime, and it starts working the day the field arrives.
 *   Round 9 in docs/workspace-api.md asks for it.
 *
 * The real scoping belongs on `list-users` regardless — this decides what to
 * offer, not what the server is willing to hand over.
 */
const ownedBy = (
  person: AssignablePerson,
  manager?: { id?: string | number | null; role?: string } | null
): boolean => {
  if (manager?.role === "SP") return true;
  if (person.shared) return true;
  if (!person.managerId) return true;
  return person.managerId === String(manager?.id);
};

/**
 * Throws only if both reads fail — one source failing still gives a usable
 * list, which matters more here than completeness.
 *
 * `list-users` has no `is_shared` filter, so the shared half needs an unscoped
 * read capped at 100 rows; see the note in docs/workspace-api.md. The
 * project-scoped read is kept as well so the team is never truncated by that
 * cap.
 */
export const fetchAssignablePeople = async (
  projectId: string,
  /** The manager doing the assigning — their team is the pool. */
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
          // Re-checked here, so the list is right even if the server ever
          // ignores `project_id`.
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

  // The project row wins on a clash, so `projectIds` stays populated.
  const byId = new Map(shared.map((u) => [u.id, u]));
  team.forEach((u) => byId.set(u.id, u));
  return [...byId.values()];
};
