import type { ReactNode } from "react";
import type { workspaceGate } from "../../modules/workspace/data/workspaceHelpers";

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Props shared by every piece rendered inside one sidebar instance (desktop or mobile). */
export interface SidebarViewProps {
  isCollapsed: boolean;
  pillId: string;
  onClose: () => void;
}

export type WorkspaceGate = ReturnType<typeof workspaceGate>;

export type ToggleMap = Record<string, boolean>;
