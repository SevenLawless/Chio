import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TaskType } from '../../types/task';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { twMerge } from 'tailwind-merge';

const schema = z
  .object({
    title: z.string().min(2, 'Give the mission a name'),
    description: z.string().optional(),
    taskType: z.enum(['DAILY', 'ONE_TIME']),
    dueDate: z.string().optional(),
    parentId: z.string().optional(),
  })
  .refine((values) => {
    // One-time missions need a due date, but sub-tasks don't
    if (values.taskType === 'ONE_TIME' && !values.parentId) {
      return Boolean(values.dueDate);
    }
    return true;
  }, {
    message: 'Pick a date for one-time missions',
    path: ['dueDate'],
  });

type FormValues = z.infer<typeof schema>;

interface MissionComposerProps {
  defaultValues?: Partial<FormValues>;
  mode: 'create' | 'edit' | 'subtask';
  parentId?: string | null;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}

const typeLabels: Record<TaskType, { title: string; desc: string }> = {
  DAILY: { 
    title: 'Daily mission', 
    desc: 'Loops back every morning' 
  },
  ONE_TIME: { 
    title: 'One-time mission', 
    desc: 'Appears on the selected date' 
  },
};

export const MissionComposer = ({ defaultValues, onSubmit, mode, parentId, isSubmitting }: MissionComposerProps) => {
  const isSubTask = mode === 'subtask' || !!parentId;
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      taskType: (defaultValues?.taskType as TaskType) ?? 'DAILY',
      dueDate: defaultValues?.dueDate ?? '',
      parentId: parentId ?? defaultValues?.parentId ?? undefined,
    },
  });

  const taskType = watch('taskType');

  const handleFormSubmit = (values: FormValues) => {
    // Ensure parentId is passed through
    onSubmit({
      ...values,
      parentId: parentId ?? values.parentId,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Hidden parentId field */}
      {parentId && <input type="hidden" {...register('parentId')} value={parentId} />}

      {/* Type selector - only show for top-level missions, not sub-tasks */}
      {!isSubTask && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Mission type</p>
          <div className="grid grid-cols-2 gap-3">
            {(['DAILY', 'ONE_TIME'] as TaskType[]).map((type) => (
              <label
                key={type}
                className={twMerge(
                  'cursor-pointer rounded-2xl border border-brand-800/30 px-4 py-3 transition',
                  taskType === type ? 'border-brand-500 bg-brand-500/20 text-white' : 'text-white/60 hover:border-brand-700/40 hover:bg-brand-900/10',
                )}
              >
                <input type="radio" value={type} className="hidden" {...register('taskType')} />
                <p className="text-sm font-semibold">{typeLabels[type].title}</p>
                <p className="text-xs text-white/60">{typeLabels[type].desc}</p>
              </label>
            ))}
          </div>
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

      {/* Due date only for ONE_TIME top-level missions */}
      {taskType === 'ONE_TIME' && !isSubTask && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="dueDate">
            Appears on
          </label>
          <Input id="dueDate" type="date" {...register('dueDate')} />
          {errors.dueDate && <p className="text-sm text-rose-400">{errors.dueDate.message}</p>}
        </div>
      )}

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

// Export legacy alias for backward compatibility
export { MissionComposer as TaskComposer };
