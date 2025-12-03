import { addDays, isValid, parseISO, startOfDay } from 'date-fns';
import { query, queryOne } from '../utils/prisma';
import { HttpError } from '../utils/errors';
import { randomUUID } from 'crypto';

// Type definitions
export enum TaskType {
  DAILY = 'DAILY',
  ONE_TIME = 'ONE_TIME',
}

export enum TaskState {
  NOT_STARTED = 'NOT_STARTED',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  taskType: TaskType;
  dueDate: Date | null;
  isCancelled: boolean;
  order: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskEntry {
  id: string;
  taskId: string;
  date: Date;
  state: TaskState;
  createdAt: Date;
}

const normalizeDate = (dateInput?: string) => {
  if (!dateInput) {
    return startOfDay(new Date());
  }

  // Handle date-only strings (YYYY-MM-DD format)
  // parseISO treats date-only strings as UTC midnight, but we want local date
  // So we parse it and then use startOfDay to ensure we get the local date boundary
  let parsed: Date;
  
  // Check if it's a date-only string (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    // For date-only strings, parse as local date by creating a date object directly
    // This avoids timezone conversion issues
    const [year, month, day] = dateInput.split('-').map(Number);
    parsed = new Date(year, month - 1, day); // month is 0-indexed
  } else {
    // For full ISO strings, use parseISO
    parsed = parseISO(dateInput);
  }
  
  if (!isValid(parsed)) {
    throw new HttpError(400, 'Invalid date format');
  }
  
  // Validate date is not too far in the past or future
  const now = new Date();
  const minDate = new Date('1970-01-01');
  const maxDate = new Date('2100-12-31');
  
  if (parsed < minDate || parsed > maxDate) {
    throw new HttpError(400, 'Date must be between 1970 and 2100');
  }

  // Always normalize to start of day to ensure consistent date boundaries
  return startOfDay(parsed);
};

export const listTasksForDate = async (userId: string, dateInput?: string) => {
  const targetDate = normalizeDate(dateInput);
  const nextDate = addDays(targetDate, 1);

  // Get tasks: DAILY tasks that aren't cancelled OR ONE_TIME tasks for this exact date
  // For ONE_TIME tasks, we use DATE() function to ensure exact date match (ignoring time component)
  const tasks = await query<Task>(
    `SELECT * FROM Task 
     WHERE userId = ? 
     AND (
       (taskType = 'DAILY' AND isCancelled = FALSE)
       OR (taskType = 'ONE_TIME' AND DATE(dueDate) = DATE(?))
     )
     ORDER BY taskType ASC, \`order\` ASC, createdAt ASC`,
    [userId, targetDate]
  );

  // Get entries for these tasks on this exact date only
  // Using DATE() function to ensure exact date match (ignoring time component)
  const taskIds = tasks.map(t => t.id);
  const entries: TaskEntry[] = taskIds.length > 0
    ? await query<TaskEntry>(
        `SELECT * FROM TaskEntry 
         WHERE taskId IN (${taskIds.map(() => '?').join(',')})
         AND DATE(date) = DATE(?)`,
        [...taskIds, targetDate]
      )
    : [];

  const entryMap = new Map(entries.map(e => [e.taskId, e]));

  return tasks.map((task) => {
    const entry = entryMap.get(task.id);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      dueDate: task.dueDate,
      isCancelled: task.isCancelled,
      order: task.order,
      currentState: entry?.state ?? TaskState.NOT_STARTED,
      date: targetDate.toISOString(),
      updatedAt: task.updatedAt,
      createdAt: task.createdAt,
    };
  });
};

interface TaskInput {
  title: string;
  description?: string | null;
  taskType: TaskType;
  dueDate?: string | null;
}

export const createTask = async (userId: string, input: TaskInput) => {
  const title = input.title?.trim();
  
  if (!title || title.length === 0) {
    throw new HttpError(400, 'Title is required');
  }
  
  if (title.length > 200) {
    throw new HttpError(400, 'Title must be 200 characters or less');
  }

  const id = randomUUID();
  const description = input.description?.trim() || null;
  
  if (description && description.length > 1000) {
    throw new HttpError(400, 'Description must be 1000 characters or less');
  }

  const now = new Date();
  
  // Get the maximum order value for this user to set the new task's order
  const maxOrderResult = await queryOne<{ maxOrder: number }>(
    'SELECT COALESCE(MAX(`order`), -1) as maxOrder FROM Task WHERE userId = ?',
    [userId]
  );
  const newOrder = (maxOrderResult?.maxOrder ?? -1) + 1;
  
  if (input.taskType === TaskType.ONE_TIME) {
    if (!input.dueDate) {
      throw new HttpError(400, 'One-time tasks require a due date');
    }
    const dueDate = normalizeDate(input.dueDate);
    
    await query(
      'INSERT INTO Task (id, title, description, taskType, dueDate, userId, isCancelled, `order`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, TaskType.ONE_TIME, dueDate, userId, false, newOrder, now, now]
    );
  } else {
    await query(
      'INSERT INTO Task (id, title, description, taskType, userId, isCancelled, `order`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, TaskType.DAILY, userId, false, newOrder, now, now]
    );
  }

  return await queryOne<Task>('SELECT * FROM Task WHERE id = ?', [id]);
};

