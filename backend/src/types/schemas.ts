import { z } from 'zod';
import { TaskState, TaskType } from '../services/taskService';

// Flexible date string validator (accepts both ISO datetime and date-only formats)
const dateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' }
);

export const authSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be 50 characters or less'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  }),
});

export const taskQuerySchema = z.object({
  query: z
    .object({
      date: dateString.optional(),
    })
    .optional(),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
    description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
    taskType: z.nativeEnum(TaskType),
    dueDate: dateString.optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: z.string().max(200, 'Title must be 200 characters or less').optional(),
      description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
      dueDate: dateString.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
  params: z.object({
    taskId: z.string().uuid(),
  }),
});

export const deleteTaskSchema = z.object({
  params: z.object({
    taskId: z.string().uuid(),
  }),
});

export const setTaskStateSchema = z.object({
  params: z.object({
    taskId: z.string().uuid(),
  }),
  body: z.object({
    state: z.nativeEnum(TaskState),
    date: dateString.optional(),
  }),
});

export const statsQuerySchema = z.object({
  query: z.object({
    start: dateString.optional(),
    end: dateString.optional(),
  }),
});

export const updateTaskOrderSchema = z.object({
  body: z.array(
    z.object({
      taskId: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ).min(1),
});

