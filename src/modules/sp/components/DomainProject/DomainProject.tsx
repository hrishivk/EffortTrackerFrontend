import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import TableList from "../../../../shared/components/Table/Table";
import GanttChart from "../../../../shared/components/GanttChart/GanttChart";
import {
  fetchAllExistProjects,
  fetchProject,
  fetchProjectStats,
  fetchExistDomains,
  deleteDomain,
} from "../../../../core/actions/spAction";
import { getProjectColumns } from "./domainProjectColumns";
import { getDomainColumns } from "./domainColumns";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import Dialoge from "../../../../presentation/Dialog";
import SpinLoader from "../../../../presentation/SpinLoader";

import ProjectDetailsView from "./ProjectDetailsView";
import ProjectExpandedRow from "./ProjectExpandedRow";
import EditProjectModal from "./EditProjectModal";
import DomainTabs from "./DomainProjectParts/DomainTabs";
import DomainHeader from "./DomainProjectParts/DomainHeader";
import StatCardsRow from "./DomainProjectParts/StatCardsRow";
import ListViewToggle, { type ListView } from "./DomainProjectParts/ListViewToggle";
import OverviewInsights from "./DomainProjectParts/OverviewInsights";
import ProjectStatusDialog, {
  CLOSED_STATUS_DIALOG,
  type StatusDialogState,
} from "./DomainProjectParts/ProjectStatusDialog";
import {
  buildCriticalUpdates,
  buildPhaseData,
  mapGanttProject,
  mapProjectRow,
  type ProjectStats,
} from "./DomainProjectParts/projectMappers";
import type { DomainTab, ProjectRow } from "../../types";
import type { Domain } from "../../../../shared/types/Domain";

const itemsPerPage = 10;

