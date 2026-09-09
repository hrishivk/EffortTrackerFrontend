
export interface ProfileViewProps {
  userId?: string | number | null;
  onLogout?: () => void;
}


export interface DialogeProps {
  open: boolean;
  data?: string | null;
  onClose?: () => void;
  onConfirm: (id?: string) => void;
  /**
   * Overrides the mode's wording. Used where a destructive action should name
   * what it is about to remove — "Delete Frontend?" reads very differently
   * from "Delete this room?".
   */
  title?: string;
  message?: string;
  confirmLabel?: string;
  /** Disables both buttons while the request is in flight. */
  busy?: boolean;
}
