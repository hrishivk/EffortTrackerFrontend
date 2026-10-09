
export const OPEN_NOTIFICATIONS = "krew:open-notifications";

export const openNotifications = () => {
  window.dispatchEvent(new Event(OPEN_NOTIFICATIONS));
};

export const OPEN_WHATS_NEW = "krew:open-whats-new";

export const openWhatsNew = () => {
  window.dispatchEvent(new Event(OPEN_WHATS_NEW));
};
