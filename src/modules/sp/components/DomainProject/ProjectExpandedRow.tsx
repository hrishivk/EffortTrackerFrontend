import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import {
  fetchAllUsers,
  fetchUsers,
  assignProjectMembers,
  removeProjectMembers,
} from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import SpinLoader from "../../../../presentation/SpinLoader";
import { selectSx } from "./constants";
import { pdGetInitials, isUserInProject } from "./utils";
import type { ProjectRow } from "../../types";
import type { formUserData } from "../../../../shared/types/User";
import Dialoge from "../../../../presentation/Dialog";

const ProjectExpandedRow = ({ row, onRefresh }: { row: ProjectRow; onRefresh?: () => void }) => {
  const { showSnackbar } = useSnackbar();
  const loggedInRole = useSelector((state: any) => state.user.user.role);
  const isSP = loggedInRole?.toUpperCase() === "SP";
  const [users, setUsers] = useState<formUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<formUserData | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (isSP) {
        const res = await fetchUsers({ role: "AM" });
        setUsers(res.users || []);
      } else {
        const res = await fetchAllUsers();
        const allUsers: formUserData[] = res.data || [];
        setUsers(allUsers.filter((u) => u.role === "USER" || u.role === "DEVLOPER"));
      }
    } catch {
      showSnackbar({ message: "Failed to load users", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, isSP]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const assignedMembers = users.filter((u) => isUserInProject(u, row.id));
  const availableMembers = users.filter((u) => !isUserInProject(u, row.id));

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    try {
      await removeProjectMembers(String(row.id), [String(removeTarget.id)]);
      showSnackbar({ message: `${removeTarget.fullName} removed`, severity: "success" });
      await loadUsers();
      onRefresh?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to remove member";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setRemoveTarget(null);
    }
  };

  const handleOpenAssign = () => {
    setAssignOpen(true);
    setSelectedUserIds([]);
    setUserSearch("");
  };

  const handleAssignSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    setAssignLoading(true);
    try {
      await assignProjectMembers(String(row.id), selectedUserIds);
      showSnackbar({ message: `${selectedUserIds.length} member(s) assigned`, severity: "success" });
      setAssignOpen(false);
      await loadUsers();
      onRefresh?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to assign members";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredAvailable = availableMembers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return <SpinLoader isLoading />;
  }

  const isActive = (row.status || "").toLowerCase().replace(/\s+/g, "_") === "active";

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Team Members ({assignedMembers.length})
        </h6>
        {isActive ? (
          <button
            className="btn btn-sm text-white"
            style={{
              backgroundColor: "#7c3aed",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
            }}
            onClick={handleOpenAssign}
          >
            + Assign Members
          </button>
        ) : (
          <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}>
            Only active projects can assign members
          </span>
        )}
      </div>

      {assignedMembers.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
          No members assigned to this project yet.
        </p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {assignedMembers.map((member) => (
            <div
              key={member.id}
              className="d-flex align-items-center justify-content-between p-2 rounded-3"
              style={{ border: "1px solid var(--border-light)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#7c3aed",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pdGetInitials(member.fullName)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{member.fullName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{member.role}</div>
                </div>
              </div>
              <button
                className="btn btn-sm"
                style={{
                  color: "#dc3545",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "2px 10px",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                }}
                onClick={() => setRemoveTarget(member)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialoge
        open={removeTarget !== null}
        data="remove"
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
      />

      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          {isSP ? "Assign Managers (AM)" : "Assign Members"} to {row.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            sx={{ mb: 2, mt: 1, ...selectSx }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9ca3af", fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {filteredAvailable.map((user) => {
              const uid = String(user.id);
              const isSelected = selectedUserIds.includes(uid);
              return (
                <div
                  key={uid}
                  className="d-flex align-items-center gap-2 p-2 rounded-2"
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#f5f3ff" : "transparent",
                  }}
                  onClick={() => toggleUserSelection(uid)}
                >
                  <Checkbox
                    checked={isSelected}
                    size="small"
                    sx={{ "&.Mui-checked": { color: "#7c3aed" } }}
                  />
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "#e5e7eb",
                      color: "#6b7280",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {pdGetInitials(user.fullName)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user.fullName}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{user.role}</div>
                  </div>
                </div>
              );
            })}
            {filteredAvailable.length === 0 && (
              <p className="text-center py-3" style={{ fontSize: 13, color: "#9ca3af" }}>
                No available users to assign.
              </p>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)} sx={{ color: "#6b7280", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignSubmit}
            disabled={selectedUserIds.length === 0 || assignLoading}
            variant="contained"
            sx={{
              backgroundColor: "#7c3aed",
              "&:hover": { backgroundColor: "#6d28d9" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {assignLoading ? "Assigning..." : `Assign (${selectedUserIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProjectExpandedRow;
