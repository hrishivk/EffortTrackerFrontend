import type { taskList } from "../../../user/types";
import { assigneeNameOf, projectNameOf, slipsOn } from "./helpers";
import type { GroupedTask } from "./types";

type GetUserName = (id: string | number | null | undefined) => string;

const assigneeEntry = (t: taskList, getUserName: GetUserName) => ({
  name: assigneeNameOf(t) || getUserName(t.assigned_to),
  status: t.status || "",
  userId: t.assigned_to,
});

export function groupTasks(
  list: taskList[],
  isManagerView: boolean,
  getUserName: GetUserName
): GroupedTask[] {
  if (!isManagerView) {
    return list.map((t) => ({
      key: String(t.id),
      description: t.description,
      project: t.project,
      priority: t.priority,
      start_time: t.start_time,
      end_time: t.end_time,
      created_at: t.created_at,
      group_id: t.group_id,
      start_date: t.start_date,
      due_date: t.due_date,
      total_seconds: t.total_seconds ?? 0,
      subtasks: t.subtasks ?? [],
      subtask_count: t.subtask_count,
      subtask_done_count: t.subtask_done_count,
      extension_count: slipsOn(t),
      status: t.status,
      tasks: [t],
      assignees: [assigneeEntry(t, getUserName)],
    }));
  }

  const map = new Map<string, taskList[]>();
  for (const t of list) {
    const projName = projectNameOf(t.project);
    const projId = t.project_id || (typeof t.project === "object" && t.project !== null
      ? t.project.id : "");
    const desc = (t.description || "").trim();
    const proj = projId ? String(projId) : String(projName).trim();
    const groupKey = `${desc}|||${proj}`;
    if (!map.has(groupKey)) map.set(groupKey, []);
    map.get(groupKey)!.push(t);
  }

  const rows: GroupedTask[] = [];
  for (const [key, rowTasks] of map) {
    const first = rowTasks[0];
    let start: string | null = null;
    let end: string | null = null;
    let created: string | null = null;
    let tracked = 0;
    for (const t of rowTasks) {
      if (t.start_time && (!start || t.start_time < start)) start = t.start_time;
      if (t.end_time && (!end || t.end_time > end)) end = t.end_time;
      if (t.created_at && (!created || t.created_at < created)) created = t.created_at;
      tracked += t.total_seconds ?? 0;
    }
    rows.push({
      key,
      description: first.description,
      project: first.project,
      priority: first.priority,
      start_time: start,
      end_time: end,
      created_at: created,
      group_id: first.group_id,
      start_date: first.start_date,
      due_date: first.due_date,
      total_seconds: tracked,
      subtasks: first.subtasks ?? [],
      subtask_count: first.subtask_count,
      subtask_done_count: first.subtask_done_count,
      extension_count: Math.max(...rowTasks.map(slipsOn)),
      status: first.status,
      tasks: rowTasks,
      assignees: rowTasks.map((t) => assigneeEntry(t, getUserName)),
    });
  }
  return rows;
}
