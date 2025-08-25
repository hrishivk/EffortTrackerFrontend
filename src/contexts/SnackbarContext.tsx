import React, { createContext, useContext, useState } from 'react';
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

 const showSnackbar = ({ message, severity }: { message: string; severity: SnackbarSeverity }) => {
  setMessage(message);
  setSeverity(severity);
  setOpen(true);
};


  const handleClose = () => {
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={2000}
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
