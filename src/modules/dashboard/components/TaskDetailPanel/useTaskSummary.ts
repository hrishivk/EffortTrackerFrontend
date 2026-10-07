import { useMemo } from "react";
import type { taskList } from "../../../user/types";
import { assigneeOf } from "../../../../shared/utils/subtasks";
import { normalize } from "./tdpUtils";

export type TeamMember = {
  id: string;
  name: string;
  done: number;
  total: number;
  owner: boolean;
};

export type Tally = { completed: number; in_progress: number; pending: number };

export default function useTaskSummary(task: taskList | null, subs: taskList[]) {
  const team = useMemo(() => {
    const byId = new Map<string, TeamMember>();

    const seed = (who: { id: string; fullName: string } | null, owner: boolean) => {
      if (!who) return null;
      const id = String(who.id);
      if (!byId.has(id)) byId.set(id, { id, name: who.fullName, done: 0, total: 0, owner });
      return byId.get(id)!;
    };

    seed(assigneeOf(task ?? undefined), true);
    for (const sub of subs) {
      const row = seed(assigneeOf(sub), false);
      if (!row) continue;
      row.total += 1;
      if (normalize(sub.status) === "completed") row.done += 1;
    }

    return [...byId.values()].sort(
      (a, b) => Number(b.owner) - Number(a.owner) || b.done - a.done
    );
  }, [task, subs]);

  const tally = useMemo(() => {
    const counts: Tally = { completed: 0, in_progress: 0, pending: 0 };
    const bucket = (status?: string | null) => {
      const s = normalize(status);
      if (s === "completed" || s === "done") counts.completed += 1;
      else if (s === "in_progress") counts.in_progress += 1;
      else counts.pending += 1;
    };
    if (subs.length) subs.forEach((s) => bucket(s.status));
    else if (task) bucket(task.status);
    return counts;
  }, [subs, task]);

  const units = useMemo(() => {
    const one = (row: taskList) => {
      const s = normalize(row.status);
      const key =
        s === "done" ? "completed" : s === "pending" ? "yet_to_start" : s;
      return { status: key, label: row.description ?? "" };
    };
    if (subs.length) return subs.map(one);
    return task ? [one(task)] : [];
  }, [subs, task]);

  const total = tally.completed + tally.in_progress + tally.pending;
  const percent = total ? Math.round((tally.completed / total) * 100) : 0;

  return { team, tally, units, total, percent };
}
