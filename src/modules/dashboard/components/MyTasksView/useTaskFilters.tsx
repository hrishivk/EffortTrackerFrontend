import { useCallback, useEffect, useState } from "react";
import { FiActivity, FiClock, FiGrid, FiLayers, FiUsers } from "react-icons/fi";
import type { TaskListFilters } from "../../../../core/services/userService";
import type { formUserData } from "../../../../shared/types/User";
import { TASK_STATUS_FILTER_OPTIONS } from "../../../../shared/utils/taskStatus";
import type {
  FilterCategory,
  FilterValues,
} from "../../../../shared/components/FilterPanel/FilterPanel";
import type { TaskGroup } from "../../types";
import { groupNameToStatus, STATUS_LANE_ORDER } from "../boardConstants";
import { projectsForMember, reportsOf } from "./assignees";
import { SLIP_OPTIONS } from "./constants";
import type { UserId, ViewMode } from "./types";

export function useTaskFilters({
  role,
  userId,
  viewUserId,
  viewProject,
  viewTab,
  lockedProject,
  roomId,
  setViewMode,
  setPage,
}: {
  role: string | undefined;
  userId: UserId;
  viewUserId?: string;
  viewProject?: string;
  viewTab?: string;
  lockedProject?: string;
  roomId?: string;
  setViewMode: (mode: ViewMode) => void;
  setPage: (page: number) => void;
}) {
  const isSelfScoped = (role === "USER" || role === "DEVLOPER") && !viewUserId;
  const [projectFilter, setProjectFilter] = useState(viewProject || "");
  const [assigneeFilter, setAssigneeFilter] = useState(
    viewUserId || (role === "AM" ? String(userId) : "")
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [slipFilter, setSlipFilter] = useState("");

  useEffect(() => {
    if (viewUserId) setAssigneeFilter(viewUserId);
  }, [viewUserId]);

  useEffect(() => {
    if (viewProject) {
      setProjectFilter(viewProject);
      if (viewTab === "gantt") setViewMode("gantt");
      else if (viewTab === "board") setViewMode("board");
    }
  }, [viewProject, viewTab, setViewMode]);

  const activeFilters = useCallback((): TaskListFilters => {
    const filters: TaskListFilters = {};
    // Team members and developers only ever see the tasks assigned to them.
    if (isSelfScoped) filters.assigned_to = String(userId);
    else if (assigneeFilter) filters.assigned_to = assigneeFilter;
    if (projectFilter) filters.project = projectFilter;
    if (statusFilter) filters.status = statusFilter;
    if (slipFilter) filters.min_extensions = Number(slipFilter);
    // Opened from a room: only the tasks created in that room.
    if (roomId) filters.room_id = roomId;
    return filters;
  }, [roomId, isSelfScoped, userId, assigneeFilter, projectFilter, statusFilter, slipFilter]);

  const filterValues: FilterValues = {
    ...(lockedProject ? {} : { project: projectFilter }),
    ...(viewUserId ? {} : { assignee: assigneeFilter }),
    status: statusFilter,
    slipped: slipFilter,
  };

  const applyFilters = (values: FilterValues) => {
    setProjectFilter(lockedProject ?? values.project ?? "");
    setAssigneeFilter(viewUserId ?? values.assignee ?? "");
    setStatusFilter(values.status ?? "");
    setSlipFilter(values.slipped ?? "");
    setPage(1);
  };

  return { projectFilter, assigneeFilter, activeFilters, filterValues, applyFilters };
}

const statusOptionsFor = (boardGroups: TaskGroup[]) => {
  if (!boardGroups.length) return TASK_STATUS_FILTER_OPTIONS;

  const rank = (g: TaskGroup) => {
    const i = STATUS_LANE_ORDER.indexOf(g.status || groupNameToStatus(g.name) || "");
    return i === -1 ? STATUS_LANE_ORDER.length : i;
  };
  const ranked = [...boardGroups].sort(
    (a, b) => rank(a) - rank(b) || (a.position ?? 0) - (b.position ?? 0)
  );

  const options = ranked.map((g) => ({
    value: g.status || groupNameToStatus(g.name) || g.name,
    label: g.name.trim(),
  }));

  const values = new Set(options.map((o) => o.value));
  if (values.has("in_progress") && values.has("yet_to_start")) {
    options.unshift({
      value: "in_progress,yet_to_start",
      label: "Active (In Progress + Yet to Start)",
    });
  }
  return options;
};

export function buildTaskFilterCategories({
  role,
  userId,
  viewUserId,
  lockedProject,
  isUserOrDev,
  users,
  projects,
  projectFilter,
  assigneeFilter,
  boardGroups,
}: {
  role: string | undefined;
  userId: UserId;
  viewUserId?: string;
  lockedProject?: string;
  isUserOrDev: boolean;
  users: formUserData[];
  projects: any[];
  projectFilter: string;
  assigneeFilter: string;
  boardGroups: TaskGroup[];
}): FilterCategory[] {
  const filterableUsers = role === "SP" || role === "AM" ? reportsOf(users, role) : [];

  const scopedUserId =
    viewUserId || assigneeFilter || (isUserOrDev ? String(userId) : "");

  const scopedProjects = scopedUserId
    ? projectsForMember(projects, scopedUserId)
    : projects;

  const projectFilterOptions = scopedProjects.map((p) => ({
    value: p.name,
    label: p.name,
  }));

  if (
    projectFilter &&
    !projectFilterOptions.some((option) => option.value === projectFilter)
  ) {
    projectFilterOptions.unshift({ value: projectFilter, label: projectFilter });
  }

  const showAssignee = filterableUsers.length > 0 && !viewUserId;

  const peopleFields = [
    ...(lockedProject
      ? []
      : [
          {
            key: "project",
            label: "Project",
            placeholder: "All projects",
            emptyText: scopedUserId
              ? "No projects assigned"
              : "No projects available",
            icon: <FiLayers size={15} />,
            options: projectFilterOptions,
          },
        ]),
    ...(showAssignee
      ? [
          {
            key: "assignee",
            label: role === "SP" ? "Assignee" : "Assigned to",
            placeholder: "All members",
            emptyText: "No members available",
            icon: <FiUsers size={15} />,
            options: [
              ...(role === "AM"
                ? [{ value: String(userId), label: "My Tasks" }]
                : []),
              ...filterableUsers.map((u) => ({
                value: String(u.id),
                label: u.fullName || String(u.id),
              })),
            ],
          },
        ]
      : []),
  ];

  return [
    ...(peopleFields.length
      ? [
          {
            key: "taskFilters",
            label: "Project & People",
            icon: <FiGrid size={16} />,
            caption:
              peopleFields.length === 1 && peopleFields[0].key === "assignee"
                ? "Filter tasks by assignee"
                : showAssignee
                  ? "Filter tasks by project and assignee"
                  : "Filter tasks by project",
            fields: peopleFields,
          } as FilterCategory,
        ]
      : []),
    {
      key: "statusFilters",
      label: "Status",
      icon: <FiActivity size={16} />,
      caption: "Filter tasks by status and by what has slipped",
      fields: [
        {
          key: "status",
          label: "Status",
          placeholder: "All statuses",
          icon: <FiActivity size={15} />,
          options: statusOptionsFor(boardGroups),
        },
        {
          key: "slipped",
          label: "Extended deadlines",
          placeholder: "Any",
          icon: <FiClock size={15} />,
          options: SLIP_OPTIONS,
        },
      ],
    },
  ];
}
