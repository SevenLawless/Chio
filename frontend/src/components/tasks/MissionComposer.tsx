import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TaskCategory } from '../../types/task';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

const schema = z.object({
  title: z.string().min(2, 'Give the mission a name'),
  description: z.string().optional(),
  taskType: z.literal('DAILY'),
  category: z.enum(['MAIN', 'MORNING', 'FOOD', 'BOOKS', 'COURSES']).optional(),
  parentId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface MissionComposerProps {
  defaultValues?: Partial<FormValues>;
  mode: 'create' | 'edit' | 'subtask';
  parentId?: string | null;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}

const categoryLabels: Record<TaskCategory, string> = {
  MAIN: 'Main Missions',
  MORNING: 'Morning Missions',
  FOOD: 'Food',
  BOOKS: 'Books',
  COURSES: 'Courses',
};

export const MissionComposer = ({ defaultValues, onSubmit, mode, parentId, isSubmitting }: MissionComposerProps) => {
  const isSubTask = mode === 'subtask' || !!parentId;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      taskType: 'DAILY',
      category: (defaultValues?.category as TaskCategory) ?? 'MAIN',
      parentId: parentId ?? defaultValues?.parentId ?? undefined,
    },
  });

  const handleFormSubmit = (values: FormValues) => {
    // Ensure parentId is passed through
    onSubmit({
      ...values,
      parentId: parentId ?? values.parentId,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Category selector - only show for top-level missions, not sub-tasks */}
      {!isSubTask && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            {...register('category')}
            className="w-full rounded-xl border border-brand-800/30 bg-brand-900/20 px-4 py-3 text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {(['MAIN', 'MORNING', 'FOOD', 'BOOKS', 'COURSES'] as TaskCategory[]).map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-task mode indicator */}
      {isSubTask && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3">
          <p className="text-sm font-medium text-brand-300">Adding a task to this mission</p>
          <p className="text-xs text-white/60">Tasks are checkable items within a mission</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80" htmlFor="title">
          {isSubTask ? 'Task name' : 'Mission name'}
        </label>
        <Input 
          id="title" 
          placeholder={isSubTask ? 'e.g., Review pull requests' : 'e.g., Morning routine'} 
          {...register('title')} 
        />
        {errors.title && <p className="text-sm text-rose-400">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80" htmlFor="description">
          Notes <span className="text-white/40">(optional)</span>
        </label>
        <Textarea id="description" rows={3} placeholder="Any extra details..." {...register('description')} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {isSubmitting 
          ? 'Saving…' 
          : isSubTask 
            ? 'Add task' 
            : mode === 'create' 
              ? 'Create mission' 
              : 'Update mission'}
      </button>
    </form>
  );
};
