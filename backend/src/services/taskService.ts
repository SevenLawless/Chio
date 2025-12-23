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
  parentId: string | null;
  category: string;
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

// Get current UTC date at start of day
const getCurrentUTCDate = () => {
  const now = new Date();
  // Get UTC date components
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  // Create date at UTC midnight
  return new Date(Date.UTC(year, month, day));
};

const normalizeDate = (dateInput?: string) => {
  // Always use current UTC date - no date input allowed
  return getCurrentUTCDate();
};

export const listTasksForDate = async (userId: string, dateInput?: string) => {
  // Always use current UTC date - enforce single-day storage
  const targetDate = normalizeDate(dateInput);

  // Get all missions (top-level, parentId IS NULL): DAILY that aren't cancelled
  // Only DAILY missions are supported now (no ONE_TIME)
  // Sort by category order from Category table, then by task order
  const missions = await query<Task>(
    `SELECT t.* FROM Task t
     LEFT JOIN Category c ON t.category = c.name AND c.userId = t.userId
     WHERE t.userId = ? 
     AND t.parentId IS NULL
     AND t.taskType = 'DAILY'
     AND t.isCancelled = FALSE
     ORDER BY 
       COALESCE(c.\`order\`, 999) ASC,
       t.\`order\` ASC, 
       t.createdAt ASC`,
    [userId]
  );

  // Get all sub-tasks (tasks with parentId) for these missions
  const missionIds = missions.map(m => m.id);
  const subTasks: Task[] = missionIds.length > 0
    ? await query<Task>(
        `SELECT * FROM Task 
         WHERE parentId IN (${missionIds.map(() => '?').join(',')})
         AND userId = ?
         AND isCancelled = FALSE
         ORDER BY \`order\` ASC, createdAt ASC`,
        [...missionIds, userId]
      )
    : [];

  // Get all task IDs (missions + sub-tasks) for entry lookup
  const allTaskIds = [...missionIds, ...subTasks.map(st => st.id)];
  
  // Get entries for all tasks on this exact date
  const entries: TaskEntry[] = allTaskIds.length > 0
    ? await query<TaskEntry>(
        `SELECT * FROM TaskEntry 
         WHERE taskId IN (${allTaskIds.map(() => '?').join(',')})
         AND DATE(date) = DATE(?)`,
        [...allTaskIds, targetDate]
      )
    : [];

  const entryMap = new Map(entries.map(e => [e.taskId, e]));

  // Group sub-tasks by parent
  const subTasksByParent = subTasks.reduce<Record<string, Task[]>>((acc, task) => {
    const parentId = task.parentId!;
    acc[parentId] = acc[parentId] ?? [];
    acc[parentId].push(task);
    return acc;
  }, {});

  // Build response with nested sub-tasks
  return missions.map((mission) => {
    const entry = entryMap.get(mission.id);
    const missionSubTasks = subTasksByParent[mission.id] ?? [];
    
    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      taskType: mission.taskType,
      dueDate: mission.dueDate,
      isCancelled: mission.isCancelled,
      order: mission.order,
      parentId: mission.parentId,
      category: mission.category,
      currentState: entry?.state ?? TaskState.NOT_STARTED,
      date: targetDate.toISOString(),
      updatedAt: mission.updatedAt,
      createdAt: mission.createdAt,
      subTasks: missionSubTasks.map((subTask) => {
        const subEntry = entryMap.get(subTask.id);
        return {
          id: subTask.id,
          title: subTask.title,
          description: subTask.description,
          taskType: subTask.taskType,
          dueDate: subTask.dueDate,
          isCancelled: subTask.isCancelled,
          order: subTask.order,
          parentId: subTask.parentId,
          currentState: subEntry?.state ?? TaskState.NOT_STARTED,
          date: targetDate.toISOString(),
          updatedAt: subTask.updatedAt,
          createdAt: subTask.createdAt,
        };
      }),
    };
  });
};

interface TaskInput {
  title: string;
  description?: string | null;
  taskType: TaskType;
  dueDate?: string | null;
  parentId?: string | null;
  category?: string;
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
  const parentId = input.parentId || null;
  // Default to 'MAIN' category if not provided, or inherit from parent for sub-tasks
  let category: string = input.category || 'MAIN';
  
  if (description && description.length > 1000) {
    throw new HttpError(400, 'Description must be 1000 characters or less');
  }

  // If creating a sub-task, inherit category from parent
  if (parentId) {
    const parentTask = await queryOne<Task>(
      'SELECT * FROM Task WHERE id = ? AND userId = ?',
      [parentId, userId]
    );
    if (!parentTask) {
      throw new HttpError(404, 'Parent mission not found');
    }
    if (parentTask.parentId) {
      throw new HttpError(400, 'Cannot create sub-task under another sub-task');
    }
    // Inherit category from parent
    category = parentTask.category;
  }


  const now = new Date();
  
  // Get the maximum order value for this user to set the new task's order
  // For sub-tasks, get max order within the parent
  const maxOrderResult = parentId
    ? await queryOne<{ maxOrder: number }>(
        'SELECT COALESCE(MAX(`order`), -1) as maxOrder FROM Task WHERE parentId = ? AND userId = ?',
        [parentId, userId]
      )
    : await queryOne<{ maxOrder: number }>(
        'SELECT COALESCE(MAX(`order`), -1) as maxOrder FROM Task WHERE userId = ? AND parentId IS NULL',
        [userId]
      );
  const newOrder = (maxOrderResult?.maxOrder ?? -1) + 1;
  
  // Only DAILY tasks are supported now
  await query(
    'INSERT INTO Task (id, title, description, taskType, userId, parentId, category, isCancelled, `order`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, title, description, TaskType.DAILY, userId, parentId, category, false, newOrder, now, now]
  );

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

  if (input.category !== undefined) {
    // Only allow category updates for top-level missions (not sub-tasks)
    if (!task.parentId) {
      updates.push('category = ?');
      values.push(input.category);
    }
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

  // Always use current UTC date
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

  // Auto-complete parent mission if all sub-tasks are completed
  if (task.parentId) {
    const siblings = await query<{ id: string; state: TaskState | null }>(
      `SELECT t.id, te.state FROM Task t
       LEFT JOIN TaskEntry te ON t.id = te.taskId AND DATE(te.date) = DATE(?)
       WHERE t.parentId = ? AND t.isCancelled = FALSE`,
      [targetDate, task.parentId]
    );

    const allDone = siblings.length > 0 && siblings.every(
      s => s.state === TaskState.COMPLETED
    );

    if (allDone) {
      // Check if parent entry exists for this date
      const parentEntry = await queryOne<TaskEntry>(
        'SELECT * FROM TaskEntry WHERE taskId = ? AND DATE(date) = DATE(?)',
        [task.parentId, targetDate]
      );

      if (parentEntry) {
        await query(
          'UPDATE TaskEntry SET state = ? WHERE taskId = ? AND DATE(date) = DATE(?)',
          [TaskState.COMPLETED, task.parentId, targetDate]
        );
      } else {
        const parentEntryId = randomUUID();
        const now = new Date();
        await query(
          'INSERT INTO TaskEntry (id, taskId, date, state, createdAt) VALUES (?, ?, ?, ?, ?)',
          [parentEntryId, task.parentId, targetDate, TaskState.COMPLETED, now]
        );
      }
    }
  }

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
