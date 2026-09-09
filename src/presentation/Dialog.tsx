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

const Dialoge: React.FC<DialogeProps> = ({
  open,
  data,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  busy,
}) => {
  const mode = (data === "block" || data === "unblock" || data === "remove" ||
    data === "removeGroup" || data === "deleteRoom" ||
    data === "deleteWorkspace")
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
    remove: {
      title: "Confirm Remove",
      message: "Are you sure you want to remove this member from the project?",
      confirmLabel: "Yes, Remove",
    },
    removeGroup: {
      title: "Remove group",
      message:
        "Are you sure you want to remove this group? Its tasks are not deleted \u2014 they go back to the lane for their status.",
      confirmLabel: "Yes, Remove",
    },
    deleteRoom: {
      title: "Delete room",
      message:
        "Are you sure you want to delete this room? Its members are removed from it. This action cannot be undone.",
      confirmLabel: "Yes, Delete",
    },
    deleteWorkspace: {
      title: "Delete workspace",
      message:
        "Are you sure you want to delete this workspace? Its rooms and everyone's place in them go with it. This action cannot be undone.",
      confirmLabel: "Yes, Delete",
    },
  }[mode];

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose}>
      <DialogTitle>{title ?? config.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message ?? config.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={busy}>
          No
        </Button>
        <Button
          onClick={() => onConfirm()}
          color="error"
          autoFocus
          disabled={busy}
        >
          {confirmLabel ?? config.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Dialoge;
