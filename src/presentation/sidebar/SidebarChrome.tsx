import { Link } from "react-router-dom";
import { FiChevronRight, FiChevronsLeft, FiX } from "react-icons/fi";
import logo from "../../assets/img/logo2.png.png";
import type { SidebarViewProps } from "./types";

interface BrandProps extends Omit<SidebarViewProps, "pillId"> {
  onToggleCollapse: () => void;
}

export const SidebarBrand = ({ isCollapsed, onClose, onToggleCollapse }: BrandProps) => (
  <div
    className={`flex items-center h-[56px] shrink-0 ${
      isCollapsed ? "justify-center px-2" : "gap-2.5 px-4"
    }`}
  >
    <img src={logo} alt="KREW" className="h-7 w-7 shrink-0 object-contain" />

    {!isCollapsed && (
      <>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[14.5px] font-bold tracking-[0.02em]"
            style={{ color: "var(--text-primary)", margin: 0 }}
          >
            KREW
          </p>
        </div>

        <button
          onClick={onToggleCollapse}
          title="Collapse sidebar"
          className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ color: "var(--text-faint)" }}
        >
          <FiChevronsLeft size={15} />
        </button>
        <button
          onClick={onClose}
          title="Close menu"
          className="md:hidden flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-faint)" }}
        >
          <FiX size={15} />
        </button>
      </>
    )}
  </div>
);

interface UserCardProps extends Omit<SidebarViewProps, "pillId"> {
  displayName: string;
  roleLabel: string;
  profilePath: string;
}

export const SidebarUserCard = ({
  isCollapsed,
  onClose,
  displayName,
  roleLabel,
  profilePath,
}: UserCardProps) => (
  <div className={`shrink-0 pt-2 pb-3 ${isCollapsed ? "px-2.5" : "px-3"}`}>
    <Link
      to={profilePath}
      onClick={onClose}
      title={`${displayName} — ${roleLabel}`}
      className={`sb-user${isCollapsed ? " sb-user--rail" : ""}`}
    >
      <span className="sb-user__avatar">{displayName.charAt(0).toUpperCase()}</span>
      {!isCollapsed && (
        <>
          <span className="min-w-0 flex-1">
            <p className="sb-user__name">{displayName}</p>
            <p className="sb-user__role">{roleLabel}</p>
          </span>
          <FiChevronRight
            size={14}
            className="shrink-0"
            style={{ color: "var(--text-faint)" }}
          />
        </>
      )}
    </Link>
  </div>
);