export const updateTask = async (userId: string, taskId: string, input: Partial<TaskInput>) => {
  const task = await queryOne<Task>(
    'SELECT * FROM Task WHERE id = ? AND userId = ?',
    [taskId, userId]
  );

  if (!task) {
    throw new HttpError(404, 'Task not found');
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title || title.length === 0) {
      throw new HttpError(400, 'Title cannot be empty');
    }
    if (title.length > 200) {
      throw new HttpError(400, 'Title must be 200 characters or less');
    }
    updates.push('title = ?');
    values.push(title);
  }
  
  if (input.description !== undefined) {
    const description = input.description?.trim() || null;
    if (description && description.length > 1000) {
      throw new HttpError(400, 'Description must be 1000 characters or less');
    }
    updates.push('description = ?');
    values.push(description);
  }

  if (task.taskType === TaskType.ONE_TIME && input.dueDate) {
    updates.push('dueDate = ?');
    values.push(normalizeDate(input.dueDate));
  }

  if (updates.length === 0) {
    return task;
  }

  // Always update the updatedAt timestamp
  updates.push('updatedAt = CURRENT_TIMESTAMP(3)');
  values.push(taskId);
  await query(
    `UPDATE Task SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return await queryOne<Task>('SELECT * FROM Task WHERE id = ?', [taskId]);
};

export const deleteTask = async (userId: string, taskId: string) => {
  const task = await queryOne<Task>(
    'SELECT * FROM Task WHERE id = ? AND userId = ?',
    [taskId, userId]
  );

  if (!task) {
    throw new HttpError(404, 'Task not found');
  }

  if (task.taskType === TaskType.DAILY) {
    await query(
      'UPDATE Task SET isCancelled = ? WHERE id = ?',
      [true, taskId]
    );
    return await queryOne<Task>('SELECT * FROM Task WHERE id = ?', [taskId]);
  }

  await query('DELETE FROM Task WHERE id = ?', [taskId]);
  return task;
};

export const setTaskState = async (
  userId: string,
  taskId: string,
  state: TaskState,
  dateInput?: string,
) => {
  const task = await queryOne<Task>(
    'SELECT * FROM Task WHERE id = ? AND userId = ?',
    [taskId, userId]
  );

  if (!task) {
    throw new HttpError(404, 'Task not found');
  }

  const targetDate = normalizeDate(dateInput);

  // Check if entry exists for this exact date
  // Using DATE() function to ensure exact date match (ignoring time component)
  const existing = await queryOne<TaskEntry>(
    'SELECT * FROM TaskEntry WHERE taskId = ? AND DATE(date) = DATE(?)',
    [taskId, targetDate]
  );

  if (existing) {
    await query(
      'UPDATE TaskEntry SET state = ? WHERE taskId = ? AND DATE(date) = DATE(?)',
      [state, taskId, targetDate]
    );
  } else {
    const entryId = randomUUID();
    const now = new Date();
    await query(
      'INSERT INTO TaskEntry (id, taskId, date, state, createdAt) VALUES (?, ?, ?, ?, ?)',
      [entryId, taskId, targetDate, state, now]
    );
  }

  const entry = await queryOne<TaskEntry>(
    'SELECT * FROM TaskEntry WHERE taskId = ? AND DATE(date) = DATE(?)',
    [taskId, targetDate]
  );

  return {
    taskId: task.id,
    state: entry!.state,
    date: targetDate.toISOString(),
    updatedAt: entry!.createdAt,
  };
};

export const updateTaskOrder = async (userId: string, taskOrders: Array<{ taskId: string; order: number }>) => {
  // Verify all tasks belong to the user
  const taskIds = taskOrders.map(to => to.taskId);
  if (taskIds.length === 0) {
    return;
  }

  const userTasks = await query<{ id: string }>(
    `SELECT id FROM Task WHERE id IN (${taskIds.map(() => '?').join(',')}) AND userId = ?`,
    [...taskIds, userId]
  );

  if (userTasks.length !== taskIds.length) {
    throw new HttpError(403, 'Some tasks do not belong to the user');
  }

  // Update all task orders in a transaction-like manner
  // Using Promise.all for parallel updates
  await Promise.all(
    taskOrders.map(({ taskId, order }) =>
      query('UPDATE Task SET `order` = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND userId = ?', [
        order,
        taskId,
        userId,
      ])
    )
  );
};
