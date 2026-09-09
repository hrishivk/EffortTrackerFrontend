import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import MyTasksView from "../../dashboard/components/MyTasksView";
import { fetchWorkspace } from "../../../core/actions/workspaceAction";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useAppSelector } from "../../../store/configureStore";
import { canOpenMemberTasks, initials } from "../data/workspaceHelpers";
import type { Workspace } from "../../user/types";

/**
 * One room member's tasks, without leaving the workspace.
 *
 * The List / Board / Gantt views are `MyTasksView`, rendered here rather than
 * reimplemented — it already takes `viewUserId` and `viewProject` and carries
 * its own view toggle, filters and create form. Linking to the dashboard would
 * have worked too, but it drops the reader out of the workspace, which is the
 * thing this page exists to avoid: the header keeps the room breadcrumb and
 * the back button returns to the ring.
 */

const apiMessage = (error: unknown, fallback: string): string => {
  const res = (error as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message || fallback;
};

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

  if (loading) {
    return (
      <div className="wsd">
        <div className="wsl__center">
          <CircularProgress size={26} sx={{ color: "#7c3aed" }} />
        </div>
      </div>
    );
  }

  /*
   * The ring only links a member to their own tasks, but a URL can be typed —
   * so the page applies the same rule rather than trusting the link that got
   * someone here. A manager still reaches anyone in the room.
   *
   * This is a courtesy, not the boundary: `/task-list` is what actually has
   * to scope a member to their own tasks.
   */
  if (member && !canOpenMemberTasks(workspace, user, member.id)) {
    return (
      <div className="wsd">
        <div className="wsl__center">
          <h2 className="wsl__empty-title">That is not your task list</h2>
          <p className="wsl__empty-caption">
            {member.fullName}&rsquo;s tasks are theirs to see. You can open
            your own from the room.
          </p>
          <button
            type="button"
            className="cws__ghost"
            onClick={() =>
              navigate(
                `/${rolePath}/room?ws=${encodeURIComponent(
                  workspaceId ?? ""
                )}&id=${encodeURIComponent(roomId ?? "")}`
              )
            }
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back to the room
          </button>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="wsd">
        <div className="wsl__center">
          <h2 className="wsl__empty-title">Member not found</h2>
          <p className="wsl__empty-caption">
            They may have been moved out of this room, or you may not have
            access to it.
          </p>
          <button type="button" className="cws__ghost" onClick={() => navigate(-1)}>
            <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wsd">
      <div className="wsd__head">
        <button
          type="button"
          className="cws__icon-btn"
          title="Back to the room"
          onClick={() =>
            navigate(
              `/${rolePath}/room?ws=${encodeURIComponent(
                workspaceId ?? ""
              )}&id=${encodeURIComponent(roomId ?? "")}`
            )
          }
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

      {/*
       * `viewProject` scopes what is listed and stays changeable from the
       * panel's filter tray. `lockedProject` is the create form's project: a
       * task raised here belongs to the workspace's project, so the field is
       * shown but fixed.
       */}
      <div className="wsd__tasks">
        <MyTasksView
          viewUserId={member.id}
          viewUserName={member.fullName}
          viewProject={workspace?.project?.name}
          lockedProject={workspace?.project?.name}
        />
      </div>
    </div>
  );
}
