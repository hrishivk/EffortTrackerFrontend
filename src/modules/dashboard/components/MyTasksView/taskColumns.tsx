import type { Column } from "../../../../shared/components/Table/types";
import type { formUserData } from "../../../../shared/types/User";
import { taskTiming } from "../../../../shared/utils/taskTime";
import SubtaskProgress from "../SubtaskProgress";
import TaskActionCell from "../TaskActionCell";
import TaskTimer from "../TaskTimer";
import { PROJECT_COLORS } from "./constants";
import { normalizeStatus, projectNameOf } from "./helpers";
import {
  AssigneesCell,
  DueDateCell,
  PriorityCell,
  ProjectCell,
  StatusCell,
  TaskNameCell,
  TimestampCell,
} from "./TaskCells";
import type { GroupedTask, PanelTab, ProjectColor } from "./types";

type ColumnContext = {
  isManagerView: boolean;
  users: formUserData[];
  projectColorMap: Record<string, ProjectColor>;
  quickBusy: Record<string, boolean>;
  mayEditRow: (row: GroupedTask) => boolean;
  mayDeleteRow: (row: GroupedTask) => boolean;
  ownsAllTasks: (row: GroupedTask) => boolean;
  openPanel: (row: GroupedTask, tab?: PanelTab) => void;
  onDeleteRow: (row: GroupedTask) => void;
  onQuickStatus: (row: GroupedTask, next: "in_progress" | "completed") => void;
};

const isDone = (status?: string) => {
  const s = (status || "").toLowerCase().replace(/[\s_]+/g, "_");
  return s === "completed" || s === "done";
};

export function buildTaskColumns(ctx: ColumnContext): Column<GroupedTask>[] {
  const actionProps = (row: GroupedTask) => ({
    status: row.status,
    owns: ctx.ownsAllTasks(row),
    busy: !!ctx.quickBusy[row.key],
    onStart: () => ctx.onQuickStatus(row, "in_progress"),
    onComplete: () => ctx.onQuickStatus(row, "completed"),
  });

  return [
    {
      key: "taskName",
      header: "Task Name",
      width: "22%",
      render: (row) => (
        <TaskNameCell
          row={row}
          canEdit={ctx.mayEditRow(row)}
          canDelete={ctx.mayDeleteRow(row)}
          onEdit={() => ctx.openPanel(row, "subtasks")}
          onDelete={() => ctx.onDeleteRow(row)}
        />
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (row) => {
        const projName = projectNameOf(row.project);
        return (
          <ProjectCell name={projName} color={ctx.projectColorMap[projName] || PROJECT_COLORS[0]} />
        );
      },
    },
    ...(ctx.isManagerView
      ? [
          {
            key: "assignedTo",
            header: "Assigned To",
            render: (row: GroupedTask) => (
              <AssigneesCell assignees={row.assignees || []} users={ctx.users} />
            ),
          } as Column<GroupedTask>,
        ]
      : []),
    {
      key: "startTime",
      header: "Start Time",
      render: (row) => (
        <TimestampCell value={taskTiming(row).startTime} timeColor="var(--text-faint)" />
      ),
    },
    {
      key: "endTime",
      header: "End Time",
      render: (row) => (
        <TimestampCell
          value={taskTiming(row).endTime}
          timeColor={isDone(row.status) ? "#16a34a" : "var(--text-faint)"}
        />
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (row) => (
        <DueDateCell row={row} onSlipClick={() => ctx.openPanel(row, "activity")} />
      ),
    },
    {
      key: "totalTime",
      header: "Total Time",
      render: (row) => {
        const t = taskTiming(row);
        return (
          <TaskTimer
            status={t.status}
            startTime={t.runningSince}
            endTime={t.endTime}
            totalSeconds={t.totalSeconds}
          />
        );
      },
    },
    {
      key: "progress",
      header: "Status",
      render: (row) => <StatusCell row={row} />,
    },
    {
      key: "action",
      header: "Action",
      render: (row) => {
        const finished = ["completed", "done"].includes(normalizeStatus(row.status));

        if ((row.subtask_count ?? row.subtasks?.length ?? 0) > 0) {
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <SubtaskProgress
                dense
                subtasks={row.subtasks}
                done={row.subtask_done_count}
                total={row.subtask_count}
                onOpen={() => ctx.openPanel(row)}
              />
              {!finished && <TaskActionCell dense {...actionProps(row)} />}
            </span>
          );
        }
        return <TaskActionCell {...actionProps(row)} />;
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <PriorityCell priority={row.priority} />,
    },
  ];
}
