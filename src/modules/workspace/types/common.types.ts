import type { CSSProperties, ReactNode } from "react";

export interface WsModalProps {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  size?: "xs" | "sm";
  icon: ReactNode;
  title: ReactNode;
  caption?: ReactNode;
  showClose?: boolean;
  cancelLabel?: string;
  primaryLabel: ReactNode;
  primaryIcon?: ReactNode;
  primaryDisabled?: boolean;
  primaryBusy?: boolean;
  onPrimary: () => void;
  paperClassName?: string;
  children?: ReactNode;
}

export interface PickItem {
  id: string;
  name: string;
  sub?: ReactNode;
  action?: ReactNode;
}

export interface PickListProps {
  items: PickItem[];
  loading?: boolean;
  loadingText?: string;
  emptyText: ReactNode;
  selected?: string[];
  onToggle?: (id: string) => void;
}

export interface PickLabelProps {
  label: ReactNode;
  count?: ReactNode;
  style?: CSSProperties;
}

export interface CenterMessageProps {
  title: ReactNode;
  caption?: ReactNode;
  actionLabel?: ReactNode;
  onAction?: () => void;
  children?: ReactNode;
}
