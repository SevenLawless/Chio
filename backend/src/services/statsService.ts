import { addDays, eachDayOfInterval, formatISO, isValid, parseISO, startOfDay } from 'date-fns';
import { query } from '../utils/prisma';
import { HttpError } from '../utils/errors';
import { TaskState, TaskType } from './taskService';

// Day status thresholds
const GOOD_THRESHOLD = 0.7; // 70%
const FLAWLESS_THRESHOLD = 1.0; // 100%

export type DayStatus = 'NONE' | 'GOOD' | 'FLAWLESS';

const getDayStatus = (completed: number, total: number): DayStatus => {
  if (total === 0) return 'NONE';
  const percentage = completed / total;
  if (percentage >= FLAWLESS_THRESHOLD) return 'FLAWLESS';
  if (percentage >= GOOD_THRESHOLD) return 'GOOD';
  return 'NONE';
};

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

  // Get all tasks (including sub-tasks) and entries for the date range
  // Each task/sub-task counts individually toward completion
  const [dailyTasks, oneTimeTasks, entries] = await Promise.all([
    query<{ id: string; parentId: string | null }>(
      `SELECT id, parentId FROM Task 
       WHERE userId = ? AND taskType = ? AND isCancelled = FALSE`,
      [userId, TaskType.DAILY]
    ),
    query<{ id: string; dueDate: Date; parentId: string | null }>(
      `SELECT id, dueDate, parentId FROM Task 
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

  // Count all tasks (missions + sub-tasks) - each counts individually
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

    // Calculate day status based on completion percentage
    const status = getDayStatus(completed, baseCount);

    return {
      date: key,
      totals: {
        completed,
        skipped,
        notStarted,
        total: baseCount,
      },
      status,
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

  // Calculate streaks (consecutive days with GOOD or FLAWLESS status)
  // Reverse the breakdown to calculate from most recent
  const reversedBreakdown = [...dailyBreakdown].reverse();
  
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let countingCurrentStreak = true;

  for (const day of reversedBreakdown) {
    const isGoodDay = day.status === 'GOOD' || day.status === 'FLAWLESS';
    
    if (isGoodDay) {
      tempStreak++;
      if (countingCurrentStreak) {
        currentStreak = tempStreak;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      // Reset temp streak, stop counting current streak
      countingCurrentStreak = false;
      tempStreak = 0;
    }
  }

  // Also calculate from the beginning to find best streaks we might have missed
  tempStreak = 0;
  for (const day of dailyBreakdown) {
    const isGoodDay = day.status === 'GOOD' || day.status === 'FLAWLESS';
    if (isGoodDay) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Count total good and flawless days
  const goodDays = dailyBreakdown.filter(d => d.status === 'GOOD').length;
  const flawlessDays = dailyBreakdown.filter(d => d.status === 'FLAWLESS').length;

  return {
    range: {
      start: formatISO(start, { representation: 'date' }),
      end: formatISO(end, { representation: 'date' }),
    },
    aggregates,
    dailyBreakdown,
    streaks: {
      current: currentStreak,
      best: bestStreak,
    },
    dayStats: {
      good: goodDays,
      flawless: flawlessDays,
      total: dailyBreakdown.length,
    },
  };
};
