import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TableList from "../../../shared/components/Table/Table";
import {
  fetchUsers,
  fetchAllExistProjects,
  Deletetuser,
} from "../../../core/actions/spAction";
import Dialoge from "../../../presentation/Dialog/Dialog";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import type { formUserData } from "../../../shared/types/User";
import type { project } from "../../../shared/types/Project";
import { getUserColumns } from "./tableColoumn";
import SearchIcon from "@mui/icons-material/Search";
import {
  FormControl,
  MenuItem,
  Select,
  TextField,
  InputAdornment,
} from "@mui/material";
const ITEMS_PER_PAGE = 10;
const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiSelect-select": { padding: "6px 12px", color: "var(--text-primary)" },
  "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" },
  "& .MuiSelect-icon": { color: "var(--text-muted)" },
};

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [users, setUsers] = useState<formUserData[]>([]);
  const [projects, setProjects] = useState<project[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, projectFilter, roleFilter]);

  const loadUsers = useCallback(async () => {
    try {
      const result = await fetchUsers({
        search: debouncedSearch,
        role: roleFilter,
        project_id: projectFilter,
        page,
        limit: ITEMS_PER_PAGE,
      });

      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [debouncedSearch, roleFilter, projectFilter, page]);

  const loadProjects = useCallback(async () => {
    const res = await fetchAllExistProjects();
    setProjects(res.data);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const roles = useMemo(() => ["AM", "USER", "DEVLOPER"], []);

  const onViewTasks = (id: string) => navigate(`/sp/dashboard?viewUser=${id}`);
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
    <div className="um-page">
      <div className="um-header">
        <div className="um-title">
          <h2>User Management</h2>
          <p>Manage all users and managers within system</p>
        </div>

        <div className="um-filters">
          <TextField
            size="small"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="um-search"
            sx={selectSx}
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

          <FormControl size="small" className="um-filter-select" sx={selectSx}>
            <Select
              displayEmpty
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              renderValue={(val) => {
                if (!val) return "Project: All";
                const found = projects.find((p) => String(p.id) === val);
                return `Project: ${found?.name || val}`;
              }}
            >
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="um-filter-select" sx={selectSx}>
            <Select
              displayEmpty
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              renderValue={(val) => (val ? `Role: ${val}` : "Role: All")}
            >
              <MenuItem value="">All Roles</MenuItem>
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <button
            className="um-add-btn"
            onClick={() => navigate("/sp/create-user")}
          >
            + Add User
          </button>
        </div>
      </div>

      <TableList
        columns={columns}
        data={users}
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: setPage,
        }}
      />

      <Dialoge
        open={!!deleteUserId}
        data="delete"
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default UserManagement;
