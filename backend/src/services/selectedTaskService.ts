import { query, queryOne } from '../utils/prisma';
import { HttpError } from '../utils/errors';
import { randomUUID } from 'crypto';

interface SelectedTask {
  id: string;
  taskId: string;
  userId: string;
  selectedAt: Date;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  taskType: string;
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
  state: string;
  createdAt: Date;
}

export const getSelectedTasks = async (userId: string) => {
  // Get all selected tasks for this user, ordered by selection order
  const selectedTasks = await query<SelectedTask>(
    `SELECT * FROM SelectedTask 
     WHERE userId = ? 
     ORDER BY \`order\` ASC, selectedAt ASC`,
    [userId]
  );

  if (selectedTasks.length === 0) {
    return [];
  }

  const taskIds = selectedTasks.map(st => st.taskId);
  
  // Get the actual tasks
  const tasks = await query<Task>(
    `SELECT * FROM Task 
     WHERE id IN (${taskIds.map(() => '?').join(',')})
     AND userId = ?
     AND isCancelled = FALSE`,
    [...taskIds, userId]
  );

  // Get current date for entry lookup
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const currentDate = new Date(Date.UTC(year, month, day));

  // Get entries for today
  const entries = await query<TaskEntry>(
    `SELECT * FROM TaskEntry 
     WHERE taskId IN (${taskIds.map(() => '?').join(',')})
     AND DATE(date) = DATE(?)`,
    [...taskIds, currentDate]
  );

  const entryMap = new Map(entries.map(e => [e.taskId, e]));
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const selectedMap = new Map(selectedTasks.map(st => [st.taskId, st]));

  // Build response with task details and current state
  return selectedTasks
    .filter(st => taskMap.has(st.taskId))
    .map(st => {
      const task = taskMap.get(st.taskId)!;
      const entry = entryMap.get(st.taskId);
      
      return {
        id: st.id,
        taskId: task.id,
        order: st.order,
        selectedAt: st.selectedAt,
        title: task.title,
        description: task.description,
        category: task.category,
        parentId: task.parentId,
        currentState: entry?.state ?? 'NOT_STARTED',
        date: currentDate.toISOString(),
      };
    });
};

export const addSelectedTask = async (userId: string, taskId: string) => {
  // Verify task exists and belongs to user
  const task = await queryOne<Task>(
    'SELECT * FROM Task WHERE id = ? AND userId = ? AND isCancelled = FALSE',
    [taskId, userId]
  );

  if (!task) {
    throw new HttpError(404, 'Task not found');
  }

  // Check if already selected
  const existing = await queryOne<SelectedTask>(
    'SELECT * FROM SelectedTask WHERE taskId = ? AND userId = ?',
    [taskId, userId]
  );

  if (existing) {
    return existing;
  }

  // Get max order for this user
  const maxOrderResult = await queryOne<{ maxOrder: number }>(
    'SELECT COALESCE(MAX(`order`), -1) as maxOrder FROM SelectedTask WHERE userId = ?',
    [userId]
  );
  const newOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

  const id = randomUUID();
  const now = new Date();
  
  await query(
    'INSERT INTO SelectedTask (id, taskId, userId, selectedAt, `order`) VALUES (?, ?, ?, ?, ?)',
    [id, taskId, userId, now, newOrder]
  );

  return await queryOne<SelectedTask>('SELECT * FROM SelectedTask WHERE id = ?', [id]);
};

export const removeSelectedTask = async (userId: string, taskId: string) => {
  const selectedTask = await queryOne<SelectedTask>(
    'SELECT * FROM SelectedTask WHERE taskId = ? AND userId = ?',
    [taskId, userId]
  );

  if (!selectedTask) {
    throw new HttpError(404, 'Selected task not found');
  }

  await query('DELETE FROM SelectedTask WHERE id = ?', [selectedTask.id]);
  
  return selectedTask;
};

export const updateSelectedTaskOrder = async (
  userId: string,
  taskOrders: Array<{ taskId: string; order: number }>
) => {
  if (taskOrders.length === 0) {
    return;
  }

  const taskIds = taskOrders.map(to => to.taskId);
  
  // Verify all selected tasks belong to the user
  const userSelectedTasks = await query<{ id: string }>(
    `SELECT id FROM SelectedTask WHERE taskId IN (${taskIds.map(() => '?').join(',')}) AND userId = ?`,
    [...taskIds, userId]
  );

  if (userSelectedTasks.length !== taskIds.length) {
    throw new HttpError(403, 'Some selected tasks do not belong to the user');
  }

  // Update all orders
  await Promise.all(
    taskOrders.map(({ taskId, order }) => {
      return query(
        'UPDATE SelectedTask SET `order` = ? WHERE taskId = ? AND userId = ?',
        [order, taskId, userId]
      );
    })
  );
};

