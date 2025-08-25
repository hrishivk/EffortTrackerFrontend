export interface DialogeProps {
  open: boolean;
  data?: string | null;
  onClose?: () => void;
  onConfirm: (id?: string) => void;
}
