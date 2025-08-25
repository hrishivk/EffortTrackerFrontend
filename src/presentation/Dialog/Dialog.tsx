import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import React from "react";
import type { DialogeProps } from "./types";

const Dialoge: React.FC<DialogeProps> = ({ open, data, onClose, onConfirm }) => {
  const mode = (data === "block" || data === "unblock")
    ? data
    : data
    ? "delete"
    : "lock";

  const config = {
    delete: {
      title: "Confirm Delete",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      confirmLabel: "Yes, Delete",
    },
    block: {
      title: "Confirm Block",
      message: "Are you sure you want to block this user? This action cannot be undone.",
      confirmLabel: "Yes, Block",
    },
    unblock: {
      title: "Confirm Unblock",
      message: "Are you sure you want to unblock this user? This action cannot be undone.",
      confirmLabel: "Yes, Unblock",
    },
    lock: {
      title: "Confirm Lock",
      message: "Are you sure you want to lock all tasks? This action cannot be undone.",
      confirmLabel: "Yes, Lock Task",
    },
  }[mode];

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{config.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">No</Button>
        <Button onClick={() => onConfirm()} color="error" autoFocus>
          {config.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Dialoge;
