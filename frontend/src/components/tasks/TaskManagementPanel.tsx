import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useCreateTask,
  useDeleteTask,
  useSetTaskState,
  useTasks,
  useUpdateTask,
  useSelectedTasks,
  useCategories,
  useAddSelectedTask,
  useRemoveSelectedTask,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../features/tasks/hooks';
import type { Mission, TaskState, Category } from '../../types/task';
import Modal from '../ui/Modal';
import { MissionComposer } from './MissionComposer';
import { MissionCard } from './MissionCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const TaskManagementPanel = () => {
  const currentDate = new Date();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Mission | null>(null);
  const [addingSubTaskToParent, setAddingSubTaskToParent] = useState<string | null>(null);
  
  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('');
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

  const tasksQuery = useTasks(currentDate);
  const selectedTasksQuery = useSelectedTasks();
  const categoriesQuery = useCategories();
  const createTask = useCreateTask(currentDate);
  const updateTask = useUpdateTask(currentDate);
  const deleteTask = useDeleteTask(currentDate);
  const updateState = useSetTaskState(currentDate);
  const addSelectedTask = useAddSelectedTask();
  const removeSelectedTask = useRemoveSelectedTask();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Selected task IDs (only sub-tasks should be selected)
  const selectedTaskIds = useMemo(() => {
    return new Set(selectedTasksQuery.data?.map((st) => st.taskId) || []);
  }, [selectedTasksQuery.data]);

  // Filter and sort missions (only DAILY missions now)
  const missions = useMemo(() => {
    const filtered = tasksQuery.data?.filter((mission) => !mission.isCancelled && mission.taskType === 'DAILY') ?? [];
    return [...filtered].sort((a, b) => {
      // Sort by category order first (if categories are loaded)
      const categories = categoriesQuery.data || [];
      const categoryA = categories.findIndex((c) => c.name === a.category);
      const categoryB = categories.findIndex((c) => c.name === b.category);
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

  // Handle click to toggle selection
  const handleTaskClick = async (taskId: string) => {
    const isSelected = selectedTaskIds.has(taskId);
    try {
      if (isSelected) {
        await removeSelectedTask.mutateAsync(taskId);
      } else {
        await addSelectedTask.mutateAsync(taskId);
      }
    } catch (error) {
      console.error('Failed to toggle task selection:', error);
    }
  };

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

  const handleSave = async (values: {
    title: string;
    description?: string;
    taskType: string;
    dueDate?: string;
    parentId?: string;
    category?: string;
  }) => {
    try {
      const normalizedDescription =
        values.description && values.description.trim() ? values.description.trim() : undefined;

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

  // Category management functions
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color || '');
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('');
  };

  const handleCategorySave = async () => {
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          categoryId: editingCategory.id,
          payload: { name: categoryName.trim(), color: categoryColor.trim() || null },
        });
      } else {
        await createCategory.mutateAsync({
          name: categoryName.trim(),
          color: categoryColor.trim() || null,
        });
      }
      closeCategoryModal();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleCategoryDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Tasks using this category will need to be reassigned.')) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(categoryId);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Cannot delete category that is in use by tasks');
    }
  };


  const isLoading = tasksQuery.isLoading;

  // Determine modal title and mode
  const modalTitle = editingTask
    ? editingTask.parentId
      ? 'Edit task'
      : 'Edit mission'
    : addingSubTaskToParent
      ? 'Add task'
      : 'New mission';

  const composerMode = editingTask ? 'edit' : addingSubTaskToParent ? 'subtask' : 'create';

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="rounded-3xl border border-brand-800/30 bg-gradient-to-br from-brand-900/40 via-slate-900 to-black p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Task Management</h2>
            <p className="text-sm text-white/60 mt-1">Create and organize your missions and tasks</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateCategoryModal} className="flex items-center gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              New category
            </Button>
            <Button onClick={openCreateModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New mission
            </Button>
          </div>
        </div>
      </div>

      {tasksQuery.isError && (
        <div
          className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6"
          role="alert"
          aria-live="polite"
        >
          <p className="font-semibold text-rose-200">Error loading missions</p>
          <p className="mt-2 text-sm text-rose-300">{(tasksQuery.error as Error).message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-6 text-center">
          <div className="inline-flex items-center gap-2 text-brand-300">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading missions…</span>
          </div>
        </div>
      ) : !tasksQuery.isError && missions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-brand-800/30 bg-brand-900/10 p-10 text-center text-white/70">
          <p>No missions yet.</p>
          <p className="mt-2 text-sm text-brand-300">Click \"New mission\" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unified Tree View: Category -> Missions -> Tasks */}
          {(() => {
            const categories = categoriesQuery.data || [];
            const missionsByCategory: Record<string, Mission[]> = {};
            missions.forEach((mission) => {
              const categoryName = mission.category || 'Uncategorized';
              if (!missionsByCategory[categoryName]) {
                missionsByCategory[categoryName] = [];
              }
              missionsByCategory[categoryName].push(mission);
            });

            // Sort categories by order
            const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
            const orderedCategoryNames: string[] = [
              ...sortedCategories.map((c) => c.name),
              ...Object.keys(missionsByCategory).filter(
                (name) => !categories.some((c) => c.name === name),
              ),
            ];

            return orderedCategoryNames.map((categoryName) => {
              const categoryMissions = missionsByCategory[categoryName];
              if (!categoryMissions || categoryMissions.length === 0) return null;
              const category = categories.find((c) => c.name === categoryName);

              return (
                <div key={categoryName} className="space-y-3">
                  {/* Category Header with Context Menu */}
                  <div
                    className="relative flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-brand-900/20 transition-colors group"
                    onMouseEnter={() => category && setHoveredCategoryId(category.id)}
                    onMouseLeave={() => setHoveredCategoryId(null)}
                  >
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span
                        className="inline-flex h-2 w-2 rounded-full"
                        style={{ backgroundColor: category?.color || '#8b5cf6' }}
                      />
                      {categoryName}
                    </h3>
                    {category && hoveredCategoryId === category.id && (
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => openEditCategoryModal(category)}
                          className="h-7 w-7 p-0"
                          aria-label="Edit category"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleCategoryDelete(category.id)}
                          className="h-7 w-7 p-0"
                          aria-label="Delete category"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Missions (indented) */}
                  <div className="pl-6 space-y-3">
                    {categoryMissions.map((mission) => (
                      <div key={mission.id} className="space-y-2">
                        {/* Mission Card */}
                        <MissionCard
                          mission={mission}
                          onCycleState={cycleState}
                          onEdit={openEditModal}
                          onDelete={removeMission}
                          onAddSubTask={openAddSubTaskModal}
                          category={category}
                          selectedTaskIds={selectedTaskIds}
                          onToggleSelect={handleTaskClick}
                        />
                        {/* Tasks (further indented) - already handled by MissionCard's expanded subTasks */}
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      <Modal open={isModalOpen} onClose={closeModal} title={modalTitle}>
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

      {/* Category Modal */}
      <Modal
        open={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title={editingCategory ? 'Edit Category' : 'New Category'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Category Name</label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Color (optional)</label>
            <Input
              value={categoryColor}
              onChange={(e) => setCategoryColor(e.target.value)}
              placeholder="#8b5cf6 or color name"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeCategoryModal}>
              Cancel
            </Button>
            <Button
              onClick={handleCategorySave}
              disabled={!categoryName.trim() || createCategory.isPending || updateCategory.isPending}
            >
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TaskManagementPanel;