import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import {
  fetchProject,
  fetchUsers,
  assignProjectMembers,
  removeProjectMembers,
} from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import SpinLoader from "../../../../presentation/SpinLoader";
import { pdGetInitials } from "./utils";
import type { ProjectRow } from "../../types";
import type { formUserData } from "../../../../shared/types/User";
import Dialoge from "../../../../presentation/Dialog";

/** Candidates per request, and per press of Next. */
const ROSTER_PAGE = 10;

const ProjectExpandedRow = ({ row, onRefresh }: { row: ProjectRow; onRefresh?: () => void }) => {
  const { showSnackbar } = useSnackbar();
  const loggedInRole = useSelector((state: any) => state.user.user.role);
  const isSP = loggedInRole?.toUpperCase() === "SP";
  /** Who is on the project, answered by the project itself. */
  const [assignedMembers, setAssignedMembers] = useState<formUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<formUserData | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  /**
   * Candidates, a page at a time and only once the dialog is open.
   *
   * The whole roster used to be pulled the moment a row was expanded — a
   * request for every project you glance at, to fill a list most of those
   * glances never open. It is asked for when somebody actually goes to assign
   * somebody, and then a page at a time, the way the report's picker does it.
   */
  const [candidates, setCandidates] = useState<formUserData[]>([]);
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPages, setRosterPages] = useState(1);
  const [rosterLoading, setRosterLoading] = useState(false);


  /**
   * The project answers "who is on it" directly now. It used to be worked out
   * by fetching every user and filtering on their own `projects[]`, which is a
   * lot of rows to read to list three names.
   */
  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const project = await fetchProject(row.id);
      setAssignedMembers((project?.members ?? []) as unknown as formUserData[]);
    } catch {
      showSnackbar({ message: "Failed to load the team", severity: "error" });
      setAssignedMembers([]);
    } finally {
      setLoading(false);
    }
    // showSnackbar is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  /**
   * One page of candidates, replacing the page before it.
   *
   * An SP staffs projects with managers, an AM with its own team. The API
   * filters on one role and an AM needs two, so their pages are narrowed here
   * afterwards — which, together with dropping whoever is already on the
   * project, means a page can render short. Harmless when Next is right there.
   */
  const loadCandidates = useCallback(
    async (page: number) => {
      setRosterLoading(true);
      try {
        const res = await fetchUsers({
          page,
          limit: ROSTER_PAGE,
          ...(isSP ? { role: "AM" } : {}),
        });
        const here = new Set(assignedMembers.map((m) => String(m.id)));
        setCandidates(
          (res?.users ?? []).filter((u) => {
            if (here.has(String(u.id))) return false;
            if (isSP) return true;
            const r = String(u.role ?? "").toUpperCase();
            return r === "USER" || r === "DEVLOPER";
          })
        );
        setRosterPage(page);
        setRosterPages(res?.totalPages || 1);
      } catch {
        showSnackbar({ message: "Failed to load users", severity: "error" });
      } finally {
        setRosterLoading(false);
      }
    },
    // showSnackbar is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSP, assignedMembers]
  );

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    try {
      await removeProjectMembers(String(row.id), [String(removeTarget.id)]);
      showSnackbar({ message: `${removeTarget.fullName} removed`, severity: "success" });
      await loadMembers();
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
    void loadCandidates(1);
  };

  const handleAssignSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    setAssignLoading(true);
    try {
      await assignProjectMembers(String(row.id), selectedUserIds);
      showSnackbar({ message: `${selectedUserIds.length} member(s) assigned`, severity: "success" });
      setAssignOpen(false);
      await loadMembers();
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
          <div style={{ maxHeight: 300, overflowY: "auto", marginTop: 8 }}>
            {candidates.map((user) => {
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
            {candidates.length === 0 && !rosterLoading && (
              <p className="text-center py-3" style={{ fontSize: 13, color: "#9ca3af" }}>
                No available users to assign.
              </p>
            )}
          </div>

          {/*
            * One page at a time, with the way back beside the way on — the
            * same control the report's team picker uses.
            */}
          {rosterPages > 1 && (
            <div
              className="d-flex align-items-center justify-content-between gap-2 mt-2 pt-2"
              style={{ borderTop: "1px solid var(--border-light)" }}
            >
              <Button
                size="small"
                disabled={rosterLoading || rosterPage <= 1}
                onClick={() => void loadCandidates(rosterPage - 1)}
                sx={{ textTransform: "none", color: "#7c3aed", fontWeight: 600 }}
              >
                Previous
              </Button>
              <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
                {rosterLoading ? "Loading…" : `${rosterPage} of ${rosterPages}`}
              </span>
              <Button
                size="small"
                disabled={rosterLoading || rosterPage >= rosterPages}
                onClick={() => void loadCandidates(rosterPage + 1)}
                sx={{ textTransform: "none", color: "#7c3aed", fontWeight: 600 }}
              >
                Next
              </Button>
            </div>
          )}
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
