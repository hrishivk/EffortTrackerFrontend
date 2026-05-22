export interface LeaveRequest {
  id?: string;
  user_id?: string;
  manager_id?: string;
  admin_id?: string;
  leave_type: string;
  session: string;
  start_date: string;
  end_date: string;
  total_days?: number;
  reason: string;
  contact?: string;
  status?: "pending" | "manager_approved" | "manager_rejected" | "approved" | "rejected" | "cancelled";
  manager_remarks?: string;
  admin_remarks?: string;
  applied_at?: string;
  manager_action_at?: string;
  admin_action_at?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  applicant?: {
    id: string;
    fullName: string;
    email: string;
    employee_id?: string;
    department?: string;
    role?: string;
  };
  manager?: {
    id: string;
    fullName: string;
  };
}

export interface LeaveBalance {
  leave_type: string;
  total: number;
  used: number;
  remaining: number;
}

export interface TeamMember {
  id: string;
  fullName: string;
  employee_id?: string;
  role?: string;
}

export interface TeamLeavesFilters {
  status?: string;
  leave_type?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLeaves {
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
}
