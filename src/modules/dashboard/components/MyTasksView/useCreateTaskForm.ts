import { useEffect, useState } from "react";
import { addTask } from "../../../../core/actions/action";
import { useSnackbar } from "../../../../contexts/SnackbarContext";
import { apiMessage } from "../../../../shared/utils/apiMessage";
import { toDateInput } from "../../../../shared/utils/taskStatus";
import { createTaskValidationSchema } from "../../../../utils/validation/Validation";
import type { CreateTaskPayload } from "../../../user/types";
import type { TaskGroup } from "../../types";
import { findGroupForStatus } from "../boardConstants";
import type { CreateTaskFormData } from "../CreateTaskModal";
import { blankForm, lastSubtaskDue, toSubtaskPayload } from "./helpers";
import type { CreateForm, UserId, ViewMode } from "./types";

export function useCreateTaskForm({
  lockedProject,
  viewUserId,
  selectedDate,
  viewMode,
  isUserOrDev,
  userId,
  roomId,
  formProjects,
  boardGroups,
  reloadTasks,
  loadBoardTasks,
}: {
  lockedProject?: string;
  viewUserId?: string;
  selectedDate: Date;
  viewMode: ViewMode;
  isUserOrDev: boolean;
  userId: UserId;
  roomId?: string;
  formProjects: any[];
  boardGroups: TaskGroup[];
  reloadTasks: () => Promise<void>;
  loadBoardTasks: () => Promise<void>;
}) {
  const { showSnackbar } = useSnackbar();
  const [form, setForm] = useState<CreateForm>(() =>
    blankForm(lockedProject, viewUserId, toDateInput(new Date()))
  );
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [wantSubtasks, setWantSubtasks] = useState(false);
  const [assignToSelf, setAssignToSelf] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (viewMode !== "list") setShowCreateForm(false);
  }, [viewMode]);

  const openCreateForm = () => {
    if (viewUserId) setAssignToSelf(false);
    setForm((f) => ({
      ...f,
      startDate: f.startDate || toDateInput(selectedDate),
      ...(lockedProject ? { project: lockedProject } : {}),
      ...(viewUserId && !f.assignees.length ? { assignees: [viewUserId] } : {}),
    }));
    setCreateStep(1);
    setWantSubtasks(false);
    setShowCreateForm(true);
  };

  const panelLastSubtaskDue = lastSubtaskDue(form.subtasks);
  const panelDue =
    panelLastSubtaskDue > form.dueDate ? panelLastSubtaskDue : form.dueDate;
  const panelDueMin =
    panelLastSubtaskDue > form.startDate ? panelLastSubtaskDue : form.startDate;

  const projectIdOf = (name: string) => formProjects.find((p) => p.name === name)?.id;

  const stepOneError = (): string | null => {
    const result = createTaskValidationSchema.safeParse({
      taskName: form.taskName,
      project: form.project,
      startDate: form.startDate,
      dueDate: panelDue,
    });
    if (!result.success) return result.error.errors[0]?.message ?? "Please check the form";
    if (!isUserOrDev && !assignToSelf && form.assignees.length === 0) {
      return "Please assign at least one person";
    }
    return null;
  };

  const passesStepOne = () => {
    const error = stepOneError();
    if (error) showSnackbar({ message: error, severity: "error" });
    return !error;
  };

  const goToSubtasks = () => {
    if (passesStepOne()) setCreateStep(2);
  };

  const handleCreateTask = async () => {
    if (!passesStepOne()) return;

    setSubmitting(true);
    try {
      const assigneeIds = (isUserOrDev || assignToSelf) ? [String(userId)] : form.assignees;

      const owners = roomId ? assigneeIds.slice(0, 1) : assigneeIds;

      await Promise.all(
        owners.map((assigneeId) => {
          const payload: CreateTaskPayload = {
            description: form.taskName,
            project: form.project,
            project_id: projectIdOf(form.project),
            assigned_to: assigneeId,
            created_by: userId,
            priority: form.priority,
            start_date: form.startDate || undefined,
            due_date: panelDue || undefined,
            status: "yet_to_start",
            group_id: findGroupForStatus(boardGroups, "yet_to_start")?.id,
            room_id: roomId,
            sequential: form.subtasks.length > 1 ? form.sequential : undefined,
            subtasks: form.subtasks.length ? toSubtaskPayload(form.subtasks) : undefined,
          };
          return addTask(payload);
        })
      );
      const count = owners.length;
      showSnackbar({
        message: assignToSelf
          ? "Task assigned to yourself successfully"
          : count > 1
            ? `Task assigned to ${count} members successfully`
            : "Task created successfully",
        severity: "success",
      });
      setForm(blankForm(lockedProject, viewUserId, toDateInput(selectedDate)));
      setCreateStep(1);
      setWantSubtasks(false);
      setAssignToSelf(false);
      setShowCreateForm(false);
      await reloadTasks();
    } catch (error: any) {
      console.log(error)
      showSnackbar({
        message: error?.response?.data?.message || "Failed to create task",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalCreate = async (data: CreateTaskFormData) => {
    setSubmitting(true);
    const startLane = findGroupForStatus(boardGroups, "yet_to_start");
    try {
      const owner =
        isUserOrDev || !data.assignees.length ? String(userId) : data.assignees[0];

      await addTask({
        description: data.taskName.trim(),
        project: data.project,
        project_id: projectIdOf(data.project),
        assigned_to: owner,
        created_by: userId,
        priority: data.priority,
        status: "yet_to_start",
        group_id: startLane?.id,
        room_id: roomId,
        start_date: data.startDate || undefined,
        due_date: data.dueDate || undefined,
        tags: data.tags.length ? data.tags : undefined,
        sequential: data.subtasks.length > 1 ? data.sequential : undefined,
        subtasks: data.subtasks.length ? toSubtaskPayload(data.subtasks) : undefined,
      });

      showSnackbar({
        message: `"${data.taskName.trim()}" created`,
        severity: "success",
      });
      setCreateTaskOpen(false);
      await loadBoardTasks();
    } catch (error: unknown) {
      showSnackbar({ message: apiMessage(error, "Failed to create task"), severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    setForm,
    createStep,
    setCreateStep,
    wantSubtasks,
    setWantSubtasks,
    assignToSelf,
    setAssignToSelf,
    showCreateForm,
    setShowCreateForm,
    createTaskOpen,
    setCreateTaskOpen,
    submitting,
    openCreateForm,
    panelLastSubtaskDue,
    panelDue,
    panelDueMin,
    goToSubtasks,
    handleCreateTask,
    handleModalCreate,
  };
}

export type CreateTaskFormState = ReturnType<typeof useCreateTaskForm>;
