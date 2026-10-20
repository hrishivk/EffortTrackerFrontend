/** What a task with no project (a General task) shows where a project would. */
export const GENERAL_PROJECT = "General";

/** A task's project name, or "General" when it has none. */
export const taskProjectName = (
  project?: string | { id?: string; name?: string } | null
): string =>
  (typeof project === "object" && project !== null ? project.name : project) || GENERAL_PROJECT;
