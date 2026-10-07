import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import WsModal from "../common/WsModal";
import PickList, { PickLabel, toggleId } from "../common/PickList";
import type { AddRoomDialogProps, RenameRoomDialogProps } from "../../types";

export function AddRoomDialog({
  open,
  busy,
  projectName,
  newName,
  setNewName,
  people,
  loadingPeople,
  picked,
  setPicked,
  onClose,
  onCreate,
}: AddRoomDialogProps) {
  return (
    <WsModal
      open={open}
      onClose={onClose}
      busy={busy}
      icon={<MeetingRoomOutlinedIcon sx={{ fontSize: 20 }} />}
      title="Add a room"
      caption="Name it, and pick who should be in it."
      primaryLabel="Create room"
      primaryIcon={<AddIcon sx={{ fontSize: 17 }} />}
      primaryDisabled={!newName.trim()}
      onPrimary={onCreate}
    >
      <p className="cws__label">
        Room name<span className="cws__req">*</span>
      </p>
      <input
        autoFocus
        className="cws__input"
        maxLength={40}
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && newName.trim()) onCreate();
        }}
        placeholder="e.g. Design Team"
      />

      <PickLabel
        label="Members"
        count={picked.length ? `· ${picked.length} selected` : "· optional"}
      />
      <PickList
        loading={loadingPeople}
        loadingText="Loading users…"
        emptyText={`Nobody is assigned to ${projectName ?? "this project"}, and no shared users.`}
        items={people.map((u) => ({
          id: u.id,
          name: u.name,
          sub: (
            <>
              {u.role}
              {u.shared && <span className="cws__shared-tag">Shared</span>}
            </>
          ),
        }))}
        selected={picked}
        onToggle={(id) => setPicked(toggleId(picked, id))}
      />
    </WsModal>
  );
}

export function RenameRoomDialog({
  editing,
  busy,
  editName,
  setEditName,
  onClose,
  onSave,
}: RenameRoomDialogProps) {
  return (
    <WsModal
      open={!!editing}
      onClose={onClose}
      busy={busy}
      size="xs"
      showClose={false}
      icon={<EditOutlinedIcon sx={{ fontSize: 20 }} />}
      title="Rename room"
      caption={<>Currently &ldquo;{editing?.name}&rdquo;.</>}
      primaryLabel="Save"
      primaryIcon={<CheckIcon sx={{ fontSize: 17 }} />}
      primaryDisabled={!editName.trim() || editName.trim() === editing?.name}
      onPrimary={onSave}
    >
      <p className="cws__label">
        Room name<span className="cws__req">*</span>
      </p>
      <input
        autoFocus
        className="cws__input"
        maxLength={40}
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && editName.trim()) onSave();
        }}
      />
    </WsModal>
  );
}
