import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../features/tasks/hooks';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import type { Category } from '../../types/task';

interface CategoryManagerProps {
  onCategorySelect?: (categoryId: string) => void;
}

export const CategoryManager = (_props: CategoryManagerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('');

  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('');
  };

  const handleSave = async () => {
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
      closeModal();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = async (categoryId: string) => {
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

  if (isLoading) {
    return <div className="text-white/60">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Categories</h3>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      <div className="space-y-2">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 rounded-xl border border-brand-800/20 bg-brand-900/10 p-3 hover:bg-brand-900/20 transition"
          >
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: category.color || '#8b5cf6' }}
            />
            <span className="flex-1 text-white font-medium">{category.name}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => openEditModal(category)}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDelete(category.id)}
                className="h-7 w-7 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
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
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
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

