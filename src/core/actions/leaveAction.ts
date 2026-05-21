import { userServiceMethood } from "../services/userService";

export const applyLeave = async (data: {
  leave_type: string;
  session: string;
  start_date: string;
  end_date: string;
  reason: string;
  contact?: string;
}) => {
  try {
    const response = await userServiceMethood.applyLeave("/leave/apply", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchMyLeaves = async (params?: { status?: string; page?: number; limit?: number }) => {
  try {
    const response = await userServiceMethood.getLeaves("/leave/my-leaves", params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchLeaveBalance = async () => {
  try {
    const response = await userServiceMethood.getLeaves("/leave/balance");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPendingForManager = async (params?: { page?: number; limit?: number }) => {
  try {
    const response = await userServiceMethood.getLeaves("/leave/pending-manager", params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPendingForAdmin = async (params?: { page?: number; limit?: number }) => {
  try {
    const response = await userServiceMethood.getLeaves("/leave/pending-admin", params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const managerLeaveAction = async (leave_id: string, action: "approve" | "reject", remarks?: string) => {
  try {
    const response = await userServiceMethood.leaveAction("/leave/manager-action", { leave_id, action, remarks });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const adminLeaveAction = async (leave_id: string, action: "approve" | "reject", remarks?: string) => {
  try {
    const response = await userServiceMethood.leaveAction("/leave/admin-action", { leave_id, action, remarks });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelLeave = async (leave_id: string) => {
  try {
    const response = await userServiceMethood.leaveAction("/leave/cancel", { leave_id });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchLeaveHistory = async (params?: { user_id?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }) => {
  try {
    const response = await userServiceMethood.getLeaves("/leave/history", params);
    return response.data;
  } catch (error) {
    throw error;
  }
};
