import { useNavigate } from "react-router-dom";
import SpinLoader from "../../../presentation/SpinLoader";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Dialoge from "../../../presentation/Dialog";
import { workspaceGate } from "../data/workspaceHelpers";
import { useWorkspaceDetail } from "./detail/useWorkspaceDetail";
import { useAnnounce } from "./detail/useAnnounce";
import { useCoManagers } from "./detail/useCoManagers";
import {
  WorkspaceLocked,
  WorkspaceNotFound,
  WorkspaceNotOpen,
} from "./detail/WorkspaceGates";
import WorkspaceHero from "./detail/WorkspaceHero";
import RoomsChart from "./detail/RoomsChart";
import { AddRoomDialog, RenameRoomDialog } from "./detail/RoomDialogs";
import {
  AnnounceDialog,
  AnnounceStrip,
  CoManagersDialog,
} from "./detail/ManagerDialogs";

export default function WorkspaceDetail() {
  const navigate = useNavigate();
  const d = useWorkspaceDetail();
  const announce = useAnnounce(d.workspace);
  const co = useCoManagers(d.workspace, d.setWorkspace);
  const { workspace, rooms, memberCount, busy, pendingDelete } = d;
  const back = () => navigate(-1);

  if (d.loading) return <SpinLoader isLoading />;

  if (!workspace) return <WorkspaceNotFound onBack={back} />;

  if (workspace.locked) {
    return (
      <WorkspaceLocked
        name={workspace.name}
        codeTry={d.codeTry}
        setCodeTry={d.setCodeTry}
        unlocking={d.unlocking}
        onUnlock={() => void d.unlock()}
        onBack={back}
      />
    );
  }

  const gate = workspaceGate(workspace, d.user ?? undefined);
  if (!gate.open) return <WorkspaceNotOpen reason={gate.reason} onBack={back} />;

  return (
    <div className="wsd">
      <div className="wsd__head">
        <button type="button" className="cws__icon-btn" title="Back" onClick={back}>
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 className="wsd__title">{workspace.name}</h1>
          <p className="wsd__caption">
            The project, rooms and people in this workspace.
          </p>
        </div>
      </div>

      <WorkspaceHero
        workspace={workspace}
        roomCount={rooms.length}
        memberCount={memberCount}
        canManage={d.canManage}
        canAssignManagers={d.canAssignManagers}
        showAssign={d.user?.role !== "SP"}
        busy={busy}
        copied={d.copied}
        onCopyKey={() => void d.copyKey()}
        onSetStatus={(status) => void d.setStatus(status)}
        onAssign={co.openCoManagers}
        onDelete={() => d.setPendingWsDelete(true)}
      />

      {d.canManage && workspace.status === "completed" && (
        <AnnounceStrip
          announcedTo={announce.announcedTo}
          onAnnounce={() => void announce.openAnnounce()}
        />
      )}

      {workspace.description?.trim() && (
        <div className="wsd__note">
          <InfoOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed", flexShrink: 0 }} />
          {workspace.description}
        </div>
      )}

      <RoomsChart
        workspace={workspace}
        rooms={rooms}
        rolePath={d.rolePath}
        canManage={d.canManage}
        busy={busy}
        onAdd={d.openAdd}
        onRename={d.startRename}
        onDelete={d.setPendingDelete}
      />

      <AddRoomDialog
        open={d.adding}
        busy={busy}
        projectName={workspace.project?.name}
        newName={d.newName}
        setNewName={d.setNewName}
        people={d.people}
        loadingPeople={d.loadingPeople}
        picked={d.picked}
        setPicked={d.setPicked}
        onClose={() => d.setAdding(false)}
        onCreate={() => void d.addRoom()}
      />

      <AnnounceDialog workspace={workspace} announce={announce} />

      <CoManagersDialog
        workspace={workspace}
        canAssignManagers={d.canAssignManagers}
        co={co}
      />

      <RenameRoomDialog
        editing={d.editing}
        busy={busy}
        editName={d.editName}
        setEditName={d.setEditName}
        onClose={() => d.setEditing(null)}
        onSave={() => void d.renameRoom()}
      />

      <Dialoge
        open={!!pendingDelete}
        data="deleteRoom"
        busy={busy}
        title={`Delete "${pendingDelete?.name}"?`}
        confirmLabel="Yes, Delete Room"
        message={
          pendingDelete?.members.length
            ? `Are you sure you want to delete the room "${pendingDelete.name}" from ` +
              `${workspace.name}? Its ${pendingDelete.members.length} member` +
              `${pendingDelete.members.length === 1 ? "" : "s"} will be taken out of ` +
              `this room, but they stay in the workspace and in any other rooms ` +
              `they belong to. This action cannot be undone.`
            : `Are you sure you want to delete the room "${pendingDelete?.name}" from ` +
              `${workspace.name}? It is removed for everyone in the workspace. ` +
              `This action cannot be undone.`
        }
        onClose={() => d.setPendingDelete(null)}
        onConfirm={() => void d.removeRoom()}
      />

      <Dialoge
        open={d.pendingWsDelete}
        data="deleteWorkspace"
        busy={busy}
        title={`Delete "${workspace.name}"?`}
        confirmLabel="Yes, Delete Workspace"
        message={
          `Are you sure you want to delete the workspace "${workspace.name}"? ` +
          (rooms.length
            ? `Its ${rooms.length} room${rooms.length === 1 ? "" : "s"} and the ` +
              `${memberCount} member${memberCount === 1 ? "" : "s"} placed in them ` +
              `go with it. `
            : "") +
          `The project itself is not deleted. This action cannot be undone.`
        }
        onClose={() => d.setPendingWsDelete(false)}
        onConfirm={() => void d.removeWorkspace()}
      />
    </div>
  );
}
