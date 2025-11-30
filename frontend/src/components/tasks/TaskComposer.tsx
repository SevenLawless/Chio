import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TaskType } from '../../types/task';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { twMerge } from 'tailwind-merge';

const schema = z
  .object({
    title: z.string().min(2, 'Give the task a name'),
    description: z.string().optional(),
    taskType: z.enum(['DAILY', 'ONE_TIME']),
    dueDate: z.string().optional(),
  })
  .refine((values) => (values.taskType === 'ONE_TIME' ? Boolean(values.dueDate) : true), {
    message: 'Pick a date for one-time tasks',
    path: ['dueDate'],
  });

type FormValues = z.infer<typeof schema>;

interface TaskComposerProps {
  defaultValues?: Partial<FormValues>;
  mode: 'create' | 'edit';
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}

const typeLabels: Record<TaskType, string> = {
  DAILY: 'Daily loop',
  ONE_TIME: 'One-time mission',
};

export const TaskComposer = ({ defaultValues, onSubmit, mode, isSubmitting }: TaskComposerProps) => {
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
    },
  });

  const taskType = watch('taskType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Style</p>
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
              <p className="text-sm font-semibold">{typeLabels[type]}</p>
              <p className="text-xs text-white/60">
                {type === 'DAILY' ? 'Loops back every morning' : 'Appears on the selected date'}
              </p>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80" htmlFor="title">
          Title
        </label>
        <Input id="title" placeholder="Write standup outline" {...register('title')} />
        {errors.title && <p className="text-sm text-rose-400">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80" htmlFor="description">
          Notes
        </label>
        <Textarea id="description" rows={3} placeholder="Optional details" {...register('description')} />
      </div>

      {taskType === 'ONE_TIME' && (
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
        {isSubmitting ? 'Saving…' : mode === 'create' ? 'Save task' : 'Update task'}
      </button>
    </form>
  );
};

