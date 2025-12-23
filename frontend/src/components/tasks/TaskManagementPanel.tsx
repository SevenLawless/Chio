import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCreateTask, useDeleteTask, useSetTaskState, useTasks, useUpdateTask, useUpdateTaskOrder, useAddSelectedTask, useSelectedTasks, useCategories } from '../../features/tasks/hooks';
import type { Mission, TaskState } from '../../types/task';
import Modal from '../ui/Modal';
import { MissionComposer } from './MissionComposer';
import { MissionCard } from './MissionCard';
import { Button } from '../ui/Button';
import { CategoryManager } from './CategoryManager';
import { DraggableTask } from './DraggableTask';

const TaskManagementPanel = () => {
  const currentDate = new Date();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Mission | null>(null);
  const [addingSubTaskToParent, setAddingSubTaskToParent] = useState<string | null>(null);

  const tasksQuery = useTasks(currentDate);
  const selectedTasksQuery = useSelectedTasks();
  const categoriesQuery = useCategories();
  const createTask = useCreateTask(currentDate);
  const updateTask = useUpdateTask(currentDate);
  const deleteTask = useDeleteTask(currentDate);
  const updateState = useSetTaskState(currentDate);
  const updateOrder = useUpdateTaskOrder(currentDate);
  const addSelectedTask = useAddSelectedTask();

  // Get selected task IDs for visual indication
  const selectedTaskIds = useMemo(() => {
    return new Set(selectedTasksQuery.data?.map(st => st.taskId) || []);
  }, [selectedTasksQuery.data]);

  // Filter and sort missions (only DAILY missions now)
  const missions = useMemo(() => {
    const filtered = tasksQuery.data?.filter((mission) => !mission.isCancelled && mission.taskType === 'DAILY') ?? [];
    return [...filtered].sort((a, b) => {
      // Sort by category order first (if categories are loaded)
      const categories = categoriesQuery.data || [];
      const categoryA = categories.findIndex(c => c.name === a.category);
      const categoryB = categories.findIndex(c => c.name === b.category);
      if (categoryA !== categoryB && categoryA !== -1 && categoryB !== -1) {
        return categoryA - categoryB;
      }
      // Then by order field
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Finally by creation date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [tasksQuery.data, categoriesQuery.data]);

  // Group missions by category
  const missionsByCategory = useMemo(() => {
    const categories = categoriesQuery.data || [];
    const grouped: Record<string, Mission[]> = {};

    missions.forEach((mission) => {
      const categoryName = mission.category || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(mission);
    });

    // Sort categories by their order
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
    const result: Record<string, Mission[]> = {};
    sortedCategories.forEach(cat => {
      if (grouped[cat.name]) {
        result[cat.name] = grouped[cat.name];
      }
    });
    // Add any uncategorized missions
    Object.keys(grouped).forEach(catName => {
      if (!categories.find(c => c.name === catName)) {
        result[catName] = grouped[catName];
      }
    });

    return result;
  }, [missions, categoriesQuery.data]);

  const openCreateModal = () => {
    setEditingTask(null);
    setAddingSubTaskToParent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mission: Mission) => {
    setEditingTask(mission);
    setAddingSubTaskToParent(null);
    setIsModalOpen(true);
  };

  const openAddSubTaskModal = (parentId: string) => {
    setEditingTask(null);
    setAddingSubTaskToParent(parentId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setAddingSubTaskToParent(null);
  };

  const handleSave = async (values: { title: string; description?: string; taskType: string; dueDate?: string; parentId?: string; category?: string }) => {
    try {
      const normalizedDescription = values.description && values.description.trim() ? values.description.trim() : undefined;

      if (editingTask) {
        const payload: { title: string; description?: string; category?: string } = {
          title: values.title,
          description: normalizedDescription,
        };
        
        if (values.category && !editingTask.parentId) {
          payload.category = values.category;
        }

        await updateTask.mutateAsync({
          taskId: editingTask.id,
          payload,
        });
      } else {
        await createTask.mutateAsync({
          title: values.title,
          description: normalizedDescription || undefined,
          taskType: 'DAILY' as Mission['taskType'],
          category: values.category || categoriesQuery.data?.[0]?.name || 'MAIN',
          parentId: values.parentId || addingSubTaskToParent || undefined,
        });
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save mission:', error);
    }
  };

  const cycleState = (taskId: string, state: TaskState) => {
    updateState.mutate({ taskId, state });
  };

  const removeMission = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const handleDragEnd = (event: DragEndEvent, missionList: Mission[]) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = missionList.findIndex((m) => m.id === active.id);
    const newIndex = missionList.findIndex((m) => m.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedMissions = [...missionList];
    const [movedMission] = reorderedMissions.splice(oldIndex, 1);
    reorderedMissions.splice(newIndex, 0, movedMission);

    const newOrder = reorderedMissions.map((mission, index) => ({
      taskId: mission.id,
      order: index,
    }));

    updateOrder.mutate(newOrder);
  };

  const handleTaskDragToRight = async (taskId: string) => {
    try {
      await addSelectedTask.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to add selected task:', error);
    }
  };

  const isLoading = tasksQuery.isLoading;

  // Determine modal title and mode
  const modalTitle = editingTask 
    ? (editingTask.parentId ? 'Edit task' : 'Edit mission')
    : addingSubTaskToParent 
      ? 'Add task' 
      : 'New mission';
  
  const composerMode = editingTask 
    ? 'edit' 
    : addingSubTaskToParent 
      ? 'subtask' 
      : 'create';

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="rounded-3xl border border-brand-800/30 bg-gradient-to-br from-brand-900/40 via-slate-900 to-black p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Task Management</h2>
            <p className="text-sm text-white/60 mt-1">Create and organize your missions and tasks</p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New mission
          </Button>
        </div>
      </div>

      {/* Category Manager */}
      <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-6">
        <CategoryManager />
      </div>

      {tasksQuery.isError && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6" role="alert" aria-live="polite">
          <p className="font-semibold text-rose-200">Error loading missions</p>
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
            <span>Loading missions…</span>
          </div>
        </div>
      ) : !tasksQuery.isError && missions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-brand-800/30 bg-brand-900/10 p-10 text-center text-white/70">
          <p>No missions yet.</p>
          <p className="mt-2 text-sm text-brand-300">Click "New mission" to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Group missions by category */}
          {Object.entries(missionsByCategory).map(([categoryName, categoryMissions]) => {
            if (categoryMissions.length === 0) return null;

            const category = categoriesQuery.data?.find(c => c.name === categoryName);

            return (
              <div key={categoryName} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span
                      className="inline-flex h-2 w-2 rounded-full"
                      style={{ backgroundColor: category?.color || '#8b5cf6' }}
                    />
                    {categoryName}
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-800/50 to-transparent" />
                </div>
                <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, categoryMissions)}>
                  <SortableContext items={categoryMissions.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {categoryMissions.map((mission) => (
                        <DraggableTask key={mission.id} id={mission.id}>
                          <div className={selectedTaskIds.has(mission.id) ? 'ring-2 ring-brand-500 rounded-3xl' : ''}>
                            <MissionCard
                              mission={mission}
                              onCycleState={cycleState}
                              onEdit={openEditModal}
                              onDelete={removeMission}
                              onAddSubTask={openAddSubTaskModal}
                              isSelected={selectedTaskIds.has(mission.id)}
                            />
                          </div>
                        </DraggableTask>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={modalTitle}
      >
        <MissionComposer
          defaultValues={
            editingTask
              ? {
                  title: editingTask.title,
                  description: editingTask.description ?? '',
                  taskType: 'DAILY' as const,
                  category: editingTask.category,
                }
              : undefined
          }
          mode={composerMode}
          parentId={addingSubTaskToParent}
          onSubmit={handleSave}
          isSubmitting={createTask.isPending || updateTask.isPending}
        />
      </Modal>
    </div>
  );
};

export default TaskManagementPanel;

