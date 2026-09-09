import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import type { SnackbarContextType, SnackbarSeverity } from './types';


const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within a SnackbarProvider');
  return context;
};

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<SnackbarSeverity>('info');

  /**
   * Memoised, and so is the context value.
   *
   * Both were rebuilt on every provider render, and the provider re-renders
   * each time the snackbar opens or closes. Any consumer with `showSnackbar`
   * in a dependency array therefore had its callbacks and effects invalidated
   * twice per message — once on show, once when `autoHideDuration` closed it.
   * On the workspace page that re-ran the page's own load effect, so a rename
   * flashed the whole page, and flashed it again a second and a half later
   * when the toast auto-hid.
   */
  const showSnackbar = useCallback(
    ({ message, severity }: { message: string; severity: SnackbarSeverity }) => {
      setMessage(message);
      setSeverity(severity);
      setOpen(true);
    },
    []
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={severity === 'error' || severity === 'warning' ? 4000 : 1500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={severity} onClose={handleClose} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
