import { format, parseISO, startOfDay } from 'date-fns';

export const formatDateParam = (date: Date | string) => {
  const value = typeof date === 'string' ? parseISO(date) : date;
  // Use startOfDay to ensure we're working with the local date boundary
  const localDate = startOfDay(value);
  // Format as YYYY-MM-DD to send date-only string (avoids timezone issues)
  return format(localDate, 'yyyy-MM-dd');
};

export const formatDayLabel = (date: string) => format(parseISO(date), 'EEE, MMM d');

export const formatRangeLabel = (start: string, end: string) => `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d')}`;

