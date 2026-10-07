import React, { useCallback, useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CCardBody, CCard } from "@coreui/react";
import { useAppSelector, type AppDispatch } from "../../../store/configureStore";
import { useParams } from "react-router-dom";
import {
  taskValidationSchema,
  taskWithDateValidationSchema,
} from "../../../utils/validation/Validation";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { type SelectChangeEvent, TextField } from "@mui/material";
import {
  addTask,
  fetchTask,
  setTaskLock,
  updateTaskStatus,
} from "../../../core/actions/action";

import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import SpinLoader from "../../../presentation/SpinLoader";

import type { taskList, CreateTaskPayload } from "../types";
import { fetchExistProjects } from "../../../core/actions/spAction";
import type { project } from "../../../shared/types/Project";
import Dialoge from "../../../presentation/Dialog";
import TaskRow from "./TaskRow";
import NewTaskRow from "./NewTaskRow";
import TaskPagination from "./TaskPagination";
import { collectZodErrors, isToday } from "../utils/taskTime";
import { exportTasksCsv } from "../utils/exportTasksCsv";

const ITEMS_PER_PAGE = 10;

const TaskList: React.FC = () => {
  const { showSnackbar } = useSnackbar();
  const { id: paramId } = useParams<{ id?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLocked } = useAppSelector((state) => state.user);
  const id: string = paramId ?? String(user?.id ?? "");
  const isFromParams = paramId !== undefined;
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const [data, setData] = useState<taskList[]>([]);
  const [project, setProject] = useState<project[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskData, setTaskData] = useState<CreateTaskPayload>({
    created_by: user?.id,
    assigned_to: paramId || user?.id,
    project: "",
    description: "",
    priority: "",
  });

  const listAllData = useCallback(async () => {
    try {
      if (id) {
        const projectResponse = await fetchExistProjects();
        setProject(projectResponse.data);
        const response = await fetchTask(selectedDate, id, user?.role, undefined, { page, limit: ITEMS_PER_PAGE });
        setData(response.data || []);
        setTotalPages(response.totalPages || 1);
      } else {
        console.warn("Missing user ID");
      }
    } catch (error: any) {
      console.log(error);
      if (error.message === "Request failed with status code 304") {
        setData([]);
        showSnackbar({
          message: "No tasks found for the chosen date",
          severity: "info",
        });
      }
    }
  }, [selectedDate, id, showSnackbar, page]);

  const showFieldErrors = (errorMessage: { [key: string]: string }) => {
    setFieldErrors(errorMessage);
    showSnackbar({ message: Object.values(errorMessage)[0], severity: "error" });
  };

  const handleChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | SelectChangeEvent<string>
  ) => {
    setTaskData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleStatusChange = async (
    taskId: string | undefined,
    newStatus: string
  ) => {
    if (!taskId) {
      console.warn("Task ID is undefined");
      return;
    }
    try {
      if (newStatus === "In Progress" || newStatus === "Completed") {
        await updateTaskStatus(taskId, newStatus);
        await listAllData();
      }
      setData((prevData) =>
        prevData.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error: any) {
      console.log(error);
      showSnackbar({
        message: error.response?.data?.message || "Failed to update status",
        severity: "error",
      });
    }
  };

  const handleDateChange = (date: Date) => {
    const validationResult = taskWithDateValidationSchema.safeParse({
      dueDate: date.toISOString(),
    });
    if (!validationResult.success) {
      showFieldErrors(collectZodErrors(validationResult.error));
    } else {
      setSelectedDate(date);
      setPage(1);
    }
  };

  const handleTaskClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const result = taskValidationSchema.safeParse(taskData);
      if (!result.success) {
        showFieldErrors(collectZodErrors(result.error));
        return;
      }

      const response = await addTask(taskData);
      if (response.success) {
        showSnackbar({
          message: "Success: Task created successfully and ready for tracking",
          severity: "success",
        });
        setTaskData({
          created_by: user?.id,
          assigned_to: paramId,
          project: "",
          description: "",
          priority: "",
        });
        await listAllData();
      }
    } catch (error: any) {
      console.log(error);
      showSnackbar({
        message: error.response?.data?.message || "Failed to add task",
        severity: "info",
      });
    }
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmLock = async () => {
    try {
      if (id) {
        await dispatch(setTaskLock({ date: selectedDate, id })).then((result) =>
          setTaskLock.fulfilled.match(result)
            ? showSnackbar({
                message:
                  "Success: All tasks have been locked successfully and are now read-only.",
                severity: "success",
              })
            : showSnackbar({
                message: `Failed to lock tasks: ${
                  result.payload || result.error.message
                }`,
                severity: "error",
              })
        );
      } else {
        console.warn("Missing user ID");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      showSnackbar({
        message: "An unexpected error occurred while locking tasks.",
        severity: "error",
      });
    } finally {
      setOpenDialog(false);
    }
  };

  const filterData = data.filter((task) =>
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const today = isToday(selectedDate);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await listAllData();
      setLoading(false);
    };
    fetchData();
  }, [selectedDate, page]);

  if (loading) {
    return <SpinLoader isLoading={loading} />;
  }
  return (
    <motion.div
      className="min-h-screen flex flex-col lg:flex-row max-w-screen-2xl mx-auto"
      style={{ backgroundColor: "var(--bg-card)" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="w-full lg:w-1/4 py-6 lg:py-12">
        <div className="w-full mx-auto max-w-sm">
          <CCard className="w-full h-full">
            <CCardBody className="flex justify-center items-center h-full p-2">
              <div className="w-full">
                <Calendar
                  value={selectedDate}
                  onChange={(date) => handleDateChange(date as Date)}
                />
              </div>
            </CCardBody>
          </CCard>
        </div>
      </div>

      <div className="w-full lg:w-3/4 px-4 sm:px-6 py-6">
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>Task List</h1>
              {today && (
                <button
                  className="rx-loader-btn cursor-pointer text-white border-0 transition-all duration-300 ease-in-out"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                  onClick={handleTaskClick}
                >
                  + Add Task
                </button>
              )}
            </div>
            <p className="text-[#825294] text-sm mb-4">
              Manage your task and track time spent
            </p>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by task"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                backgroundColor: "#F0EBF2",
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: 13,
                  fontWeight: 600,
                  "& fieldset": { border: "none" },
                  "&:hover fieldset": { border: "none" },
                  "&.Mui-focused fieldset": { border: "none" },
                },
                "& .MuiInputBase-input": { padding: "6px 12px", fontSize: 13, fontWeight: 600 },
              }}
            />

            <div className="flex flex-col sm:flex-row sm:!space-x-4 space-y-4 sm:space-y-0 mt-6 mb-6"></div>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Tasks for {selectedDate.toDateString()}
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border-2 border-[#F0E8F2]">
            <table className="min-w-full text-sm border-spacing-0">
              <thead style={{ backgroundColor: "var(--bg-surface)" }}>
                <tr className="text-md text-left">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Task Description</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Start </th>
                  <th className="px-4 py-3">End </th>
                  <th className="px-6 py-3">TotalSpent</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-light)" }}>
                {data.length > 0 ? (
                  filterData.map((task, index) => (
                    <TaskRow key={index} task={task} onStatusChange={handleStatusChange} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6" style={{ color: "var(--text-muted)" }}>
                      No tasks found for the selected date
                    </td>
                  </tr>
                )}
                {today && (
                  <NewTaskRow
                    taskData={taskData}
                    projects={project}
                    fieldErrors={fieldErrors}
                    onChange={handleChange}
                  />
                )}
              </tbody>
            </table>
          </div>
          <TaskPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          {today && (
            <div className="flex flex-row space-x-4  sm:!flex-row  justify-end items-center space-y-2 sm:space-y-0 sm:!space-x-4 mt-4">
              <button
                className="rx-loader-btn cursor-pointer text-black border-0 transition-all duration-300 ease-in-out"
                style={{ backgroundColor: "#F0E8F2", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                onClick={() => exportTasksCsv(filterData, selectedDate)}
              >
                Export to CSV
              </button>
              {!isLocked &&
                data.length > 0 &&
                data[0].isLocked === false &&
                !isFromParams && (
                  <>
                    <button
                      className="rx-loader-btn cursor-pointer text-white border-0 transition-all duration-300 ease-in-out"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                      onClick={handleSubmit}
                    >
                      Submit All
                    </button>
                    <Dialoge
                      open={openDialog}
                      onClose={handleCloseDialog}
                      onConfirm={handleConfirmLock}
                    />
                  </>
                )}
            </div>
          )}
          <p className="text-center text-[#825294] text-xs sm:text-lg !mt-12">
            ©2025 KREW. All rights reserved.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskList;
