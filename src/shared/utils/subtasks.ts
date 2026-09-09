/** How many of a task's children are finished, for the tally shown beside it. */
export const subtaskProgress = (
  subtasks?: { status?: string | null }[]
): { done: number; total: number } => {
  const total = subtasks?.length ?? 0;
  const done =
    subtasks?.filter((s) => {
      const v = (s.status || "").toLowerCase().replace(/[\s-]+/g, "_");
      return v === "completed" || v === "done";
    }).length ?? 0;
  return { done, total };
};
