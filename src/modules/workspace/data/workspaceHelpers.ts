
export const draftId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;


export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);


export const workspaceGate = (
  ws: { name: string; status?: string; created_by?: string; locked?: boolean },
  user?: { id?: string | number | null; role?: string }
): { open: true } | { open: false; reason: string } => {
  const privileged =
    user?.role === "SP" ||
    (!!ws.created_by && String(ws.created_by) === String(user?.id));


  if (ws.locked || !ws.status) return { open: true };

  /*
   * `completed` opens like `active` does. The other two closed states mean "not
   * ready" and "not running"; this one means the work is done, and a finished
   * workspace nobody can open is a record nobody can read.
   */
  if (ws.status === "active" || ws.status === "completed" || privileged) {
    return { open: true };
  }

  return {
    open: false,
    reason:
      ws.status === "on_hold"
        ? `"${ws.name}" is on hold, so it cannot be opened right now.`
        : `"${ws.name}" is still being planned. It opens once its manager sets it to Active.`,
  };
};



export const visibleWorkspaces = <
  T extends { status?: string; locked?: boolean; created_by?: string }
>(
  list: T[],
  user?: { id?: string | number | null; role?: string } | null
): T[] => {
  if (user?.role === "SP") return list;

  if (user?.role === "AM") {
    return list.filter(
      (ws) => !!ws.created_by && String(ws.created_by) === String(user?.id)
    );
  }

  // Finished workspaces stay listed: they are still open, so hiding them would
  // leave a member with a workspace they can reach but cannot find.
  return list.filter(
    (ws) =>
      ws.locked === true || ws.status === "active" || ws.status === "completed"
  );
};



export const canManageWorkspace = (
  ws?: { created_by?: string } | null,
  user?: { id?: string | number | null; role?: string } | null
): boolean =>
  user?.role === "SP" ||
  (!!ws?.created_by && String(ws.created_by) === String(user?.id));

/**
 * Whether this viewer may open `memberId`'s task list inside a room.
 *
 * A manager sees anyone; everybody else sees only themselves. Being in the same
 * room is **not** enough — a room is shared work, not a shared inbox, and a
 * colleague's task list is theirs.
 *
 * This is narrower than what a member can see of a *shared task*: they still get
 * the main task and every sibling subtask on it, because they hold a piece of it
 * and have to know who is ahead of them. That arrives through their own list.
 * Browsing somebody's whole list is the separate thing, and it stays closed.
 *
 * `/task-list` is what actually enforces this; here it only decides whether the
 * ring offers the link.
 */
export const canOpenMemberTasks = (
  ws: { created_by?: string } | null | undefined,
  user: { id?: string | number | null; role?: string } | null | undefined,
  memberId: string
): boolean =>
  canManageWorkspace(ws, user) || String(memberId) === String(user?.id);

export const WORKSPACES_CHANGED = "krew:workspaces-changed";

export const notifyWorkspacesChanged = () => {
  window.dispatchEvent(new Event(WORKSPACES_CHANGED));
};