const DomainProject = () => {
  const { showSnackbar } = useSnackbar();
  const { role: urlRole } = useParams();
  const role = useSelector((state: any) => state.user.user.role);
  const isAM = role?.toUpperCase() === "AM";
  const canManage = ["SP", "AM"].includes(String(role ?? "").toUpperCase());
  const currentRole = urlRole || (isAM ? "am" : "sp");
  const [activeTab, setActiveTab] = useState<DomainTab>("overview");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [rawProjects, setRawProjects] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [search, _setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>(CLOSED_STATUS_DIALOG);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [deleteDomainId, setDeleteDomainId] = useState<number | null>(null);
  const [listView, setListView] = useState<ListView>("projects");
  const [editProject, setEditProject] = useState<any | null>(null);
  const editProjectLoading = useRef(false);
  const [domainPage, setDomainPage] = useState(1);
  const [domainTotalPages, setDomainTotalPages] = useState(1);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [domainsLoading, setDomainsLoading] = useState(true);

  const refreshStats = () =>
    fetchProjectStats()
      .then((res) => setStats(res?.data || null))
      .catch(() => {});

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    refreshStats();
  }, []);

  const fetchDomains = useCallback(async (page: number) => {
    setDomainsLoading(true);
    try {
      const response = await fetchExistDomains(undefined, { page, limit: itemsPerPage });
      const list = response?.data;
      setDomains(Array.isArray(list) ? list : []);
      setDomainTotalPages(response?.totalPages ? Number(response.totalPages) : 1);
    } catch (error) {
      console.log(error);
    } finally {
      setDomainsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains(domainPage);
  }, [fetchDomains, domainPage]);

  const fetchData = useCallback(async (page?: number) => {
    setProjectsLoading(true);
    try {
      const pg = page ?? currentPage;
      const response = await fetchAllExistProjects(debouncedSearch || undefined, { page: pg, limit: itemsPerPage });
      if (response?.data) {
        const list = Array.isArray(response.data) ? response.data : response.data.projects || response.data;
        setProjects(list.map(mapProjectRow));
        setRawProjects(Array.isArray(response.data) ? response.data : list);
        if (response.totalPages) setTotalPages(response.totalPages);
        if (response.currentPage) setCurrentPage(response.currentPage);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setProjectsLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const confirmDeleteDomain = async () => {
    if (!deleteDomainId) return;
    try {
      await deleteDomain(String(deleteDomainId));
      showSnackbar({ message: "Department deleted successfully", severity: "success" });
      await Promise.all([
        fetchDomains(domainPage),
        fetchData(currentPage),
        refreshStats(),
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to delete department.";
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setDeleteDomainId(null);
    }
  };

  const handleManageMembers = (projectId: number) => {
    const idx = projects.findIndex((p) => p.id === projectId);
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleEditProject = async (projectId: number) => {
    if (editProjectLoading.current) return;
    editProjectLoading.current = true;
    try {
      setEditProject(await fetchProject(projectId));
    } catch (error: any) {
      showSnackbar({
        message:
          error?.response?.data?.message || "Could not open that project",
        severity: "error",
      });
    } finally {
      editProjectLoading.current = false;
    }
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

  const phaseData = buildPhaseData(projects);
  const criticalUpdates = buildCriticalUpdates(projects);

  const ganttProjectsData = useMemo(() => rawProjects.map(mapGanttProject), [rawProjects]);

  const handleGanttProjectClick = useCallback((_projectName: string, projectId: string | number) => {
    setSelectedProjectId(projectId);
  }, []);

  const selectedProject = selectedProjectId
    ? rawProjects.find((p: any) => String(p.id) === String(selectedProjectId))
    : null;
  const isOverview = activeTab === "overview";
  const isGantt = activeTab === "Gantt chart";

  return (
    <motion.div
      className="container py-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <SpinLoader
        isLoading={listView === "domains" ? domainsLoading : projectsLoading}
      />

      <DomainTabs activeTab={activeTab} onChange={setActiveTab} />

      <DomainHeader
        activeTab={activeTab}
        isAM={isAM}
        canManage={canManage}
        currentRole={currentRole}
        selectedProjectId={selectedProjectId}
        rawProjects={rawProjects}
      />

      {isOverview && <StatCardsRow stats={stats} />}

      {isGantt && !selectedProjectId && (
        <div className="mb-4">
          <GanttChart
            projects={ganttProjectsData}
            onProjectClick={handleGanttProjectClick}
          />
        </div>
      )}

      {isGantt && selectedProject && (
        <ProjectDetailsView
          project={selectedProject}
          allProjects={rawProjects}
          onBack={() => setSelectedProjectId(null)}
        />
      )}

      {isOverview && canManage && (
        <ListViewToggle listView={listView} onChange={setListView} />
      )}

      {isOverview && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={listView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {listView === "projects" ? (
              <TableList
                columns={getProjectColumns(
                  handleManageMembers,
                  handleStatusClick,
                  handleEditProject,
                  canManage,
                )}
                data={projects}
                pagination={{
                  currentPage,
                  totalPages,
                  onPageChange: (page: number) => {
                    setCurrentPage(page);
                    fetchData(page);
                  },
                }}
                expandable={
                  canManage
                    ? {
                        renderExpandedRow: (row) => <ProjectExpandedRow row={row} onRefresh={() => fetchData(currentPage)} />,
                        accordion: true,
                        expandedIndex,
                        onExpandChange: setExpandedIndex,
                      }
                    : undefined
                }
              />
            ) : (
              <TableList
                columns={getDomainColumns((id) => setDeleteDomainId(id), canManage)}
                data={domains}
                pagination={{
                  currentPage: domainPage,
                  totalPages: domainTotalPages,
                  onPageChange: setDomainPage,
                }}
                emptyMessage="No departments found"
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {isOverview && (
        <OverviewInsights phaseData={phaseData} criticalUpdates={criticalUpdates} />
      )}

      <ProjectStatusDialog
        state={statusDialog}
        onStateChange={setStatusDialog}
        onUpdated={() => {
          fetchData();
          refreshStats();
        }}
      />
      <Dialoge
        open={deleteDomainId !== null}
        data="delete"
        onClose={() => setDeleteDomainId(null)}
        onConfirm={confirmDeleteDomain}
      />
      <EditProjectModal
        open={editProject !== null}
        project={editProject}
        onClose={() => setEditProject(null)}
        onSaved={() => {
          fetchData(currentPage);
          refreshStats();
        }}
      />
    </motion.div>
  );
};

export default DomainProject;
