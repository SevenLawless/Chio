import { useMemo, useState } from 'react';
import { format, startOfDay } from 'date-fns';
import { CalendarDays, Plus } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCreateTask, useDeleteTask, useSetTaskState, useTasks, useUpdateTask, useUpdateTaskOrder } from '../../features/tasks/hooks';
import type { Task, TaskState } from '../../types/task';
import Modal from '../../components/ui/Modal';
import { TaskComposer } from '../../components/tasks/TaskComposer';
import { TaskCard } from '../../components/tasks/TaskCard';
import { Button } from '../../components/ui/Button';

const DailyTasksPage = () => {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasksQuery = useTasks(selectedDate);
  const createTask = useCreateTask(selectedDate);
  const updateTask = useUpdateTask(selectedDate);
  const deleteTask = useDeleteTask(selectedDate);
  const updateState = useSetTaskState(selectedDate);
  const updateOrder = useUpdateTaskOrder(selectedDate);

  const tasks = useMemo(() => {
    const filtered = tasksQuery.data?.filter((task) => !task.isCancelled) ?? [];
    // Sort by order, then by createdAt for consistent ordering
    // Handle cases where order might be undefined (for existing tasks before migration)
    return [...filtered].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [tasksQuery.data]);
  
  const dailyTasks = useMemo(() => tasks.filter((task) => task.taskType === 'DAILY'), [tasks]);
  const oneTimeTasks = useMemo(() => tasks.filter((task) => task.taskType === 'ONE_TIME'), [tasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async (values: { title: string; description?: string; taskType: string; dueDate?: string }) => {
    try {
      // Normalize empty strings to undefined
      const normalizedDueDate = values.dueDate && values.dueDate.trim() ? values.dueDate.trim() : undefined;
      const normalizedDescription = values.description && values.description.trim() ? values.description.trim() : null;

      if (editingTask) {
        const payload: { title: string; description?: string | null; dueDate?: string } = {
          title: values.title,
          description: normalizedDescription,
        };
        
        // Only include dueDate if it's a ONE_TIME task and has a value
        if (editingTask.taskType === 'ONE_TIME' && normalizedDueDate) {
          payload.dueDate = normalizedDueDate;
        }

        await updateTask.mutateAsync({
          taskId: editingTask.id,
          payload,
        });
      } else {
        await createTask.mutateAsync({
          title: values.title,
          description: normalizedDescription || undefined,
          taskType: values.taskType as Task['taskType'],
          dueDate: normalizedDueDate,
        });
      }
      // Close modal after successful mutation
      closeModal();
    } catch (error) {
      // Error is handled by React Query, but we don't close the modal on error
      console.error('Failed to save task:', error);
    }
  };

  const cycleState = (taskId: string, state: TaskState) => {
    updateState.mutate({ taskId, state });
  };

  const removeTask = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const handleDragEnd = (event: DragEndEvent, taskList: Task[]) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = taskList.findIndex((task) => task.id === active.id);
    const newIndex = taskList.findIndex((task) => task.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Create a new array with reordered tasks
    const reorderedTasks = [...taskList];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    // Create new order array with sequential orders starting from 0
    const newOrder = reorderedTasks.map((task, index) => ({
      taskId: task.id,
      order: index,
    }));

    // Update all affected tasks
    updateOrder.mutate(newOrder);
  };

  const isLoading = tasksQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-brand-800/30 bg-gradient-to-br from-brand-900/40 via-slate-900 to-black p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/70">Focus date</p>
          <h2 className="text-2xl font-semibold text-white">{format(selectedDate, 'EEEE, MMMM d')}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-3 rounded-2xl border border-brand-800/30 bg-brand-900/20 px-4 py-2 text-white/80">
            <CalendarDays className="h-4 w-4" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(event) => {
                const value = event.target.value;
                // Parse the date input as local date and normalize to start of day
                setSelectedDate(value ? startOfDay(new Date(value)) : startOfDay(new Date()));
              }}
              className="bg-transparent text-sm text-white focus:outline-none"
            />
          </label>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New task
          </Button>
        </div>
      </div>

      {tasksQuery.isError && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6" role="alert" aria-live="polite">
          <p className="font-semibold text-rose-200">Error loading tasks</p>
          <p className="mt-2 text-sm text-rose-300">{(tasksQuery.error as Error).message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-6 text-center">
          <div className="inline-flex items-center gap-2 text-brand-300">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading tasks…</span>
          </div>
        </div>
      ) : !tasksQuery.isError && tasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-brand-800/30 bg-brand-900/10 p-10 text-center text-white/70">
          <p>No tasks for this day.</p>
          <p className="mt-2 text-sm text-brand-300">Click "New task" to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Daily Tasks Section */}
          {dailyTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-white" />
                  Daily Rituals
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, dailyTasks)}>
                <SortableContext items={dailyTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {dailyTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onCycleState={(next) => cycleState(task.id, next)}
                        onEdit={() => openEditModal(task)}
                        onDelete={() => removeTask(task.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* One-Time Tasks Section */}
          {oneTimeTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-white" />
                  One-Time Missions
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, oneTimeTasks)}>
                <SortableContext items={oneTimeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {oneTimeTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onCycleState={(next) => cycleState(task.id, next)}
                        onEdit={() => openEditModal(task)}
                        onDelete={() => removeTask(task.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Empty state if both sections are empty but tasks array has items (shouldn't happen, but safety check) */}
          {dailyTasks.length === 0 && oneTimeTasks.length === 0 && tasks.length > 0 && (
            <div className="rounded-3xl border border-dashed border-brand-800/30 bg-brand-900/10 p-10 text-center text-white/70">
              <p>No tasks for this day.</p>
            </div>
          )}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit task' : 'New task'}
      >
        <TaskComposer
          defaultValues={
            editingTask
              ? {
                  title: editingTask.title,
                  description: editingTask.description ?? '',
                  taskType: editingTask.taskType,
                  dueDate: editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : '',
                }
              : undefined
          }
          mode={editingTask ? 'edit' : 'create'}
          onSubmit={handleSave}
          isSubmitting={createTask.isPending || updateTask.isPending}
        />
      </Modal>
    </div>
  );
};

export default DailyTasksPage;

