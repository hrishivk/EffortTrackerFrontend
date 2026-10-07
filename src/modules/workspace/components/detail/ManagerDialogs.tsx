import CircularProgress from "@mui/material/CircularProgress";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import WsModal from "../common/WsModal";
import PickList, { PickLabel, toggleId } from "../common/PickList";
import type {
  AnnounceDialogProps,
  AnnounceStripProps,
  CoManagersDialogProps,
} from "../../types";

export function AnnounceStrip({ announcedTo, onAnnounce }: AnnounceStripProps) {
  return (
    <div className={`wsd__done${announcedTo ? " wsd__done--sent" : ""}`}>
      <span className="wsd__done-icon">
        {announcedTo ? (
          <CheckIcon sx={{ fontSize: 19 }} />
        ) : (
          <CampaignOutlinedIcon sx={{ fontSize: 19 }} />
        )}
      </span>
      <span className="wsd__done-text">
        <b>This workspace is finished.</b>
        <small>
          {announcedTo
            ? `${announcedTo} account manager${
                announcedTo === 1 ? "" : "s"
              } notified. You can send it again if you need to.`
            : "Marking it completed does not notify anybody — announce it to let the account managers know."}
        </small>
      </span>
      <button type="button" className="wsd__done-go" onClick={onAnnounce}>
        {announcedTo ? "Announce again" : "Announce it"}
      </button>
    </div>
  );
}

export function AnnounceDialog({ workspace, announce }: AnnounceDialogProps) {
  const {
    announceOpen,
    setAnnounceOpen,
    managers,
    managersLoading,
    pickedManagers,
    setPickedManagers,
    sending,
    sendAnnounce,
  } = announce;

  return (
    <WsModal
      open={announceOpen}
      onClose={() => setAnnounceOpen(false)}
      busy={sending}
      icon={<CampaignOutlinedIcon sx={{ fontSize: 20 }} />}
      title="Announce completion"
      caption={<>Tell managers that &ldquo;{workspace.name}&rdquo; is finished.</>}
      primaryLabel="Send notification"
      primaryIcon={<CampaignOutlinedIcon sx={{ fontSize: 17 }} />}
      primaryDisabled={pickedManagers.length === 0}
      onPrimary={() => void sendAnnounce()}
    >
      <PickLabel
        label="Account managers"
        count={
          pickedManagers.length
            ? `· ${pickedManagers.length} selected`
            : "· pick at least one"
        }
      />
      <PickList
        loading={managersLoading}
        loadingText="Loading managers…"
        emptyText="No account managers to notify."
        items={managers.map((m) => ({
          id: m.id,
          name: m.name,
          sub: (
            <>
              {m.email ?? "Account Manager"}
              {m.isMine && <span className="cws__shared-tag">Your manager</span>}
            </>
          ),
        }))}
        selected={pickedManagers}
        onToggle={(id) => setPickedManagers((list) => toggleId(list, id))}
      />
      <p className="wsd__announce-preview">
        <b>Workspace Completed</b>
        <span>
          &ldquo;{workspace.name}&rdquo;
          {workspace.project?.name ? ` (${workspace.project.name})` : ""} has
          been marked completed.
        </span>
      </p>
    </WsModal>
  );
}

export function CoManagersDialog({
  workspace,
  canAssignManagers,
  co,
}: CoManagersDialogProps) {
  const {
    coOpen,
    setCoOpen,
    coCandidates,
    coLoading,
    coPicked,
    setCoPicked,
    coSaving,
    coRemoving,
    assignCoManagers,
    removeCoManager,
  } = co;
  const locked = coSaving || !!coRemoving;

  return (
    <WsModal
      open={coOpen}
      onClose={() => setCoOpen(false)}
      busy={locked}
      primaryBusy={coSaving}
      paperClassName="wsd__modal-paper"
      icon={<ManageAccountsOutlinedIcon sx={{ fontSize: 20 }} />}
      title="Assign account managers"
      caption={
        <>
          They can open &ldquo;{workspace.name}&rdquo; without the key, see
          every room and manage it. Only the creator or SP can assign or
          remove them, or delete the workspace.
        </>
      }
      cancelLabel="Close"
      primaryLabel="Assign"
      primaryIcon={<CheckIcon sx={{ fontSize: 17 }} />}
      primaryDisabled={coPicked.length === 0}
      onPrimary={() => void assignCoManagers()}
    >
      <PickLabel label="Assigned" count={`· ${workspace.managers?.length ?? 0}`} />
      <PickList
        emptyText="No other account managers yet."
        items={(workspace.managers ?? []).map((m) => ({
          id: m.id,
          name: m.fullName,
          sub: "Account Manager",
          action: canAssignManagers && (
            <button
              type="button"
              className="cws__ghost"
              style={{ color: "#dc2626", padding: "4px 12px", fontSize: 12.5 }}
              title={`Unassign ${m.fullName}`}
              disabled={locked}
              onClick={() => void removeCoManager(m)}
            >
              {coRemoving === m.id ? (
                <CircularProgress size={13} sx={{ color: "#dc2626" }} />
              ) : (
                "Unassign"
              )}
            </button>
          ),
        }))}
      />

      <PickLabel
        label="Add"
        style={{ marginTop: 16 }}
        count={coPicked.length ? `· ${coPicked.length} selected` : "· pick one or more"}
      />
      <PickList
        loading={coLoading}
        loadingText="Loading account managers…"
        emptyText="No other account managers to add."
        items={coCandidates.map((m) => ({
          id: m.id,
          name: m.fullName,
          sub: m.email ?? "Account Manager",
        }))}
        selected={coPicked}
        onToggle={(id) => setCoPicked((list) => toggleId(list, id))}
      />
    </WsModal>
  );
}
