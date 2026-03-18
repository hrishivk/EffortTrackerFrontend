
export interface ProfileViewProps {
  userId?: string | number | null;
  onLogout?: () => void;
}


export interface DialogeProps {
  open: boolean;
  data?: string | null;
  onClose?: () => void;
  onConfirm: (id?: string) => void;
}
