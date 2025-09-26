import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Pencil, Trash2, Lock, Unlock } from "lucide-react";
import "@coreui/coreui/dist/css/coreui.min.css";
import {
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  CCard,
  CCardBody,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAvatar,
  CPagination,
  CPaginationItem,
} from "@coreui/react";
import "@coreui/coreui/dist/css/coreui.min.css";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { useAppSelector } from "../../store/configureStore";
import {
  BlockUser,
  Deletetuser,
  fetchAllUsers,
  fetchExistProjects,
  fetchUser,
  UnblockUser,
} from "../../core/actions/spAction";
import prLogo from "../../assets/img/prLogo.png";
import { fetchAmUsers } from "../../core/actions/AmAction";
import UserModal from "../User/UserModal";
import type { project } from "../Project/types";
import SpinLoader from "../../presentation/SpinLoader";
import Dialoge from "../../presentation/Dialog/Dialog";
import ProjectModal from "../Project/ProjectModal";
import DomainModal from "../Domain/DomainModal";
import type { formUserData } from "./types";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);
const TableList: React.FC = () => {
  const { showSnackbar } = useSnackbar();
   const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const id = user?.id;
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectVisible, setVisible] = useState(false);
  const [domainVisible, setDomainVisible] = useState(false);
  const [data, setData] = useState<formUserData[]>([]);
  const [userData, setUserData] = useState<formUserData | null>(null);
  const [project, setProject] = useState<project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedProject, setSelectedProject] = useState("All Projects");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedStatus, setselectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const listAllUsers = async () => {
    const response =
      role === "SP"
        ? await fetchAllUsers()
        : role === "AM"
        ? await fetchAmUsers(id as string)
        : null;
    if (response) {
      setData(response.data);
    }
  };
  const listAllData = useCallback(async () => {
    try {
      const projectResponse = await fetchExistProjects();
      setProject(projectResponse.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await listAllUsers();
      await listAllData();
      setLoading(false);
    };
    fetchData();
  }, [modalVisible, projectVisible, listAllData]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedProject]);

  const filteredData = data.filter((user) => {

    const roleMatch =
      selectedRole === "All Roles" || user.role === selectedRole;

    const projectMatch =
      selectedProject === "All Projects" ||
      (user.Project &&
        (user.Project.name
          .toLowerCase()
          .includes(selectedProject.toLowerCase()) ||
          user.Project.id === selectedProject));

    const searchMatch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return roleMatch && projectMatch && searchMatch;
  });

  const handleClickView = async (id: string) => {
    try {
      setModalVisible(true);
      const response = await fetchUser(id);
      setUserData(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const handleClickDelete = (id: string) => {
    console.log(id);
    setSelectedUserId(id);
    setselectedStatus("delete");
    setOpenDialog(true);
  };
  const handleClickBlock = (id: string, status: boolean) => {
    setSelectedUserId(id);
    setselectedStatus(status ? "block" : "unblock");
    setOpenDialog(true);
  };
  const handleClickUnBlock = (id: string, status: boolean) => {
    console.log("enter unblock", id);
    setSelectedUserId(id);
    setselectedStatus(status ? "block" : "unblock");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUserId(null);
  };
  const handleConfirm = async (
    selectedUserId?: string,
    selectedStatus?: string
  ) => {
    if (!selectedUserId) {
      console.warn("Missing user ID");
      return;
    }
    if (
      !selectedStatus ||
      !["block", "unblock", "delete"].includes(selectedStatus)
    ) {
      console.warn("Invalid or missing action");
      return;
    }
    const actionMap: Record<string, () => Promise<any>> = {
      unblock: () => UnblockUser(selectedUserId),
      block: () => BlockUser(selectedUserId),
      delete: () => Deletetuser(selectedUserId),
    };
    const messageMap: Record<string, string> = {
      unblock: "User unblocked successfully.",
      block: "User blocked successfully.",
      delete: "User record deleted successfully.",
    };
    const errorMap: Record<string, string> = {
      unblock: "Failed to unblock user.",
      block: "Failed to block user.",
      delete: "Failed to delete user.",
    };
    const actionKey = selectedStatus;
    try {
      const response = await actionMap[actionKey]();
      if (response?.success) {
        handleCloseDialog();
        await listAllUsers();
        showSnackbar({ message: messageMap[actionKey], severity: "success" });
      }
    } catch (error) {
      console.error("Action failed:", error);
      showSnackbar({ message: errorMap[actionKey], severity: "error" });
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  console.log(currentItems)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
   navigate(`/taskList/${id}`)
  };

  if (loading) {
    return <SpinLoader isLoading={loading} />;
  }

  return (
    <div className="container py-4 px-2 sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="flex flex-col">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800">
            {role === "AM" ? "Team Management" : "User Management"}
          </h2>
          <p className="text-[#7D6387] text-lg">
            Manage all users and managers within system
          </p>
        </div>
        <div className="flex flex-row gap-3">
          {role === "SP" && (
            <button
              style={{ borderRadius: "10px", backgroundColor: "#2263E4" }}
              className="rx-loader-btn cursor-pointer text-white font-medium rounded-[20px] px-6 py-2 text-sm font-inherit border-0 transition-all duration-300 ease-in-out"
              onClick={() => setDomainVisible(true)}
            >
              + Add Domain
            </button>
          )}
          <button
            style={{ borderRadius: "10px" }}
            className="rx-loader-btn cursor-pointer text-white rounded-[20px] px-6 py-2 text-sm font-inherit border-0 
                bg-gradient-to-br from-[#a855f7] to-[#d8b4fe] bg-[length:200%_auto] bg-left 
                transition-all duration-300 ease-in-out hover:bg-right"
            onClick={() => setVisible(true)}
          >
            + Add Project
          </button>
          <button
            style={{ borderRadius: "10px", backgroundColor: "#F0EBF2" }}
            className="rx-loader-btn cursor-pointer text-black font-medium rounded-[20px] px-6 py-2 text-sm font-inherit border-0 transition-all duration-300 ease-in-out"
            onClick={() => setModalVisible(true)}
          >
            + Add User
          </button>
        </div>
      </div>

      <Box>
        <Stack spacing={2}>
          {/* Search Input */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              backgroundColor: "#F0EBF2",
              borderRadius: 3,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  border: "none",
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "none",
                },
              },
            }}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel id="project-filter-label">All Projects</InputLabel>
              <Select
                labelId="project-filter-label"
                label="All Projects"
                defaultValue=""
                onChange={(e) => setSelectedProject(e.target.value)}
                sx={{
                  borderRadius: 3,
                  backgroundColor: "#F9F9FB",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#D1D5DB",
                  },
              
                }}
              >
                <MenuItem value="All Projects">All Projects</MenuItem>
                {project.map((item, index) => (
                  <MenuItem key={index} value={item.name}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Role Filter */}
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel id="role-filter-label">All Roles</InputLabel>
              <Select
                labelId="role-filter-label"
                label="All Roles"
                defaultValue=""
                onChange={(e) => setSelectedRole(e.target.value)}
                sx={{
                  borderRadius: 3,
                  backgroundColor: "#F9F9FB",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#D1D5DB",
                  }
                }}
              >
                <MenuItem value="All Roles">All Roles</MenuItem>
                {[...new Set(data.map((item) => item.role))].map(
                  (role, index) => (
                    <MenuItem key={index} value={role}>
                      {role}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Box>

      {/* Table */}
      <CCard className="rounded-4 shadow-sm mt-6">
        <CCardBody className="p-0">
          <CTable hover responsive align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Project(s)</CTableHeaderCell>
                <CTableHeaderCell>Role</CTableHeaderCell>
                <CTableHeaderCell>Last Active</CTableHeaderCell>
                <CTableHeaderCell>Tasks</CTableHeaderCell>
                {role === "SP" && <CTableHeaderCell>Actions</CTableHeaderCell>}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {currentItems.length > 0 ? (
                currentItems.map((user, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>
                      <div className="d-flex align-items-center gap-2">
                        <CAvatar src={prLogo} size="md" />
                        {user.fullName}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>{user.email}</CTableDataCell>
                 <CTableDataCell>{user.Project?.name || "No Project"}</CTableDataCell>

                    <CTableDataCell>
                      <span className="badge text-bg-light">{user.role}</span>
                    </CTableDataCell>
                    <CTableDataCell>
                      {!user.lastSeenAt ? (
                        <span className="flex items-center gap-1 text-green-700 font-semibold text-sm">
                          <span
                            className="w-3 h-3 rounded-full bg-green-500 inline-block"
                            aria-label="online"
                            title="Online"
                          ></span>
                          Active
                        </span>
                      ) : user.lastSeenAt === "No login activity recorded" ? (
                        "No login activity recorded"
                      ) : (
                        `Last seen ${dayjs(user.lastSeenAt).format(
                          "DD MMM YYYY, h:mm A"
                        )}`
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <button
                        className="text-blue"
                        onClick={(e) => handleClick(e, user.id!)}
                      >
                        View Task
                      </button>
                    </CTableDataCell>

                    {role === "SP" && (
                      <CTableDataCell>
                        <div className=" flex-items w-full">
                          <button
                            onClick={() => handleClickView(user.id!)}
                            className="group p-1.5 rounded-md hover:bg-indigo-50 transition"
                            title="Edit"
                          >
                            <Pencil
                              size={18}
                              className="text-indigo-600 group-hover:text-indigo-800 transition"
                            />
                          </button>
                          <button
                            onClick={() => handleClickDelete(user.id!)}
                            className="group p-1.5 rounded-md hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2
                              size={18}
                              className="text-red-500 group-hover:text-red-700 transition"
                            />
                          </button>
                          {/* {!user.isBlocked ? (
                            <button
                              className="group p-1.5 rounded-md hover:bg-gray-100 transition"
                              title="Unblock"
                              onClick={() => handleClickUnBlock(user.id!, true)}
                            >
                              <Unlock
                                size={18}
                                className="text-green-600 group-hover:text-green-800 transition"
                              />
                            </button>
                          ) : (
                            <button
                              className="group p-1.5 rounded-md hover:bg-gray-100 transition"
                              title="block"
                            >
                              <Lock
                                size={18}
                                className="text-gray-600 group-hover:text-gray-800 transition"
                                onClick={() =>
                                  handleClickBlock(user.id!, false)
                                }
                              />
                            </button>
                          )} */}
                        </div>
                      </CTableDataCell>
                    )}
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell
                    colSpan={role === "SP" ? 7 : 6}
                    className="text-center"
                  >
                    No data found
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
      <Dialoge
        open={openDialog}
        data={selectedStatus}
        onClose={handleCloseDialog}
        onConfirm={() => handleConfirm(selectedUserId!, selectedStatus!)}
      />
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4 cursor-pointer">
          <CPagination aria-label="Page navigation example ">
            <CPaginationItem
              aria-label="Previous"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </CPaginationItem>
            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <CPaginationItem
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </CPaginationItem>
              );
            })}
            <CPaginationItem
              aria-label="Next"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              Next
            </CPaginationItem>
          </CPagination>
        </div>
      )}

      {/* Modals */}
      <UserModal
        data={userData}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setUserData(null);
        }}
        onUpdate={listAllUsers}
      />
      <ProjectModal
        visible={projectVisible}
        onClose={() => setVisible(false)}
      />
      <DomainModal
        visible={domainVisible}
        onClose={() => setDomainVisible(false)}
      />
    </div>
  );
};

export default TableList;
