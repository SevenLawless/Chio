import { addDays, eachDayOfInterval, formatISO, isValid, parseISO, startOfDay } from 'date-fns';
import { query } from '../utils/prisma';
import { HttpError } from '../utils/errors';
import { TaskState, TaskType } from './taskService';

const parseDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    throw new HttpError(400, 'Invalid date format');
  }

  return startOfDay(parsed);
};

const defaultRange = () => {
  const end = startOfDay(new Date());
  const start = addDays(end, -6);
  return { start, end };
};

export const getTaskStats = async (userId: string, startInput?: string, endInput?: string) => {
  const parsedStart = parseDate(startInput);
  const parsedEnd = parseDate(endInput);
  const { start, end } = {
    start: parsedStart ?? defaultRange().start,
    end: parsedEnd ?? defaultRange().end,
  };

  if (start > end) {
    throw new HttpError(400, 'Start date must be before end date');
  }

  const inclusiveEnd = addDays(end, 1);

  // Get all tasks and entries for the date range
  const [dailyTasks, oneTimeTasks, entries] = await Promise.all([
    query<{ id: string }>(
      `SELECT id FROM Task 
       WHERE userId = ? AND taskType = ? AND isCancelled = FALSE`,
      [userId, TaskType.DAILY]
    ),
    query<{ id: string; dueDate: Date }>(
      `SELECT id, dueDate FROM Task 
       WHERE userId = ? AND taskType = ? AND dueDate >= ? AND dueDate < ?`,
      [userId, TaskType.ONE_TIME, start, inclusiveEnd]
    ),
    query<{ taskId: string; date: Date; state: TaskState }>(
      `SELECT te.taskId, te.date, te.state 
       FROM TaskEntry te 
       INNER JOIN Task t ON te.taskId = t.id 
       WHERE t.userId = ? AND te.date >= ? AND te.date < ?`,
      [userId, start, inclusiveEnd]
    ),
  ]);

  const dailyTaskCount = dailyTasks.length;
  const oneTimeByDay = oneTimeTasks.reduce<Record<string, number>>((acc, task) => {
    if (!task.dueDate) {
      return acc;
    }
    const key = formatISO(task.dueDate, { representation: 'date' });
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const entriesByDay = entries.reduce<Record<string, TaskState[]>>((acc, entry) => {
    const key = formatISO(entry.date, { representation: 'date' });
    acc[key] = acc[key] ?? [];
    acc[key].push(entry.state);
    return acc;
  }, {});

  const days = eachDayOfInterval({ start, end });
  const dailyBreakdown = days.map((day) => {
    const key = formatISO(day, { representation: 'date' });
    const baseCount = dailyTaskCount + (oneTimeByDay[key] ?? 0);

    const counts: Record<TaskState, number> = {
      [TaskState.NOT_STARTED]: baseCount,
      [TaskState.COMPLETED]: 0,
      [TaskState.SKIPPED]: 0,
    };

    for (const state of entriesByDay[key] ?? []) {
      if (counts[TaskState.NOT_STARTED] > 0 && state !== TaskState.NOT_STARTED) {
        counts[TaskState.NOT_STARTED] -= 1;
      }
      counts[state] = (counts[state] ?? 0) + 1;
    }

    return {
      date: key,
      totals: {
        completed: counts[TaskState.COMPLETED],
        skipped: counts[TaskState.SKIPPED],
        notStarted: counts[TaskState.NOT_STARTED],
        total: baseCount,
      },
    };
  });

  const aggregates = dailyBreakdown.reduce(
    (acc, day) => {
      acc.completed += day.totals.completed;
      acc.skipped += day.totals.skipped;
      acc.notStarted += day.totals.notStarted;
      acc.total += day.totals.total;
      return acc;
    },
    { completed: 0, skipped: 0, notStarted: 0, total: 0 },
  );

  return {
    range: {
      start: formatISO(start, { representation: 'date' }),
      end: formatISO(end, { representation: 'date' }),
    },
    aggregates,
    dailyBreakdown,
  };
};
