import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";

import TableList from "../../shared/Table/Table";
import GanttChart from "../../shared/GhantChart/types/GhantChart";
import {
  fetchAllExistProjects,
  fetchAllUsers,
  fetchUsers,
  fetchProjectMembers,
  assignProjectMembers,
  removeProjectMembers,
  updateProjectStatus,
  fetchProjectStats,
} from "../../core/actions/spAction";
import { getProjectColumns } from "./domainProjectColumns";
import { useSnackbar } from "../../contexts/SnackbarContext";
import Dialoge from "../../presentation/Dialog/Dialog";
import type {
  DomainTab,
  TabItem,
  ProjectRow,
  ProjectMember,
  PhaseItem,
  CriticalUpdate,
} from "./types";
import type { formUserData } from "../../shared/User/types";


const allTabs: TabItem[] = [
  { key: "overview", label: "Overview" },
  { key: "Gantt chart", label: "Gantt chart" },
];


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

const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

// Phase data & critical updates are now computed from real projects inside the component


const StatCard = ({
  title,
  value,
  subtitle,
  progress,
  icon,
  accentColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
  icon: React.ReactNode;
  accentColor: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex-1">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide m-0">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-1 mb-0 leading-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-gray-400 mt-0.5 mb-0">{subtitle}</p>
        )}
        {progress !== undefined && (
          <div
            style={{
              width: 100,
              height: 6,
              borderRadius: 99,
              backgroundColor: "#e5e7eb",
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 99,
                background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              }}
            />
          </div>
        )}
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: accentColor + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
          fontSize: 16,
        }}
      >
        {icon}
      </div>
    </div>

  </div>
);

const isUserInProject = (user: formUserData, projectId: any): boolean => {
  const pid = String(projectId);
  if (!user.projects || !Array.isArray(user.projects)) return false;
  return user.projects.some((p) => String(p.id) === pid);
};

