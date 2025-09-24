import  { useCallback, useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "@coreui/coreui/dist/css/coreui.min.css";
import DashboardRole from "./views/DashboardRole";
import { useAppSelector } from "../../store/configureStore";
import type { RoleTitles } from "./types";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import {
  fetchAllUsers,
  fetchExistProjects,
  fetfchTaskCount
} from "../../core/actions/spAction";
import type { project } from "../../shared/Project/types";
import { fetchAmUsers } from "../../core/actions/AmAction";
import type { formUserData } from "../../shared/Table/types";
ChartJS.register(ArcElement, Tooltip, Legend);
const renderCustomLabelPlugin = {
  id: "renderCustomLabelPlugin",
  afterDraw(chart: any) {
    const { ctx, data } = chart;
    const meta = chart.getDatasetMeta(0);
    const total = data.datasets[0].data.reduce(
      (a: number, b: number) => a + b,
      0
    );

    meta.data.forEach((element: any, index: number) => {
      const dataset = data.datasets[0];
      const value = dataset.data[index];
      const percent = value / total;
      const { x, y } = element.tooltipPosition();

      const labelMap: { [key: string]: string } = {
        Completed: "Completed",
        "In Progress": "In Progress",
        "Yet to Start": "Yet to Start",
      };
      const labelName = data.labels[index] || "";
      ctx.save();
      ctx.fillStyle = "black";
      ctx.font = "600 13px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(labelMap[labelName] || labelName, x, y - 10);

      ctx.fillText(`${(percent * 100).toFixed(0)}%`, x, y + 10);
      ctx.restore();
    });
  },
};
const UserDashboard = () => {
  const [project, setProject] = useState<project[]>([]);
  const [data, setData] = useState<formUserData[]>([]);
  const [dataCount, setCount] = useState<{ status: string; count: string }[]>(
    []
  );
  const [dateData, setDateData] = useState<string>("All Dates");
  const { user } = useAppSelector((state) => state.user);
  const role = user.role;
  const id = user?.id;

  const listData = useCallback(async () => {
    try {
      const projectResponse = await fetchExistProjects();
      setProject(projectResponse.data);
      const response =
        role == "SP"
          ? await fetchAllUsers()
          : role == "AM"
          ? await fetchAmUsers(id as string)
          : null;
      if (response) {
        setData(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, [dateData]);   
const listCount = useCallback(async () => {
  try {
    const taskCount = await fetfchTaskCount(dateData, role, id ? Number(id) : 0);
    setCount(taskCount.data);
  } catch (error) {
    console.error("Error fetching task count", error);
  }
}, [dateData, role, id]);

  const taskData = {
    total: dataCount.reduce((sum, item) => sum + Number(item.count || 0), 0),
    inProgress: Number(dataCount[2]?.count),
    completed: Number(dataCount[1]?.count),
    YettoStart: Number(dataCount[0]?.count),
    hoursThisWeek: 54,
  };
  const doughnutData = {
    labels: ["Completed", "In Progress", "Yet to Start"],
    datasets: [
      {
        data: [taskData.completed, taskData.inProgress, 40],
        backgroundColor: ["#AFF4C6", "#7AC7FF", "#FFC7C2"],
        borderWidth: 1,
      },
    ],
  };
  const redCenterCirclePlugin = {
    id: "redCenterCircle",
    beforeDraw(chart: any) {
      const { ctx, chartArea } = chart;
      const { left, right, top, bottom } = chartArea;
      const width = right - left;
      const height = bottom - top;
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const radius = Math.min(width, height) / 6;


      const total = dataCount.reduce(
        (sum, item) => sum + Number(item.count || 0),
        0
      );

      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = "#AD21DB";
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Total Tasks", centerX, centerY);
      ctx.fillText(total.toString(), centerX, centerY + 20);
      ctx.restore();
    },
  };

  const roleTitles: RoleTitles = {
    USER: "User Dashboard",
    DEVLOPER: "User Dashboard",
    SP: "Admin Dashboard",
    AM: "Manager Dashboard",
  };
  const dashboardTitle = roleTitles[user.role] || " Dashboard";
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "34%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 50,
          boxHeight: 15,
          padding: 1,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
  };
  useEffect(() => {
    listData();
    listCount();
  }, [dateData, listCount]);
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 mt-8">
          <h1 className="!text-4xl !font-bold text-gray-900 mt-6 mb-2">
            {dashboardTitle}
          </h1>

          <p className="text-[#7D6387] !text-lg mb-8">
            Manage your tasks and track the open
          </p>
          <h2 className="!text-2xl !mt-8 font-semibold text-gray-900">
            Personal Summary
          </h2>
          <div className="flex flex-col !space-x-4 sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-6 mb-6 relative">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box sx={{ minWidth: 200 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="project-select-label">Project</InputLabel>
                  <Select
                    labelId="project-select-label"
                    id="project-select"
                    label="Project Filter"
                    sx={{
                      borderRadius: 3,
                      backgroundColor: "#F9F9FB",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#D1D5DB",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#8B5CF6",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#8B5CF6",
                        boxShadow: "0 0 5px #8B5CF6",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 2,
                          boxShadow: "0px 4px 20px rgba(139, 92, 246, 0.3)",
                        },
                      },
                    }}
                  >
                    {project.map((item, index) => (
                      <MenuItem key={index} value={item.name}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {(user.role === "AM" || user.role === "SP") && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Box sx={{ minWidth: 200 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="project-select-label">User</InputLabel>
                      <Select
                        labelId="project-select-label"
                        id="project-select"
                        label="Project Filter"
                        sx={{
                          borderRadius: 3,
                          backgroundColor: "#F9F9FB",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#D1D5DB",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#8B5CF6",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#8B5CF6",
                            boxShadow: "0 0 5px #8B5CF6",
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              boxShadow: "0px 4px 20px rgba(139, 92, 246, 0.3)",
                            },
                          },
                        }}
                      >
                        {data.map((item, index) => (
                          <MenuItem key={index} value={item.fullName}>
                            {item.fullName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ minWidth: 200 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="role-select-label">Task</InputLabel>
                      <Select
                        labelId="role-select-label"
                        id="role-select"
                        label="Role Filter"
                        sx={{
                          borderRadius: 3,
                          backgroundColor: "#F9F9FB",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#D1D5DB",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#8B5CF6",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#8B5CF6",
                            boxShadow: "0 0 5px #8B5CF6",
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              boxShadow: "0px 4px 20px rgba(139, 92, 246, 0.3)",
                            },
                          },
                        }}
                      >
                        <MenuItem value="">All Roles</MenuItem>
                        <MenuItem></MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              )}

              {/* Role Filter */}
              <Box sx={{ minWidth: 200 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="role-select-label">Dates</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role-select"
                    label="Role Filter"
                    onChange={(e)=> setDateData(e.target.value as string)}
                    sx={{
                      borderRadius: 3,
                      backgroundColor: "#F9F9FB",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#D1D5DB",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#8B5CF6",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#8B5CF6",
                        boxShadow: "0 0 5px #8B5CF6",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 2,
                          boxShadow: "0px 4px 20px rgba(139, 92, 246, 0.3)",
                        },
                      },
                    }}
                  >
                    {[
                      { value: "All Dates", label: "All Dates" },
                      { value: "thisWeek", label: "This Week" },
                      { value: "thisMonth", label: "This Month" },
                      { value: "thisYear", label: "This Year" },
                    ].map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </div>
        </div>
        <div className="p-6 mb-8">
          <div className="flex justify-center">
            <div className="p-6">
              <div className="mb-8">
                <div className="w-[450px] h-[480px] flex flex-col">
                  <div className="flex-1 pt-6">
                    <Doughnut
                      key={JSON.stringify(dataCount)}
                      data={doughnutData}
                      options={{
                        ...doughnutOptions,
                        plugins: {
                          ...doughnutOptions.plugins,
                          legend: { display: false },
                        },
                      }}
                      plugins={[redCenterCirclePlugin, renderCustomLabelPlugin]}
                    />
                  </div>
                  <div className="flex justify-center gap-6 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#AFF4C6]"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#7AC7FF]"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#FFC7C2]"></div>
                      <span className="text-sm">Yet to Start</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {dataCount.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Tasks</div>
                <div className="text-2xl font-bold text-gray-800">
                  {/* {dataCount.reduce(
                    (sum, item) => sum + Number(item.count || 0),
                    0
                  )} */}0
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-4">
                <div className="text-sm text-gray-600">Yet to start</div>
                <div className="text-2xl font-bold text-gray-800">
                  {/* {dataCount[1]?.count || 0} */}0
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-4">
                <div className="text-sm text-gray-600">In progress</div>
                <div className="text-2xl font-bold text-gray-800">
                  {/* {dataCount[2]?.count || 0} */}0
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-4">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-2xl font-bold text-gray-800">
                  {/* {dataCount[3]?.count || 0} */}0
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="text-2xl font-bold text-gray-800">0</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400"></div>
          )}
        </div>
        <DashboardRole role={user.role!} Dates={dateData} />
      </div>
    </div>
  );
};

export default UserDashboard;
