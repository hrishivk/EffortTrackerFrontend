export  interface RoleTitles {
  [key: string]: string;
}


export interface SpTeamPerformanceProps {
  page: number;
  setPage: (page: number) => void;
}
 export interface StaCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
}

export interface TaskStatusDistributionProps {
  completed: number;
  inProgress: number;
  yetToStart: number;
  totalTasks: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
}
export interface LegendItemProps {
  color: string;
  label: string;
  value: number;
  total: number;
}
export interface TeamPerformanceRow {
  id: number
  fullName: string
  avatar?: any
  projects: { name: string }[]
  yetToStart: number
  inProgress: number
  completed: number
  totalHours: number
  efficiency: number
  status: "Active" | "Inactive"
}