const ProjectExpandedRow = ({ row, onRefresh }: { row: ProjectRow; onRefresh?: () => void }) => {
  const { showSnackbar } = useSnackbar();
  const loggedInRole = useSelector((state: any) => state.user.user.role);
  const isSP = loggedInRole?.toUpperCase() === "SP";
  const [users, setUsers] = useState<formUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<formUserData | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (isSP) {
        const res = await fetchUsers({ role: "AM" });
        setUsers(res.users || []);
      } else {
        const res = await fetchAllUsers();
        const allUsers: formUserData[] = res.data || [];
        setUsers(allUsers.filter((u) => u.role === "USER" || u.role === "DEVLOPER"));
      }
    } catch {
      showSnackbar({ message: "Failed to load users", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, isSP]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const assignedMembers = users.filter((u) => isUserInProject(u, row.id));
  const availableMembers = users.filter((u) => !isUserInProject(u, row.id));

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    try {
      await removeProjectMembers(String(row.id), [String(removeTarget.id)]);
      showSnackbar({ message: `${removeTarget.fullName} removed`, severity: "success" });
      await loadUsers();
      onRefresh?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to remove member";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setRemoveTarget(null);
    }
  };

  const handleOpenAssign = () => {
    setAssignOpen(true);
    setSelectedUserIds([]);
    setUserSearch("");
  };

  const handleAssignSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    setAssignLoading(true);
    try {
      await assignProjectMembers(String(row.id), selectedUserIds);
      showSnackbar({ message: `${selectedUserIds.length} member(s) assigned`, severity: "success" });
      setAssignOpen(false);
      await loadUsers();
      onRefresh?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to assign members";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const filteredAvailable = availableMembers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-4">
        <CircularProgress size={24} sx={{ color: "#7c3aed" }} />
      </div>
    );
  }

  const isActive = (row.status || "").toLowerCase().replace(/\s+/g, "_") === "active";

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0" style={{ fontSize: 14, color: "#374151" }}>
          Team Members ({assignedMembers.length})
        </h6>
        {isActive ? (
          <button
            className="btn btn-sm text-white"
            style={{
              backgroundColor: "#7c3aed",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
            }}
            onClick={handleOpenAssign}
          >
            + Assign Members
          </button>
        ) : (
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
            Only active projects can assign members
          </span>
        )}
      </div>

      {assignedMembers.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          No members assigned to this project yet.
        </p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {assignedMembers.map((member) => (
            <div
              key={member.id}
              className="d-flex align-items-center justify-content-between p-2 rounded-3"
              style={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#7c3aed",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getInitials(member.fullName)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{member.fullName}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{member.role}</div>
                </div>
              </div>
              <button
                className="btn btn-sm"
                style={{
                  color: "#dc3545",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "2px 10px",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                }}
                onClick={() => setRemoveTarget(member)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialoge
        open={removeTarget !== null}
        data="remove"
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
      />

      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          {isSP ? "Assign Managers (AM)" : "Assign Members"} to {row.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            sx={{ mb: 2, mt: 1, ...selectSx }}
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
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {filteredAvailable.map((user) => {
              const uid = String(user.id);
              const isSelected = selectedUserIds.includes(uid);
              return (
                <div
                  key={uid}
                  className="d-flex align-items-center gap-2 p-2 rounded-2"
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#f5f3ff" : "transparent",
                  }}
                  onClick={() => toggleUserSelection(uid)}
                >
                  <Checkbox
                    checked={isSelected}
                    size="small"
                    sx={{ "&.Mui-checked": { color: "#7c3aed" } }}
                  />
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "#e5e7eb",
                      color: "#6b7280",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getInitials(user.fullName)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user.fullName}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{user.role}</div>
                  </div>
                </div>
              );
            })}
            {filteredAvailable.length === 0 && (
              <p className="text-center py-3" style={{ fontSize: 13, color: "#9ca3af" }}>
                No available users to assign.
              </p>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)} sx={{ color: "#6b7280", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignSubmit}
            disabled={selectedUserIds.length === 0 || assignLoading}
            variant="contained"
            sx={{
              backgroundColor: "#7c3aed",
              "&:hover": { backgroundColor: "#6d28d9" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {assignLoading ? "Assigning..." : `Assign (${selectedUserIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const DomainProject = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { role: urlRole } = useParams();
  const role = useSelector((state: any) => state.user.user.role);
  const isAM = role?.toUpperCase() === "AM";
  const currentRole = urlRole || (isAM ? "am" : "sp");
  const tabs = allTabs;
  const [activeTab, setActiveTab] = useState<DomainTab>("overview");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [rawProjects, setRawProjects] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; projectId: number | null; projectName: string; current: string }>({
    open: false, projectId: null, projectName: "", current: "",
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("2023");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stats, setStats] = useState<{
    projects: { total: number; active: number; on_hold: number; paused: number; completed: number };
    activeResources: number;
    totalTasks: number;
    completedTasks: number;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProjectStats()
      .then((res) => setStats(res?.data || null))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetchAllExistProjects(debouncedSearch || undefined);
      if (response?.data) {
        const mapped: ProjectRow[] = response.data.map((p: any) => ({
          id: p.id,
          name: p.name || "",
          dueDate: p.end_date || p.dueDate || "-",
          clientDepartment: p.client_department || p.clientDepartment || p.domain?.name || "-",
          status: (p.status || "ACTIVE").toUpperCase(),
          progress: p.progress ?? 0,
          teamAssigned: (p.teamAssigned || []).map((u: any) =>
            typeof u === "string"
              ? { name: u, avatar: "" }
              : { name: u.fullName || u.name || "", avatar: u.avatar || "" }
          ),
        }));
        setProjects(mapped);
        setRawProjects(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute phase distribution from real projects
  const totalProjectCount = projects.length || 1;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "_");
  const activeCount = projects.filter((p) => norm(p.status) === "active").length;
  const onHoldCount = projects.filter((p) => norm(p.status) === "on_hold").length;
  const pausedCount = projects.filter((p) => norm(p.status) === "paused").length;
  const completedCount = projects.filter((p) => norm(p.status) === "completed").length;

  const phaseData: PhaseItem[] = [
    { label: "Active", count: activeCount, color: "#7c3aed", max: totalProjectCount },
    { label: "On Hold", count: onHoldCount, color: "#ea580c", max: totalProjectCount },
    { label: "Paused", count: pausedCount, color: "#d97706", max: totalProjectCount },
    { label: "Completed", count: completedCount, color: "#16a34a", max: totalProjectCount },
  ];

  // Compute critical updates from real projects
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const criticalUpdates: CriticalUpdate[] = [
    ...projects
      .filter((p) => {
        if (p.status === "COMPLETED") return false;
        const end = p.dueDate && p.dueDate !== "-" ? new Date(p.dueDate) : null;
        return end && end < now;
      })
      .map((p) => ({
        title: p.name,
        description: `Overdue — was due ${p.dueDate}. Current progress: ${p.progress}%`,
        type: "warning" as const,
      })),
    ...projects
      .filter((p) => p.status === "COMPLETED" || p.progress >= 100)
      .map((p) => ({
        title: p.name,
        description: `Completed successfully. Final progress: ${p.progress}%`,
        type: "success" as const,
      })),
  ];

  return (
    <div className="container py-4">

      <div className="relative flex gap-6 mt-2 border-b border-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-2 pb-3 text-sm font-semibold transition-colors duration-200 ${
                isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="domain-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #AD21DB, #7C3AED)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="d-flex justify-content-between align-items-start mt-4 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem" }}>
            {isAM
              ? activeTab === "overview"
                ? "Executive Project List"
                : "All Completed Projects Timeline"
              : "Domains & Projects"}
          </h2>
           <p className="text-muted mt-2 mb-0"  style={{ fontSize: "0.90rem" }}>
            {isAM
              ? activeTab === "overview"
                ? "High-level overview of all active initiatives and project health."
                : "Historical view of delivered initiatives and retrospective data."
              : "Manage all domains and their associated projects"}
          </p>
        </div>


        <div className="d-flex align-items-center gap-2">
          {activeTab === "overview" ? (
            <>
              <TextField
                size="small"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  width: 200,
                  ...selectSx,
                }}
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
                className="btn"
                style={{
                  borderRadius: 8,
                  padding: "6px 10px",
                  border: "1px solid #e5e7eb",
                }}
                title="Filter"
              >
                <span style={{ fontSize: 16 }}>⫧</span>
              </button>
              {isAM && (
                <>
                  <button
                    className="btn text-white"
                    style={{ backgroundColor: "#7c3aed", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                    onClick={() => navigate(`/${currentRole}/create-domain`)}
                  >
                    + Create Domain
                  </button>
                  <button
                    className="btn text-white"
                    style={{ backgroundColor: "#7c3aed", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                    onClick={() => navigate(`/${currentRole}/create-project`)}
                  >
                    + Create Projects
                  </button>
                </>
              )}
              {!isAM && (
                <>
                  <button
                    className="btn text-white"
                    style={{ backgroundColor: "#4f46e5", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                    onClick={() => navigate(`/${currentRole}/create-domain`)}
                  >
                    + Add Domain
                  </button>
                  <button
                    className="btn text-white"
                    style={{ backgroundColor: "#9333ea", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                    onClick={() => navigate(`/${currentRole}/create-project`)}
                  >
                    + Add Project
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <FormControl size="small" sx={{ minWidth: 140, ...selectSx }}>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  MenuProps={menuProps}
                  renderValue={(val) => `Date: ${val}`}
                >
                  <MenuItem value="2023">2023</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                  <MenuItem value="2025">2025</MenuItem>
                  <MenuItem value="2026">2026</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150, ...selectSx }}>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  MenuProps={menuProps}
                  renderValue={(val) => `Category: ${val}`}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Development">Development</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                </Select>
              </FormControl>
              <button
                className="btn text-white"
                style={{ backgroundColor: "#7c3aed", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
              >
                Export Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stat Cards — Overview only */}
      {activeTab === "overview" && (
        <div className="scrollbar-hide" style={{ display: "flex", gap: 16, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          <div style={{ minWidth: 200, flex: "1 0 auto" }}>
            <StatCard
              title="Active Projects"
              value={stats?.projects.active ?? 0}
              subtitle={`${stats?.projects.total ?? 0} total projects`}
              accentColor="#7c3aed"
              icon={<span>&#9989;</span>}
            />
          </div>
          <div style={{ minWidth: 200, flex: "1 0 auto" }}>
            <StatCard
              title="On Hold"
              value={stats?.projects.on_hold ?? 0}
              subtitle="Awaiting feedback"
              accentColor="#f59e0b"
              icon={<span>&#9208;&#65039;</span>}
            />
          </div>
          <div style={{ minWidth: 200, flex: "1 0 auto" }}>
            <StatCard
              title="Total Completion"
              value={stats && stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : "0%"}
              progress={stats && stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}
              accentColor="#10b981"
              icon={<span>&#128202;</span>}
            />
          </div>
          <div style={{ minWidth: 200, flex: "1 0 auto" }}>
            <StatCard
              title="Active Resources"
              value={stats?.activeResources ?? 0}
              subtitle="Allocated across teams"
              accentColor="#6366f1"
              icon={<span>&#128101;</span>}
            />
          </div>
        </div>
      )}

      {activeTab === "Gantt chart" && (
        <div className="mb-4">
          <GanttChart
            projects={rawProjects.map((p: any) => ({
              id: p.id,
              name: p.name || "",
              start_date: p.start_date || p.startDate,
              end_date: p.end_date || p.dueDate,
              status: p.status || "active",
              progress: p.progress ?? 0,
            }))}
            onProjectClick={(projectName) => {
              navigate(`/${currentRole}/dashboard?viewProject=${encodeURIComponent(projectName)}&tab=gantt`);
            }}
          />
        </div>
      )}

      {activeTab === "overview" && (() => {
        const handleManageMembers = (projectId: number) => {
          const idx = projects.findIndex((p) => p.id === projectId);
          setExpandedIndex(expandedIndex === idx ? null : idx);
        };
        const handleStatusClick = (projectId: number, currentStatus: string) => {
          const proj = projects.find((p) => p.id === projectId);
          setStatusDialog({
            open: true,
            projectId,
            projectName: proj?.name || "",
            current: currentStatus.toLowerCase().replace(/\s+/g, "_"),
          });
        };
        return (
          <TableList
            columns={getProjectColumns(handleManageMembers, handleStatusClick)}
            data={projects}
            expandable={{
              renderExpandedRow: (row) => <ProjectExpandedRow row={row} onRefresh={fetchData} />,
              accordion: true,
              expandedIndex,
              onExpandChange: setExpandedIndex,
            }}
          />
        );
      })()}

      {activeTab === "overview" && (
      <div className="d-flex flex-column flex-lg-row gap-4 mt-4">
   
        <div
          className="bg-white rounded-2xl border border-gray-200 p-4"
          style={{ flex: 1 }}
        >
          <h3
            className="fw-bold text-gray-800 mb-3"
            style={{ fontSize: "1rem" }}
          >
            PROJECT PHASE DISTRIBUTION
          </h3>
          <div className="d-flex flex-column gap-3">
            {phaseData.map((phase) => (
              <div key={phase.label}>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    {phase.label}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
                  >
                    {phase.count} Projects
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(phase.count / phase.max) * 100}%`,
                      height: "100%",
                      borderRadius: 99,
                      backgroundColor: phase.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Project Updates */}
        <div
          className="bg-white rounded-2xl border border-gray-200 p-4"
          style={{ flex: 1 }}
        >
          <h3
            className="fw-bold text-gray-800 mb-3"
            style={{ fontSize: "1rem" }}
          >
            CRITICAL PROJECT UPDATES
          </h3>
          <div className="d-flex flex-column gap-3">
            {criticalUpdates.length > 0 ? (
              criticalUpdates.map((update, i) => (
                <div
                  key={i}
                  className="d-flex align-items-start gap-3 p-3 rounded-3"
                  style={{
                    backgroundColor:
                      update.type === "warning" ? "#fef2f2" : "#f0fdf4",
                    border: `1px solid ${update.type === "warning" ? "#fecaca" : "#bbf7d0"}`,
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {update.type === "warning" ? "⚠️" : "✅"}
                  </span>
                  <div>
                    <p
                      className="mb-0"
                      style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}
                    >
                      {update.title}
                    </p>
                    <p
                      className="mb-0"
                      style={{ fontSize: 12, color: "#6b7280" }}
                    >
                      {update.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
                No critical updates at the moment.
              </p>
            )}
          </div>
        </div>
      </div>
      )}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, projectId: null, projectName: "", current: "" })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "visible" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
          Change Project Status
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
            Update status for <strong style={{ color: "#111827" }}>{statusDialog.projectName}</strong>
          </p>
          <div className="d-flex flex-column gap-2">
            {[
              { value: "active", label: "Active", desc: "Project is in progress", color: "#059669", bg: "#ecfdf5" },
              { value: "on_hold", label: "On Hold", desc: "Temporarily paused, awaiting input", color: "#ea580c", bg: "#fff7ed" },
              { value: "paused", label: "Paused", desc: "Work stopped, needs review", color: "#d97706", bg: "#fef3c7" },
              { value: "completed", label: "Completed", desc: "All tasks finished", color: "#16a34a", bg: "#f0fdf4" },
            ].map((opt) => {
              const isSelected = opt.value === statusDialog.current;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (!isSelected) setStatusDialog((prev) => ({ ...prev, current: opt.value }));
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${opt.color}` : "1px solid #e5e7eb",
                    backgroundColor: isSelected ? opt.bg : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: isSelected ? `5px solid ${opt.color}` : "2px solid #d1d5db",
                      backgroundColor: isSelected ? "#fff" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{opt.desc}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: opt.color,
                      backgroundColor: opt.bg,
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {opt.label.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setStatusDialog({ open: false, projectId: null, projectName: "", current: "" })}
            sx={{ color: "#6b7280", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            disabled={statusLoading}
            onClick={async () => {
              if (!statusDialog.projectId) return;
              setStatusLoading(true);
              try {
                await updateProjectStatus(String(statusDialog.projectId), statusDialog.current);
                showSnackbar({ message: `Status updated to ${statusDialog.current.replace("_", " ").toUpperCase()}`, severity: "success" });
                setStatusDialog({ open: false, projectId: null, projectName: "", current: "" });
                fetchData();
                fetchProjectStats().then((res) => setStats(res?.data || null)).catch(() => {});
              } catch (error: any) {
                const msg = error?.response?.data?.message || "Failed to update status";
                showSnackbar({ message: msg, severity: "error" });
              } finally {
                setStatusLoading(false);
              }
            }}
            variant="contained"
            sx={{
              backgroundColor: "#7c3aed",
              "&:hover": { backgroundColor: "#6d28d9" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {statusLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DomainProject;
