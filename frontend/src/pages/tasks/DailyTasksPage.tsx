import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Plus } from 'lucide-react';
import { useCreateTask, useDeleteTask, useSetTaskState, useTasks, useUpdateTask } from '../../features/tasks/hooks';
import type { Task, TaskState } from '../../types/task';
import Modal from '../../components/ui/Modal';
import { TaskComposer } from '../../components/tasks/TaskComposer';
import { TaskCard } from '../../components/tasks/TaskCard';
import { Button } from '../../components/ui/Button';

const DailyTasksPage = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasksQuery = useTasks(selectedDate);
  const createTask = useCreateTask(selectedDate);
  const updateTask = useUpdateTask(selectedDate);
  const deleteTask = useDeleteTask(selectedDate);
  const updateState = useSetTaskState(selectedDate);

  const tasks = useMemo(() => tasksQuery.data?.filter((task) => !task.isCancelled) ?? [], [tasksQuery.data]);

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
    if (editingTask) {
      await updateTask.mutateAsync({
        taskId: editingTask.id,
        payload: {
          title: values.title,
          description: values.description,
          dueDate: values.dueDate ?? undefined,
        },
      });
    } else {
      await createTask.mutateAsync({
        title: values.title,
        description: values.description,
        taskType: values.taskType as Task['taskType'],
        dueDate: values.dueDate || undefined,
      });
    }
    closeModal();
  };

  const cycleState = (taskId: string, state: TaskState) => {
    updateState.mutate({ taskId, state });
  };

  const removeTask = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const isLoading = tasksQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/20 via-slate-900 to-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/70">Focus date</p>
          <h2 className="text-2xl font-semibold text-white">{format(selectedDate, 'EEEE, MMMM d')}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white/80">
            <CalendarDays className="h-4 w-4" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedDate(value ? new Date(value) : new Date());
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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="inline-flex items-center gap-2 text-white/70">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading tasks…</span>
          </div>
        </div>
      ) : !tasksQuery.isError && tasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-white/70">
          <p>No tasks for this day.</p>
          <p className="mt-2 text-sm">Click "New task" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onCycleState={(next) => cycleState(task.id, next)}
              onEdit={() => openEditModal(task)}
              onDelete={() => removeTask(task.id)}
            />
          ))}
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

