
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

  if (ws.status === "active" || privileged) return { open: true };

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

  return list.filter((ws) => ws.locked === true || ws.status === "active");
};



export const canManageWorkspace = (
  ws?: { created_by?: string } | null,
  user?: { id?: string | number | null; role?: string } | null
): boolean =>
  user?.role === "SP" ||
  (!!ws?.created_by && String(ws.created_by) === String(user?.id));

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
