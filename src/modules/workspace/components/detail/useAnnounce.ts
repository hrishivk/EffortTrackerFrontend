import { useState } from "react";
import {
  fetchNotifyTargets,
  notifyWorkspaceCompleted,
} from "../../../../core/actions/workspaceAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import type { Workspace } from "../../../user/types";
import type { ManagerOption } from "../../types";

export function useAnnounce(workspace: Workspace | null) {
  const { showSnackbar } = useSnackbar();
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [pickedManagers, setPickedManagers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [announcedTo, setAnnouncedTo] = useState(0);

  const openAnnounce = async () => {
    setPickedManagers([]);
    setAnnounceOpen(true);
    setManagersLoading(true);
    try {
      const rows = await fetchNotifyTargets();
      setManagers(
        rows
          .filter((t) => !!t.id)
          .filter((t) => (t.role || "").toUpperCase() === "AM")
          .map((t) => ({
            id: String(t.id),
            name: t.fullName,
            email: t.email,
            isMine: !!t.is_my_manager,
          }))
          .sort(
            (a, b) =>
              Number(b.isMine) - Number(a.isMine) || a.name.localeCompare(b.name)
          )
      );
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not load the managers"),
        severity: "error",
      });
      setManagers([]);
    } finally {
      setManagersLoading(false);
    }
  };

  const sendAnnounce = async () => {
    if (!workspace || pickedManagers.length === 0) return;
    setSending(true);
    try {
      await notifyWorkspaceCompleted(workspace.id, pickedManagers);
      setAnnouncedTo(pickedManagers.length);
      showSnackbar({
        message:
          pickedManagers.length === 1
            ? "Notified 1 manager"
            : `Notified ${pickedManagers.length} managers`,
        severity: "success",
      });
      setAnnounceOpen(false);
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not send that notification"),
        severity: "error",
      });
    } finally {
      setSending(false);
    }
  };

  return {
    announceOpen,
    setAnnounceOpen,
    managers,
    managersLoading,
    pickedManagers,
    setPickedManagers,
    sending,
    announcedTo,
    openAnnounce,
    sendAnnounce,
  };
}

export type AnnounceState = ReturnType<typeof useAnnounce>;
