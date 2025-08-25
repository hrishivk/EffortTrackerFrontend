import React, { useCallback, useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CCardBody, CCard } from "@coreui/react";
import { fetchExistProjects } from "../../core/actions/spAction";
import { useAppSelector, type AppDispatch } from "../../store/configureStore";
import { useParams } from "react-router-dom";
import {taskValidationSchema,taskWithDateValidationSchema,} from "../../utils/validation/Validation";
import { useSnackbar } from "../../contexts/SnackbarContext";
import {addTask,fetchTask,setTaskLock,updateTaskStatus,} from "../../core/actions/action";
import { useDispatch } from "react-redux";
import SpinLoader from "../../presentation/SpinLoader";
import type { project } from "../../shared/Project/types";
import Dialoge from "../../presentation/Dialog/Dialog";
import type { taskList } from "./types";
import { Box,FormControl, InputLabel,Select,MenuItem,Stack,TextField,} from "@mui/material";
const TaskList: React.FC = () => {
  const { showSnackbar } = useSnackbar();
  const { id: paramId } = useParams<{ id?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLocked } = useAppSelector((state) => state.user);
  const id = paramId !== undefined ? Number(paramId) : user?.id;
  const isFromParams = paramId !== undefined;
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [project, setProject] = useState<project[]>([]);
  const [data, setData] = useState<taskList[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskData, setTaskData] = useState<taskList>({
    userId: id,
    project: "",
    description: "",
    priority: "",
  });
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  const listAllData = useCallback(async () => {
    try {
      const projectResponse = await fetchExistProjects();

      setProject(projectResponse.data);
      typeof id === "number"
        ? setData((await fetchTask(selectedDate, id)).data)
        : console.warn("Invalid or missing numeric ID");
    } catch (error: any) {
      console.log(error);
      if (error.message == "Request failed with status code 304") {
        setData([]);
        showSnackbar({
          message: "No tasks found for the chosen date",
          severity: "info",
        });
      }
    }
  }, [selectedDate, id]);
  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    try {
      setTaskData((prevState) => ({
        ...prevState,
        [e.target.name]: e.target.value,
      }));
    } catch (error) {
      console.log(error);
    }
  };
  const handleStatusChange = async (
    taskId: number | undefined,
    newStatus: string
  ) => {
    console.log("enterrrrr", newStatus);
    if (taskId === undefined) {
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
      showSnackbar({
        message: error.response.data.message,
        severity: "error",
      });
    }
  };
  const handleDateChange = (date: Date) => {
    const dateString = date.toISOString();
    const validationResult = taskWithDateValidationSchema.safeParse({
      dueDate: dateString,
    });
    if (!validationResult.success) {
      const errorMessage: { [key: string]: string } = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errorMessage[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errorMessage);
      const firstErrorMessage = Object.values(errorMessage)[0];
      showSnackbar({ message: firstErrorMessage, severity: "error" });
      return;
    } else {
      setSelectedDate(date);
    }
  };
  const handleTaskClick = async (e: React.MouseEvent) => {
    try {
      const result = taskValidationSchema.safeParse(taskData);
      if (!result.success) {
        const errorMessage: { [key: string]: string } = {};
        result.error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errorMessage[err.path[0] as string] = err.message;
          }
        });
        setFieldErrors(errorMessage);
        const firstErrorMessage = Object.values(errorMessage)[0];
        showSnackbar({ message: firstErrorMessage, severity: "error" });
        return;
      } else {
        const response = await addTask(taskData);
        if (response.success) {
          showSnackbar({
            message:
              " Success: Task created successfully and ready for tracking",
            severity: "success",
          });
          setTaskData({
            userId: id,
            project: "",
            description: "",
            priority: "",
          });
          await listAllData();
        }
      }
    } catch (error: any) {
      console.log(error);
      showSnackbar({
        message: error.response.data.message,
        severity: "info",
      });
    }
  };
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  const handleConfirmLock = async () => {
    try {
      typeof id === "number"
        ? await dispatch(setTaskLock({ date: selectedDate, id })).then(
            (result) =>
              setTaskLock.fulfilled.match(result)
                ? showSnackbar({
                    message:
                      " Success: All tasks have been locked successfully and are now read-only.",
                    severity: "success",
                  })
                : showSnackbar({
                    message: ` Failed to lock tasks: ${
                      result.payload || result.error.message
                    }`,
                    severity: "error",
                  })
          )
        : console.warn("Invalid or missing numeric ID");
    } catch (error) {
      console.error("Unexpected error:", error);
      showSnackbar({
        message: " An unexpected error occurred while locking tasks.",
        severity: "error",
      });
    } finally {
      setOpenDialog(false);
    }
  };
  const filterData = data.filter((task) => {
    const searchMatch = task.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return searchMatch;
  });
  const exportToCSV = () => {
    if (!filterData || filterData.length === 0) return;

    const headers = [
      "Project",
      "Task Description",
      "Priority",
      "Start Time",
      "End Time",
      "Total Spent",
      "Status",
    ];
    const rows = filterData.map((task) => {
      const start = task.start_time
        ? new Date(task.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Not Started";

      const end = task.end_time
        ? new Date(task.end_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Not Ended";

      const spent =
        task.start_time && task.end_time
          ? (() => {
              const diffMs =
                new Date(task.end_time).getTime() -
                new Date(task.start_time).getTime();
              if (isNaN(diffMs) || diffMs < 0) return "Invalid Time";
              const h = Math.floor(diffMs / 3600000);
              const m = Math.floor((diffMs % 3600000) / 60000);
              const s = Math.floor((diffMs % 60000) / 1000);
              return `${h}h ${m}m ${s}s`;
            })()
          : "";

      return [
        task.project || "",
        task.description || "",
        task.priority || "",
        start,
        end,
        spent || "0",
        task.status || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    console.log(csvContent);
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `tasks_${selectedDate.toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchData = async () => {
      await listAllData();
    };
    setLoading(true);
    fetchData();
    setLoading(false);
  }, [listAllData]);

  if (loading) {
 
    return <SpinLoader />;
  }
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row max-w-screen-2xl mx-auto">
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
              <h1 className="text-2xl sm:text-3xl font-semibold">Task List</h1>
              {isToday(selectedDate) && (
                <button
                  className="rx-loader-btn cursor-pointer text-white !rounded-[20px] px-6 py-2 text-sm font-inherit border-0 
                bg-gradient-to-br from-[#a855f7] to-[#d8b4fe] bg-[length:200%_auto] bg-left 
                transition-all duration-300 ease-in-out hover:bg-right"
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
                borderRadius: 6,
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

            <div className="flex flex-col sm:flex-row sm:!space-x-4 space-y-4 sm:space-y-0 mt-6 mb-6">
           
            </div>
            <p className="text-black text-xl font-bold">
              Tasks for {selectedDate.toDateString()}
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border-2 border-[#F0E8F2]">
            <table className="min-w-full text-sm border-spacing-0">
              <thead className="bg-gray-50">
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
              <tbody className="divide-y divide-gray-200">
                {data.length > 0 ? (
                  filterData.map((task, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4">{task.project}</td>
                      <td className="px-4 py-4 text-purple-600">
                        {task.description}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={task.priority}
                          className={`status-badge px-4 py-2 rounded-full text-xs font-medium ${
                            task.priority === "High"
                              ? "bg-[#FF7779] text-white"
                              : task.priority === "Medium"
                              ? "bg-[#FFC574] text-white"
                              : task.priority === "Low"
                              ? "bg-[#6ACD79] text-white"
                              : ""
                          }`}
                          disabled
                        >
                          <option value={task.priority}>{task.priority}</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <span>
                          {task.start_time
                            ? new Date(task.start_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Not Started"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span>
                          {task.end_time
                            ? new Date(task.end_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Not Ended"}
                        </span>
                      </td>

                      <td className="px-2 py-4">
                        <span>
                          {task.start_time && task.end_time
                            ? (() => {
                                const start = new Date(task.start_time);
                                const end = new Date(task.end_time);

                                if (
                                  isNaN(start.getTime()) ||
                                  isNaN(end.getTime())
                                )
                                  return "Invalid Time";

                                const diffMs = end.getTime() - start.getTime();
                                if (diffMs < 0) return "Invalid Time";

                                const hours = Math.floor(
                                  diffMs / (1000 * 60 * 60)
                                );
                                const minutes = Math.floor(
                                  (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                                );
                                const seconds = Math.floor(
                                  (diffMs % (1000 * 60)) / 1000
                                );

                                return `${hours}h ${minutes}m ${seconds}s`;
                              })()
                            : ""}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={task.status}
                          className={`status-badge ${
                            task.status === "Completed"
                              ? "bg-[#2BA912] text-white"
                              : task.status === "In Progress"
                              ? "bg-[#3A96FF] text-white"
                              : task.status === "yet to start"
                              ? "bg-[#FFA041] text-white"
                              : ""
                          }`}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value)
                          }
                        >
                          <option value="yet to start">{task.status}</option>
                          {task.status === "yet to start" && (
                            <option value="In Progress">In Progress</option>
                          )}
                          {task.status === "In Progress" && (
                            <option value="Completed">Completed</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      No tasks found for the selected date
                    </td>
                  </tr>
                )}
                {isToday(selectedDate) && !isFromParams && (
                  <tr className="animate-rowEnter !w-full transition-all duration-500 ease-in-out bg-[#EFD1FA]/90 backdrop-blur-lg rounded-xl border-t border-purple-300 group">
                    <td className="px-4 py-4 !min-w-[180px]">
                      <select
                        name="project"
                        value={taskData.project}
                        onChange={handleChange}
                        className={`elegant-input w-full rounded-md border  py-2 ${
                          fieldErrors.project
                            ? "!border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Project</option>

                        <option>{user.projects}</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        name="description"
                        value={taskData.description}
                        placeholder="Enter task description"
                        onChange={handleChange}
                        className={`elegant-input w-full rounded-md border px-3 py-2 ${
                          fieldErrors.description
                            ? "!border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-4 !min-w-[180px]">
                      <select
                        name="priority"
                        value={taskData.priority}
                        onChange={handleChange}
                        className={`elegant-input w-full rounded-md border px-3 py-2 ${
                          fieldErrors.priority
                            ? "!border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </td>
                    <td className=" py-4"></td>
                    <td className=" py-4"></td>
                    <td className=" py-4 text-sm text-gray-500"></td>

                    <td className="px-4 py-4">
                      <select
                        className="status-badge px-3 py-2 rounded-full text-xs font-medium bg-[#FFA041] text-gray-700"
                        disabled
                      >
                        <option>Yet to start</option>
                      </select>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isToday(selectedDate) && (
            <div className="flex flex-row space-x-4  sm:!flex-row  justify-end items-center space-y-2 sm:space-y-0 sm:!space-x-4 mt-4">
              <button
                className="rx-loader-btn cursor-pointer text-black font-medium !rounded-[20px] px-6 py-2 text-sm font-inherit border-0 transition-all duration-300 ease-in-out"
                style={{ backgroundColor: "#F0E8F2" }}
                onClick={exportToCSV}
              >
                Export to CSV
              </button>
              {!isLocked &&
                data.length > 0 &&
                data[0].isLocked === false &&
                !isFromParams && (
                  <>
                    <button
                      className="rx-loader-btn cursor-pointer text-white !rounded-[20px] px-6 py-2 text-sm font-inherit border-0 
                              bg-gradient-to-br from-[#a855f7] to-[#d8b4fe] bg-[length:200%_auto] bg-left 
                              transition-all duration-300 ease-in-out hover:bg-right"
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
            ©2025 RhythmRx Effort Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskList;
