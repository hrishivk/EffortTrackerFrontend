
export const OPEN_NOTIFICATIONS = "krew:open-notifications";

export const openNotifications = () => {
  window.dispatchEvent(new Event(OPEN_NOTIFICATIONS));
};
