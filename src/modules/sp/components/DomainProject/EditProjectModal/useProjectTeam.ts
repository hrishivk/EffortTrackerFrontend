import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { fetchUsers } from "../../../../../core/actions/spAction";
import { useSnackbar } from "../../../../../contexts/SnackbarContext";
import type { formUserData } from "../../../../../shared/types/User";
import { ROSTER_PAGE_SIZE } from "./constants";

/**
 * Team roster (paged), the selected member ids, and the add/remove diff
 * against the project's members when the modal opened.
 */
export const useProjectTeam = (open: boolean, project: any | null) => {
  const { showSnackbar } = useSnackbar();
  const role = useSelector((state: any) => state.user.user.role);
  const myId = useSelector((state: any) => state.user.user?.id);
  const isAM = String(role || "").toUpperCase() === "AM";

  const canAssign = useCallback(
    (who?: { role?: string | null }) => {
      const r = String(who?.role || "").toUpperCase();
      return isAM ? r === "USER" || r === "DEVLOPER" : r === "AM";
    },
    [isAM]
  );

  const [roster, setRoster] = useState<formUserData[]>([]);
  const [rosterPage, setRosterPage] = useState(0);
  const [rosterPages, setRosterPages] = useState(1);
  const [rosterLoading, setRosterLoading] = useState(false);

  const [memberIds, setMemberIds] = useState<string[]>([]);
  const initialMemberIds = useRef<string[]>([]);
  const membersSeeded = useRef(false);

  useEffect(() => {
    membersSeeded.current = false;
    if (!open || !project) return;
    setMemberIds([]);
  }, [open, project]);

  useEffect(() => {
    if (!open || !project || membersSeeded.current) return;

    const assigned: string[] = Array.isArray(project.members)
      ? project.members
          .filter(canAssign)
          .map((m: { id: string | number }) => String(m.id))
      : [];
    setMemberIds(assigned);
    initialMemberIds.current = assigned;
    membersSeeded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project]);

  const toggleMember = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );

  const rosterById = useMemo(
    () => new Map(roster.map((u) => [String(u.id), u])),
    [roster]
  );
  const isMine = useCallback(
    (u: formUserData) => {
      if (!isAM) return true;
      if (u.manager_id != null && u.manager_id !== "") {
        return String(u.manager_id) === String(myId);
      }
      const row = rosterById.get(String(u.id));
      return !!row && !row.is_shared;
    },
    [isAM, myId, rosterById]
  );

  const visibleUsers = useMemo(() => {
    const members: formUserData[] = Array.isArray(project?.members)
      ? project.members.filter(canAssign)
      : [];
    const byId = new Map<string, formUserData>();
    for (const u of [...members, ...roster]) {
      const id = String(u.id);
      if (!byId.has(id)) byId.set(id, u);
    }
    const all = [...byId.values()].filter(isMine);
    const assigned = all.filter((u) => memberIds.includes(String(u.id)));
    const rest = all.filter((u) => !memberIds.includes(String(u.id)));
    return [...assigned, ...rest];
  }, [project, roster, memberIds, canAssign, isMine]);

  const visibleMemberCount = visibleUsers.filter((u) =>
    memberIds.includes(String(u.id))
  ).length;

  const loadRoster = useCallback(
    async (next: number) => {
      if (rosterLoading) return;
      setRosterLoading(true);
      try {
        const res = await fetchUsers({
          page: next,
          limit: ROSTER_PAGE_SIZE,
          ...(isAM ? {} : { role: "AM" }),
        });
        const rows = (res?.users ?? []).filter(canAssign);
        setRoster((prev) => {
          const seen = new Set(prev.map((u) => String(u.id)));
          return [...prev, ...rows.filter((u) => !seen.has(String(u.id)))];
        });
        setRosterPage(next);
        setRosterPages(res?.totalPages || 1);
      } catch {
        showSnackbar({ message: "Failed to load the team list", severity: "error" });
        setRosterPages(next);
        setRosterPage(next);
      } finally {
        setRosterLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAM, rosterLoading, canAssign]
  );

  useEffect(() => {
    if (!open) {
      setRoster([]);
      setRosterPage(0);
      setRosterPages(1);
      return;
    }
    void loadRoster(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id]);

  const rosterHasMore = rosterPage < rosterPages;

  const onRosterScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!rosterHasMore || rosterLoading) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 72) {
      void loadRoster(rosterPage + 1);
    }
  };

  const added = memberIds.filter((id) => !initialMemberIds.current.includes(id));
  const removed = initialMemberIds.current.filter((id) => !memberIds.includes(id));

  return {
    memberIds,
    toggleMember,
    visibleUsers,
    visibleMemberCount,
    rosterLoading,
    rosterEmpty: roster.length === 0,
    onRosterScroll,
    added,
    removed,
  };
};
