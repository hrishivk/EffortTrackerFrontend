import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import TableList from "../../../shared/components/Table/Table";
import { fetchUsers, Deletetuser } from "../../../core/actions/spAction";
import { getUserColumns } from "../../sp/components/tableColoumn";
import type { formUserData } from "../../../shared/types/User";
import Dialoge from "../../../presentation/Dialog/Dialog";
import { useSnackbar } from "../../../contexts/SnackbarContext";

const ITEMS_PER_PAGE = 10;

const searchSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 3px rgba(124,58,237,0.08)",
    },
  },
  "& .MuiInputBase-input": {
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-primary)",
  },
};

const TeamManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [users, setUsers] = useState<formUserData[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadUsers = useCallback(async () => {
    try {
      const result = await fetchUsers({
        search: debouncedSearch,
        page,
        limit: ITEMS_PER_PAGE,
      });

      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching team users:", error);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onViewTasks = (id: string) => navigate(`/am/dashboard?viewUser=${id}`);
  const onDeleteUser = (id: string) => setDeleteUserId(id);

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;
    try {
      await Deletetuser(deleteUserId);
      setDeleteUserId(null);
      showSnackbar({ message: "User deleted successfully", severity: "success" });
      loadUsers();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete user";
      showSnackbar({ message: msg, severity: "error" });
    }
  };

  const columns = getUserColumns({ onViewTasks, onDeleteUser });

  return (
    <div className="min-h-screen px-3 py-4 sm:px-6 md:px-8" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "var(--text-primary)" }}>
              Team Management
            </h2>
            <p className="mt-1 mb-0" style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
              Manage your team members and their roles
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <TextField
              size="small"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 240, ...searchSx }}
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

            <button
              className="btn text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 16px",
                whiteSpace: "nowrap",
              }}
              onClick={() => navigate("/am/create-user")}
            >
              + Create User
            </button>
          </div>
        </div>

        {/* Table */}
        <TableList
          columns={columns}
          data={users}
          pagination={{
            currentPage: page,
            totalPages,
            onPageChange: setPage,
          }}
          emptyMessage="No team members found"
        />

        <Dialoge
          open={!!deleteUserId}
          data="delete"
          onClose={() => setDeleteUserId(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
};

export default TeamManagement;
