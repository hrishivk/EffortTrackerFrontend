import type { ElementType } from "react";
import {
  FiGrid,
  FiUsers,
  FiLayers,
  FiSettings,
  FiBarChart2,
  FiBriefcase,
} from "react-icons/fi";
import type { NavItem, NavSection } from "./types";

export const TREE_SPRING = { type: "spring", damping: 30, stiffness: 350 } as const;

export const WS_STATUS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

export const ROLE_LABELS: Record<string, string> = {
  SP: "Super Admin",
  AM: "Account Manager",
  USER: "Team Member",
  DEVLOPER: "Developer",
};

const icon = (El: ElementType) => <El size={15} />;

/** SP and AM share the same menu; only the base path and the people page differ. */
const adminSections = (base: string, people: NavItem): NavSection[] => [
  {
    title: "Main",
    items: [{ to: `${base}/dashboard`, label: "Dashboard", icon: icon(FiGrid) }],
  },
  {
    title: "Manage",
    items: [
      people,
      { to: `${base}/domain-project`, label: "Departments & Projects", icon: icon(FiLayers) },
      { to: `${base}/workspaces`, label: "Workspaces", icon: icon(FiBriefcase) },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        to: `${base}/settings`,
        label: "Settings",
        icon: icon(FiSettings),
        children: [
          {
            to: `${base}/settings/task-reports`,
            label: "Task Reports",
            icon: icon(FiBarChart2),
          },
        ],
      },
    ],
  },
];

export const getSections = (role?: string): NavSection[] => {
  if (role === "SP") {
    return adminSections("/sp", {
      to: "/sp/userMangement",
      label: "User Management",
      icon: icon(FiUsers),
    });
  }

  if (role === "AM") {
    return adminSections("/am", {
      to: "/am/TeamManagement",
      label: "Team Management",
      icon: icon(FiUsers),
    });
  }

  if (role === "USER" || role === "DEVLOPER") {
    return [
      {
        title: "Main",
        items: [
          { to: "/user/dashboard", label: "Dashboard", icon: icon(FiGrid) },
          { to: "/user/domain-project", label: "Departments & Projects", icon: icon(FiLayers) },
        ],
      },
    ];
  }

  return [];
};
