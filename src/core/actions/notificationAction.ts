import { userServiceMethood } from "../services/userService";

export const fetchNotifications = async (params?: { page?: number; limit?: number }) => {
  try {
    const response = await userServiceMethood.getLeaves("/notifications", params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUnreadCount = async () => {
  try {
    const response = await userServiceMethood.getLeaves("/notifications/count");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markNotificationRead = async (notification_id: string) => {
  try {
    const response = await userServiceMethood.leaveAction("/notifications/read", { notification_id });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await userServiceMethood.leaveAction("/notifications/read-all", {});
    return response.data;
  } catch (error) {
    throw error;
  }
};
