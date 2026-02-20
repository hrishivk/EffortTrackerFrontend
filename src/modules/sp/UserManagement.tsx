import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TableList from "../../shared/Table/Table";
import {
  fetchUsers,
  fetchAllExistProjects,
} from "../../core/actions/spAction";
import type { formUserData } from "../../shared/User/types";
import type { project } from "../../shared/Project/types";
import { getUserColumns } from "./tableColoumn";
import prLogo from "../../assets/img/prLogo.png";
import SearchIcon from "@mui/icons-material/Search";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  InputAdornment,
} from "@mui/material";

const ITEMS_PER_PAGE = 10;

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    fontSize: 13,
    fontWeight: 600,
    "& fieldset": { borderColor: "#e5e7eb" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiSelect-select": { padding: "6px 12px" },
  "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600 },
};

const UserManagement: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<formUserData[]>([]);
  const [projects, setProjects] = useState<project[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

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

  const onViewTasks = (id: string) => navigate(`/taskList/${id}`);
  const onEditUser = (id: string) => console.log("Edit user", id);
  const onDeleteUser = (id: string) => console.log("Delete user", id);

  const columns = getUserColumns({
    onViewTasks,
    onEditUser,
    onDeleteUser,
    avatarSrc: prLogo,
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem" }}>
            User Management
          </h2>
          <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.90rem" }}>
            Manage all users and managers within system
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <TextField
            size="small"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 200, ...selectSx }}
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

          <FormControl size="small" sx={{ minWidth: 150, ...selectSx }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={projectFilter}
              label="Project"
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140, ...selectSx }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
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
            className="btn text-white"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 16px",
              whiteSpace: "nowrap",
            }}
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
    </div>
  );
};

export default UserManagement;
