import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";

export function WorkspaceNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="wsd">
      <div className="wsl__center">
        <h2 className="wsl__empty-title">Workspace not found</h2>
        <p className="wsl__empty-caption">
          It may have been deleted, or you may not have access to it.
        </p>
        <button type="button" className="cws__ghost" onClick={onBack}>
          <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
        </button>
      </div>
    </div>
  );
}

export function WorkspaceNotOpen({
  reason,
  onBack,
}: {
  reason: string;
  onBack: () => void;
}) {
  return (
    <div className="wsd">
      <div className="wsl__center">
        <span className="cws__tile cws__tile--brand">
          <MeetingRoomOutlinedIcon sx={{ fontSize: 22 }} />
        </span>
        <h2 className="wsl__empty-title">Not open yet</h2>
        <p className="wsl__empty-caption">{reason}</p>
        <button type="button" className="cws__ghost" onClick={onBack}>
          <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
        </button>
      </div>
    </div>
  );
}

export function WorkspaceLocked({
  name,
  codeTry,
  setCodeTry,
  unlocking,
  onUnlock,
  onBack,
}: {
  name: string;
  codeTry: string;
  setCodeTry: (value: string) => void;
  unlocking: boolean;
  onUnlock: () => void;
  onBack: () => void;
}) {
  return (
    <div className="wsd">
      <div className="wsd__lock">
        <span className="wsd__lock-icon">
          <LockOutlinedIcon sx={{ fontSize: 26 }} />
        </span>
        <h2 className="wsd__lock-title">{name} is private</h2>
        <p className="wsd__lock-caption">
          Enter the workspace code to open it — your manager has it. It is
          checked every time the workspace is opened.
        </p>

        <div className="wsd__lock-form">
          <input
            autoFocus
            className="cws__input"
            maxLength={20}
            value={codeTry}
            onChange={(e) => setCodeTry(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && codeTry.trim()) onUnlock();
            }}
            placeholder="e.g. PD-2026"
            aria-label="Workspace code"
          />
          <button
            type="button"
            className="cws__primary"
            disabled={!codeTry.trim() || unlocking}
            onClick={onUnlock}
          >
            {unlocking ? (
              <CircularProgress size={15} sx={{ color: "#fff" }} />
            ) : (
              <LockOutlinedIcon sx={{ fontSize: 17 }} />
            )}
            Unlock
          </button>
        </div>

        <button type="button" className="cws__ghost" onClick={onBack}>
          <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back
        </button>
      </div>
    </div>
  );
}
