import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import TableList from "../../shared/Table/Table";
import { fetchUsers } from "../../core/actions/spAction";
import { getUserColumns } from "../sp/tableColoumn";
import prLogo from "../../assets/img/prLogo.png";
import type { formUserData } from "../../shared/User/types";

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
  "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600 },
};

const TeamManagement: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<formUserData[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
    <div className="container py-4 px-2 sm:px-6 md:px-8">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.75rem" }}>
            Team Management
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            Manage your team members and their roles
          </p>
        </div>

        <button
          className="btn text-white"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            padding: "6px 16px",
          }}
          onClick={() => navigate("/am/create-user")}
        >
          + Create User
        </button>
      </div>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, ...selectSx }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#6b7280", fontSize: 18 }} />
              </InputAdornment>
            ),
          },
        }}
      />

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
    </div>
  );
};

export default TeamManagement;
