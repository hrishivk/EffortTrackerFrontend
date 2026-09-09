/**
 * Window events used to talk between parts of the chrome that have no common
 * owner — the header, the sidebar and the notification panel are siblings
 * mounted by the layout, so a shared event beats threading callbacks through
 * it or putting a boolean in Redux.
 */

/** Asks the header's notification panel to open itself. */
export const OPEN_NOTIFICATIONS = "krew:open-notifications";

export const openNotifications = () => {
  window.dispatchEvent(new Event(OPEN_NOTIFICATIONS));
};
