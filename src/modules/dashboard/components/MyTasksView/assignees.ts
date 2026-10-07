import type { formUserData } from "../../../../shared/types/User";
import type { UserId } from "./types";

export const projectsForMember = (projects: any[], memberId: UserId) =>
  projects.filter((p) =>
    (p.teamAssigned || []).some((member: any) => String(member.id) === String(memberId))
  );

const hasRole = (u: formUserData, roles: string[]) =>
  roles.includes((u.role || "").toUpperCase());

export const reportsOf = (users: formUserData[], role: string | undefined) =>
  role === "SP" ? users.filter((u) => hasRole(u, ["AM"])) : users.filter((u) => hasRole(u, ["USER", "DEVLOPER"]));

export function scopeAssignees({
  role,
  isUserOrDev,
  users,
  projects,
  formProject,
  viewUserId,
}: {
  role: string | undefined;
  isUserOrDev: boolean;
  users: formUserData[];
  projects: any[];
  formProject: string;
  viewUserId?: string;
}) {
  const scoped = (() => {
    if (isUserOrDev) return { assignableUsers: [] as formUserData[], noMembersAssigned: false };

    const baseUsers = reportsOf(users, role);
    if (!formProject) return { assignableUsers: baseUsers, noMembersAssigned: false };

    const selectedProject = projects.find((p) => p.name === formProject);
    if (!selectedProject) return { assignableUsers: baseUsers, noMembersAssigned: false };

    const projectId = String(selectedProject.id);
    const projectMembers = baseUsers.filter((u) => {
      if (!u.projects || !Array.isArray(u.projects)) return false;
      return u.projects.some((p: any) => String(p.id) === projectId);
    });

    return {
      assignableUsers: projectMembers,
      noMembersAssigned: projectMembers.length === 0,
    };
  })();

  const viewedUser = viewUserId
    ? users.find((u) => String(u.id) === String(viewUserId))
    : undefined;

  const assignableUsers =
    viewedUser &&
    !scoped.assignableUsers.some((u) => String(u.id) === String(viewedUser.id))
      ? [viewedUser, ...scoped.assignableUsers]
      : scoped.assignableUsers;

  return {
    assignableUsers,
    noMembersAssigned: scoped.noMembersAssigned && assignableUsers.length === 0,
  };
}
