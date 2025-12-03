import { addDays, eachDayOfInterval, formatISO, isValid, parseISO, startOfDay } from 'date-fns';
import { query } from '../utils/prisma';
import { HttpError } from '../utils/errors';
import { TaskState, TaskType } from './taskService';

const parseDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  // Handle date-only strings (YYYY-MM-DD format) the same way as taskService
  let parsed: Date;
  
  // Check if it's a date-only string (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // For date-only strings, parse as local date by creating a date object directly
    // This avoids timezone conversion issues
    const [year, month, day] = value.split('-').map(Number);
    parsed = new Date(year, month - 1, day); // month is 0-indexed
  } else {
    // For full ISO strings, use parseISO
    parsed = parseISO(value);
  }
  
  if (!isValid(parsed)) {
    throw new HttpError(400, 'Invalid date format');
  }

  return startOfDay(parsed);
};

const defaultRange = () => {
  const end = startOfDay(new Date());
  const start = startOfDay(parseISO('2025-11-30'));
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

    // Count entries by state (entries only exist for tasks that have been interacted with)
    const dayEntries = entriesByDay[key] ?? [];
    const entryCounts: Record<TaskState, number> = {
      [TaskState.NOT_STARTED]: 0,
      [TaskState.COMPLETED]: 0,
      [TaskState.SKIPPED]: 0,
    };

    // Count how many entries exist for each state
    // Limit to baseCount to handle edge cases where entries might exceed tasks
    const validEntries = dayEntries.slice(0, baseCount);
    for (const state of validEntries) {
      entryCounts[state] = (entryCounts[state] ?? 0) + 1;
    }

    // Calculate final counts:
    // - COMPLETED and SKIPPED come from entries
    // - NOT_STARTED = baseCount - entries with states (COMPLETED + SKIPPED)
    const completed = entryCounts[TaskState.COMPLETED];
    const skipped = entryCounts[TaskState.SKIPPED];
    const entriesWithState = completed + skipped;
    const notStarted = Math.max(0, baseCount - entriesWithState);

    return {
      date: key,
      totals: {
        completed,
        skipped,
        notStarted,
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
