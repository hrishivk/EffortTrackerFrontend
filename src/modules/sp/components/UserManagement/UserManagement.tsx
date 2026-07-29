import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TableList from "../../../../shared/components/Table/Table";
import {
  fetchUsers,
  fetchAllExistProjects,
  Deletetuser,
} from "../../../../core/actions/spAction";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import type { formUserData } from "../../../../shared/types/User";
import type { project } from "../../../../shared/types/Project";
import { getUserColumns } from "./tableColoumn";
import SearchIcon from "@mui/icons-material/Search";
import { TextField, InputAdornment } from "@mui/material";
import { motion } from "framer-motion";
import { FiGrid, FiLayers, FiUsers } from "react-icons/fi";
import Dialoge from "../../../../presentation/Dialog";
import FilterPanel, {
  FilterTrigger,
  countActiveFilters,
  type FilterCategory,
  type FilterValues,
} from "../../../../shared/components/FilterPanel/FilterPanel";
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
  const [filters, setFilters] = useState<FilterValues>({
    projectId: "",
    role: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  const loadUsers = useCallback(async () => {
    try {
      const result = await fetchUsers({
        search: debouncedSearch,
        role: filters.role,
        project_id: filters.projectId,
        page,
        limit: ITEMS_PER_PAGE,
      });

      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [debouncedSearch, filters, page]);

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
  const activeFilterCount = countActiveFilters(filters);

  const filterCategories: FilterCategory[] = [
    {
      key: "projectsRoles",
      label: "Projects & Roles",
      icon: <FiGrid size={16} />,
      caption: "Filter by project and role",
      fields: [
        {
          key: "projectId",
          label: "Project",
          placeholder: "Select project",
          emptyText: "No projects available",
          icon: <FiLayers size={15} />,
          options: projects.map((p) => ({
            value: String(p.id),
            label: p.name,
          })),
        },
        {
          key: "role",
          label: "Role",
          placeholder: "Select role",
          emptyText: "No roles available",
          icon: <FiUsers size={15} />,
          options: roles.map((r) => ({ value: r, label: r })),
        },
      ],
    },
  ];

  return (
    <motion.div
      className="um-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
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

          <FilterTrigger
            count={activeFilterCount}
            onClick={() => setFilterOpen(true)}
          />

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

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Users"
        categories={filterCategories}
        values={filters}
        onApply={setFilters}
      />

      <Dialoge
        open={!!deleteUserId}
        data="delete"
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  );
};

export default UserManagement;
