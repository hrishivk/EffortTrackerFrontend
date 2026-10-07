import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dialog from "@mui/material/Dialog";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import type {
  taskList,
  TaskEditFields,
  AddSubtaskInput,
} from "../../user/types";
import { toDateValue } from "../../../shared/utils/taskStatus";
import { assigneeIdOf } from "../../../shared/utils/subtasks";
import TaskComments from "./TaskComments";
import { AddSubtasksForm } from "./TaskEditForm";
import type { SubtaskAssignee } from "./CreateTaskModal";
import Dialoge from "../../../presentation/Dialog";
import ExtendTaskDialog from "./ExtendTaskDialog";
import {
  buildActivity,
  deletePrompt,
  projectName,
  stagger,
  type TabKey,
} from "./TaskDetailPanel/tdpUtils";
import useTaskSummary from "./TaskDetailPanel/useTaskSummary";
import RowAction from "./TaskDetailPanel/RowAction";
import TaskCard, { type TaskCardContext } from "./TaskDetailPanel/TaskCard";
import TaskHeader from "./TaskDetailPanel/TaskHeader";
import TaskRail from "./TaskDetailPanel/TaskRail";
import TaskSide from "./TaskDetailPanel/TaskSide";
import TabBar, { type TabDef } from "./TaskDetailPanel/TabBar";
import DetailsTab from "./TaskDetailPanel/DetailsTab";
import ActivityTab from "./TaskDetailPanel/ActivityTab";

interface TaskDetailPanelProps {
  task: taskList | null;
  open: boolean;
  onClose: () => void;
  owns: boolean;
  currentUserId?: string | number | null;
  busy: Record<string, boolean>;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onCommentAdd?: (taskId: string, body: string) => Promise<void>;
  onCommentEdit?: (taskId: string, commentId: string, body: string) => Promise<void>;
  onCommentDelete?: (taskId: string, commentId: string) => Promise<void>;
  onTaskEdit?: (taskId: string, fields: TaskEditFields) => Promise<void>;
  onSubtaskAdd?: (
    parentId: string,
    rows: AddSubtaskInput[],
    sequential?: boolean
  ) => Promise<number>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  canDelete?: (row: taskList) => boolean;
  onTaskExtend?: (
    taskId: string,
    input: { due_date: string; reason: string }
  ) => Promise<void>;
  initialTab?: TabKey;
  roomMembers?: SubtaskAssignee[];
  projectColorMap: Record<string, { bg: string; text: string }>;
}

