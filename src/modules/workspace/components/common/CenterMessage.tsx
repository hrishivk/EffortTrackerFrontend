import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import type { CenterMessageProps } from "../../types";

export default function CenterMessage({
  title,
  caption,
  actionLabel,
  onAction,
  children,
}: CenterMessageProps) {
  return (
    <div className="wsd">
      <div className="wsl__center">
        <h2 className="wsl__empty-title">{title}</h2>
        {caption && <p className="wsl__empty-caption">{caption}</p>}
        {children}
        {onAction && (
          <button type="button" className="cws__ghost" onClick={onAction}>
            <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
