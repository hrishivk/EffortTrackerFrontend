import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { motion } from "framer-motion";

import TableList from "../../../../shared/components/Table/Table";
import GanttChart from "../../../../shared/components/GanttChart/GanttChart";
import { fetchTasksByProject } from "../../../../core/actions/action";
import {
  fetchAllExistProjects,
  updateProjectStatus,
  fetchProjectStats,
} from "../../../../core/actions/spAction";
import { getProjectColumns } from "./domainProjectColumns";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { exportProjectReport } from "../../../../shared/utils/exportProjectReport";
import { exportTaskReport } from "../../../../shared/utils/exportTaskReport";

import StatCard from "./StatCard";
import ProjectDetailsView from "./ProjectDetailsView";
import ProjectExpandedRow from "./ProjectExpandedRow";
import { allTabs, PROJECT_STATUS_OPTIONS } from "./constants";
import type { DomainTab, ProjectRow, PhaseItem, CriticalUpdate } from "../../types";

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
  const [search, _setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; projectId: number | null; projectName: string; current: string }>({
    open: false, projectId: null, projectName: "", current: "",
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [stats, setStats] = useState<{
    projects: { total: number; active: number; on_hold: number; paused: number; completed: number };
    activeResources: number;
    totalTasks: number;
    completedTasks: number;
  } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProjectStats()
      .then((res) => setStats(res?.data || null))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async (page?: number) => {
    try {
      const pg = page ?? currentPage;
      const response = await fetchAllExistProjects(debouncedSearch || undefined, { page: pg, limit: itemsPerPage });
      if (response?.data) {
        const list = Array.isArray(response.data) ? response.data : response.data.projects || response.data;
        const mapped: ProjectRow[] = list.map((p: any) => ({
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
        setRawProjects(Array.isArray(response.data) ? response.data : list);
        if (response.totalPages) setTotalPages(response.totalPages);
        if (response.currentPage) setCurrentPage(response.currentPage);
      }
    } catch (error) {
      console.log(error);
    }
  }, [debouncedSearch, currentPage]);

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


  // Memoize Gantt chart props to prevent re-renders
  const ganttProjectsData = useMemo(() =>
    rawProjects.map((p: any) => ({
      id: p.id,
      name: p.name || "",
      start_date: p.start_date || p.startDate,
      end_date: p.end_date || p.dueDate,
      status: p.status || "active",
      progress: p.progress ?? 0,
    })),
    [rawProjects],
  );

  const handleGanttProjectClick = useCallback((_projectName: string, projectId: string | number) => {
    setSelectedProjectId(projectId);
  }, []);

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
    <motion.div
      className="container py-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >

      <div className="relative flex gap-6 mt-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative px-2 pb-3 text-sm font-semibold transition-colors duration-200"
              style={{ color: isActive ? "var(--text-primary)" : "var(--text-faint)" }}
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
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "var(--text-primary)" }}>
            {isAM
              ? activeTab === "overview"
                ? "Executive Project List"
                : "All Completed Projects Timeline"
              : "Domains & Projects"}
          </h2>
           <p className="mt-2 mb-0" style={{ fontSize: "0.90rem", color: "var(--text-muted)" }}>
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
              <button
                className="btn text-white"
                style={{ backgroundColor: "#7c3aed", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "6px 16px" }}
                onClick={async () => {
                  if (selectedProjectId) {
                    const proj = rawProjects.find((p: any) => String(p.id) === String(selectedProjectId));
                    const projName = proj?.name || "Project";
                    try {
                      const allTaskRes = await fetchTasksByProject(projName, { page: 1, limit: 1000 });
                      const allTasks = allTaskRes?.data || [];
                      exportTaskReport({ tasks: allTasks, projectName: projName });
                    } catch {
                      alert("Failed to fetch tasks for export.");
                    }
                  } else {
                    exportProjectReport({ rawProjects });
                  }
                }}
              >
                {selectedProjectId ? "Export Task Report" : "Export Report"}
              </button>
            </>
          )}
        </div>
      </div>

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

      {activeTab === "Gantt chart" && !selectedProjectId && (() => {
        return (
          <div className="mb-4">
            <GanttChart
              projects={ganttProjectsData}
              onProjectClick={handleGanttProjectClick}
            />
          </div>
        );
      })()}

      {activeTab === "Gantt chart" && selectedProjectId && (() => {
        const selectedProject = rawProjects.find((p: any) => String(p.id) === String(selectedProjectId));
        if (!selectedProject) return null;
        return (
          <ProjectDetailsView
            project={selectedProject}
            allProjects={rawProjects}
            onBack={() => setSelectedProjectId(null)}
          />
        );
      })()}

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
            pagination={{
              currentPage,
              totalPages,
              onPageChange: (page: number) => {
                setCurrentPage(page);
                fetchData(page);
              },
            }}
            expandable={{
              renderExpandedRow: (row) => <ProjectExpandedRow row={row} onRefresh={() => fetchData(currentPage)} />,
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
          className="rounded-2xl p-4"
          style={{ flex: 1, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
        >
          <h3
            className="fw-bold mb-3"
            style={{ fontSize: "1rem", color: "var(--text-primary)" }}
          >
            PROJECT PHASE DISTRIBUTION
          </h3>
          <div className="d-flex flex-column gap-3">
            {phaseData.map((phase) => (
              <div key={phase.label}>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {phase.label}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}
                  >
                    {phase.count} Projects
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: "var(--border-light)",
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

        <div
          className="rounded-2xl p-4"
          style={{ flex: 1, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
        >
          <h3
            className="fw-bold mb-3"
            style={{ fontSize: "1rem", color: "var(--text-primary)" }}
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
                      style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}
                    >
                      {update.title}
                    </p>
                    <p
                      className="mb-0"
                      style={{ fontSize: 12, color: "var(--text-muted)" }}
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
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
            Update status for <strong style={{ color: "var(--text-primary)" }}>{statusDialog.projectName}</strong>
          </p>
          <div className="d-flex flex-column gap-2">
            {PROJECT_STATUS_OPTIONS.map((opt) => {
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
                    border: isSelected ? `2px solid ${opt.color}` : "1px solid var(--border-light)",
                    backgroundColor: isSelected ? opt.bg : "var(--bg-card)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: isSelected ? `5px solid ${opt.color}` : "2px solid var(--border-light)",
                      backgroundColor: isSelected ? "#fff" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{opt.desc}</div>
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
    </motion.div>
  );
};

export default DomainProject;
