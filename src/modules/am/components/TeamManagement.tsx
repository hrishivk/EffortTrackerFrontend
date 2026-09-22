import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import TableList from "../../../shared/components/Table/Table";
import { fetchUsers, Deletetuser, fetchAllExistProjects } from "../../../core/actions/spAction";
import { getUserColumns } from "../../sp/components/UserManagement/tableColoumn";
import Dialoge from "../../../presentation/Dialog";
import EditUserModal from "../../../shared/components/User/EditUserModal";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import type { formUserData } from "../../../shared/types/User";
import type { project } from "../../../shared/types/Project";
import { useAppSelector } from "../../../store/configureStore";
import { FiLayers, FiUserCheck, FiUsers } from "react-icons/fi";
import FilterPanel, {
  FilterTrigger,
  countActiveFilters,
  type FilterCategory,
  type FilterValues,
} from "../../../shared/components/FilterPanel/FilterPanel";


const ITEMS_PER_PAGE = 10;

/** What an AM's team is made of — the only two roles they can hold. */
const TEAM_ROLES = ["USER", "DEVLOPER"];

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
  const { user } = useAppSelector((state) => state.user);

  const [users, setUsers] = useState<formUserData[]>([]);
  const [projects, setProjects] = useState<project[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({ projectId: "", role: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<formUserData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // A narrowed list is shorter than the page you were reading.
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
      console.error("Error fetching team users:", error);
    }
  }, [debouncedSearch, page, filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);


  const loadProjects = useCallback(async () => {
    try {
      const res = await fetchAllExistProjects();
      const own = (res?.data || []).filter((p: any) =>
        (p.teamAssigned || []).some(
          (member: any) => String(member.id) === String(user?.id),
        ),
      );
      setProjects(own);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const onViewTasks = (id: string, fullName?: string) =>
    navigate(
      `/am/dashboard?viewUser=${id}` +
        (fullName ? `&viewUserName=${encodeURIComponent(fullName)}` : "")
    );
  const onEditUser = (row: formUserData) => setEditUser(row);
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

  const columns = getUserColumns({ onViewTasks, onEditUser, onDeleteUser });
  const activeFilterCount = countActiveFilters(filters);

  /**
   * The two questions worth asking of a team list: who is on which project, and
   * who does what. Both are server-side filters on `/list-users`, so the pager
   * below stays honest — a client-side narrowing would leave pages short.
   *
   * The projects offered are the AM's own, the same ones the page already
   * loaded; a project they do not run has nobody of theirs on it.
   */
  const filterCategories: FilterCategory[] = [
    {
      key: "team",
      label: "Projects & Roles",
      icon: <FiUsers size={16} />,
      caption: "Narrow the team by what they are on and what they do",
      fields: [
        {
          key: "projectId",
          label: "Project",
          placeholder: "Select project",
          emptyText: "You have no projects yet",
          icon: <FiLayers size={15} />,
          options: projects.map((p) => ({ value: String(p.id), label: p.name })),
        },
        {
          key: "role",
          label: "Role",
          placeholder: "Select role",
          emptyText: "No roles available",
          icon: <FiUserCheck size={15} />,
          options: TEAM_ROLES.map((r) => ({ value: r, label: r })),
        },
      ],
    },
  ];

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
              name="teamSearch"
              autoComplete="off"
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

            <FilterTrigger
              count={activeFilterCount}
              onClick={() => setFilterOpen(true)}
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

        <EditUserModal
          open={!!editUser}
          user={editUser}
          projects={projects}
          onClose={() => setEditUser(null)}
          onSaved={loadUsers}
        />

        <FilterPanel
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title="Filter Team"
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
      </div>
    </div>
  );
};

export default TeamManagement;
