export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarContextType {
  showSnackbar: (options: { message: string; severity: SnackbarSeverity }) => void;
}
