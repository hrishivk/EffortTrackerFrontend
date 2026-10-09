import { userServiceMethood } from "../services/userService";

export interface Announcement {
  id: string;
  version: string;
  title: string;
  message?: string;
  created_at: string;
}

/** The release SP last sent to everyone, or null when none has been sent. */
export const fetchLatestAnnouncement = async (): Promise<Announcement | null> => {
  const response = await userServiceMethood.getJson("/announcements/latest");
  return response.data?.data ?? null;
};

/** SP only: tell every user about a release. The backend notifies each of them. */
export const publishAnnouncement = async (data: {
  version: string;
  title: string;
  message?: string;
}) => {
  const response = await userServiceMethood.postJson("/announcements", data);
  return response.data;
};
