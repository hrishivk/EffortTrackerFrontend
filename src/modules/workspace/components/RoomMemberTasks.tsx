import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SpinLoader from "../../../presentation/SpinLoader";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import MyTasksView from "../../dashboard/components/MyTasksView";
import { fetchWorkspace } from "../../../core/actions/workspaceAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useAppSelector } from "../../../store/configureStore";
import { canOpenMemberTasks, initials, roomPath } from "../data/workspaceHelpers";
import type { Workspace } from "../../user/types";
import { apiMessage } from "../../../shared/utils/apiMessage";
import CenterMessage from "./common/CenterMessage";

export default function RoomMemberTasks() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showSnackbar } = useSnackbar();
  const [params] = useSearchParams();
  const workspaceId = params.get("ws");
  const roomId = params.get("room");
  const memberId = params.get("user");
  const rolePath = pathname.split("/")[1] ?? "";

  const { user } = useAppSelector((state) => state.user);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setWorkspace(await fetchWorkspace(workspaceId));
    } catch (error) {
      showSnackbar({
        message: apiMessage(error, "Could not load that workspace"),
        severity: "error",
      });
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  const room = useMemo(
    () => workspace?.rooms?.find((r) => r.id === roomId) ?? null,
    [workspace, roomId]
  );
  const member = useMemo(
    () => room?.members.find((m) => m.id === memberId) ?? null,
    [room, memberId]
  );

  const roomMembers = useMemo(
    () =>
      (room?.members ?? []).map((m) => ({
        id: m.id,
        name: m.fullName,
        role: m.role,
      })),
    [room]
  );

  const backToRoom = () =>
    navigate(roomPath(rolePath, workspaceId ?? "", roomId ?? ""));

  if (loading) return <SpinLoader isLoading />;

  if (member && !canOpenMemberTasks(workspace, user, member.id)) {
    return (
      <CenterMessage
        title="That is not your task list"
        caption={
          <>
            {member.fullName}&rsquo;s tasks are theirs to see. You can open
            your own from the room.
          </>
        }
        actionLabel="Back to the room"
        onAction={backToRoom}
      />
    );
  }

  if (!member) {
    return (
      <CenterMessage
        title="Member not found"
        caption="They may have been moved out of this room, or you may not have access to it."
        actionLabel="Back"
        onAction={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="wsd">
      <div className="wsd__head">
        <button
          type="button"
          className="cws__icon-btn"
          title="Back to the room"
          onClick={backToRoom}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </button>

        <span className="cws__avatar">{initials(member.fullName)}</span>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="wsd__title">{member.fullName}</h1>
          <p className="wsd__caption">
            {[workspace?.project?.name, workspace?.name, room?.name, member.role]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <div className="wsd__tasks">
        <MyTasksView
          viewUserId={member.id}
          viewUserName={member.fullName}
          viewProject={workspace?.project?.name}
          lockedProject={workspace?.project?.name}
          roomId={roomId ?? undefined}
          roomMembers={roomMembers}
        />
      </div>
    </div>
  );
}