export default function TaskDetailPanel({
  task,
  open,
  onClose,
  owns,
  currentUserId,
  busy,
  onStart,
  onComplete,
  onCommentAdd,
  onCommentEdit,
  onCommentDelete,
  onTaskEdit,
  onSubtaskAdd,
  onTaskDelete,
  onTaskExtend,
  canDelete,
  initialTab,
  roomMembers = [],
  projectColorMap,
}: TaskDetailPanelProps) {
  const [tab, setTab] = useState<TabKey>("subtasks");
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingChild, setAddingChild] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<taskList | null>(null);
  const [extending, setExtending] = useState<taskList | null>(null);

  const subs = useMemo(() => task?.subtasks ?? [], [task]);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab ?? "subtasks");
    setOpenRows({});
    setOpenThreads({});
    setEditingId(null);
    setAddingChild(false);
    setPendingDelete(null);
    setExtending(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, subs.length]);

  const { team, tally, units, total, percent } = useTaskSummary(task, subs);

  if (!task) return null;

  const projName = projectName(task.project);
  const projColor = projectColorMap[projName] ?? { bg: "#ede9fe", text: "#7c3aed" };
  const activity = buildActivity(task);

  const canComment = !!onCommentAdd && !!onCommentEdit && !!onCommentDelete;

  const me = String(currentUserId ?? "");
  const creatorId = String(task.created_by ?? task.dailyLog?.created_by ?? "");

  const mayEdit = (row: taskList): boolean => {
    if (!onTaskEdit || !me) return false;
    const who = assigneeIdOf(row);
    if (who) return who === me || creatorId === me;
    return creatorId ? creatorId === me : owns;
  };

  const withSaving = async <T,>(work: () => Promise<T>, fallback: T): Promise<T> => {
    setSaving(true);
    try {
      return await work();
    } catch {
      return fallback;
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (rowId: string, fields: TaskEditFields) => {
    if (!onTaskEdit) return;
    await withSaving(async () => {
      await onTaskEdit(rowId, fields);
      setEditingId(null);
    }, undefined);
  };

  const pushDeadline = async (input: { due_date: string; reason: string }) => {
    if (!onTaskExtend || !extending) return;
    await withSaving(async () => {
      await onTaskExtend(String(extending.id), input);
      setExtending(null);
    }, undefined);
  };

  const removeRow = async (row: taskList) => {
    if (!onTaskDelete) return;
    await withSaving(async () => {
      await onTaskDelete(String(row.id));
      setPendingDelete(null);
      if (String(row.id) === String(task.id)) onClose();
    }, undefined);
  };

  const addChildren = async (
    rows: AddSubtaskInput[],
    sequential: boolean
  ): Promise<number> => {
    if (!onSubtaskAdd) return 0;
    return withSaving(async () => {
      const added = await onSubtaskAdd(
        String(task.id),
        rows,
        sequential === !!task.sequential ? undefined : sequential
      );
      if (added >= rows.length) setAddingChild(false);
      return added;
    }, 0);
  };

  const actionCtx = { owns, currentUserId, busy, onStart, onComplete };

  const cardCtx: TaskCardContext = {
    ...actionCtx,
    openRows,
    toggleRow: (id, next) => setOpenRows((o) => ({ ...o, [id]: next })),
    openThreads,
    toggleThread: (id, next) => setOpenThreads((o) => ({ ...o, [id]: next })),
    editingId,
    saving,
    canComment,
    canExtend: !!onTaskExtend,
    canRemove: (row) => !!onTaskDelete && !!canDelete?.(row),
    mayEdit,
    startEdit: (id) => {
      setAddingChild(false);
      setEditingId(id);
    },
    cancelEdit: () => setEditingId(null),
    saveEdit,
    startExtend: (row) => {
      setEditingId(null);
      setAddingChild(false);
      setExtending(row);
    },
    startDelete: (row) => {
      setEditingId(null);
      setAddingChild(false);
      setPendingDelete(row);
    },
    commentBox: (row) => (
      <TaskComments
        dense
        taskId={String(row.id)}
        comments={row.comments}
        commentCount={row.comment_count}
        currentUserId={currentUserId}
        taskCreatedBy={row.created_by ?? task.created_by}
        onAdd={onCommentAdd!}
        onEdit={onCommentEdit!}
        onDelete={onCommentDelete!}
      />
    ),
  };

  const TABS: TabDef[] = [
    { key: "details", label: "Details", icon: ArticleOutlinedIcon },
    {
      key: "subtasks",
      label: "Subtasks",
      icon: AccountTreeOutlinedIcon,
      count: task.subtask_count ?? subs.length,
    },
    { key: "activity", label: "Activity", icon: TimelineIcon },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: "calc(100% - 48px)",
            maxWidth: 1420,
            margin: "24px",
            borderRadius: 4,
            backgroundColor: "var(--bg-card)",
            backgroundImage: "none",
            boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)",
          },
        },
      }}
    >
      <div className="tdp">
        <TaskHeader
          task={task}
          projName={projName}
          done={tally.completed}
          total={total}
          team={team}
          onClose={onClose}
        />

        <div className="tdp__grid">
          <TaskRail
            task={task}
            projName={projName}
            percent={percent}
            action={<RowAction row={task} isMain {...actionCtx} />}
          />

          <main className="tdp__centre">
            <TabBar tabs={TABS} active={tab} onChange={setTab} />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{ minWidth: 0 }}
              >
                {tab === "subtasks" && (
                  <div className="tdp__panel">
                    <div className="tdp__panel-head">
                      <AccountTreeOutlinedIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
                      <h4 className="tdp__panel-title">
                        Work ({(task.subtask_count ?? subs.length) + 1})
                      </h4>

                      {onSubtaskAdd && mayEdit(task) && !addingChild && (
                        <button
                          type="button"
                          className="tdp__head-btn"
                          onClick={() => {
                            setEditingId(null);
                            setAddingChild(true);
                          }}
                        >
                          <AddRoundedIcon sx={{ fontSize: 15 }} />
                          {subs.length ? "Add subtasks" : "Break into subtasks"}
                        </button>
                      )}
                    </div>

                    <div className="tdp__cards">
                      <motion.div {...stagger(0)} style={{ minWidth: 0 }}>
                        <TaskCard row={task} isMain ctx={cardCtx} />
                      </motion.div>
                    </div>

                    {addingChild && (
                      <div className="tdp__add-slot">
                        <AddSubtasksForm
                          roomMembers={roomMembers}
                          defaultStartDate={toDateValue(task.start_date)}
                          defaultDueDate={toDateValue(task.due_date)}
                          sequential={!!task.sequential}
                          saving={saving}
                          onCancel={() => setAddingChild(false)}
                          onAdd={addChildren}
                        />
                      </div>
                    )}

                    {subs.length === 0 && !addingChild && (
                      <p className="tdp__note">No subtasks — this task is tracked on its own.</p>
                    )}
                  </div>
                )}

                {tab === "details" && (
                  <DetailsTab
                    task={task}
                    projName={projName}
                    projColor={projColor}
                    editable={mayEdit(task)}
                    editing={editingId === String(task.id)}
                    saving={saving}
                    onStartEdit={() => cardCtx.startEdit(String(task.id))}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={(fields) => saveEdit(String(task.id), fields)}
                  />
                )}

                {tab === "activity" && <ActivityTab activity={activity} />}
              </motion.div>
            </AnimatePresence>
          </main>

          <TaskSide team={team} tally={tally} units={units} total={total} percent={percent} />
        </div>
      </div>

      <ExtendTaskDialog
        task={extending}
        open={extending !== null}
        saving={saving}
        onClose={() => setExtending(null)}
        onExtend={pushDeadline}
      />

      <Dialoge
        open={pendingDelete !== null}
        data="delete"
        busy={saving}
        title={pendingDelete?.parent_id ? "Delete this subtask?" : "Delete this task?"}
        message={deletePrompt(pendingDelete)}
        confirmLabel="Yes, delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void removeRow(pendingDelete);
        }}
      />
    </Dialog>
  );
}
