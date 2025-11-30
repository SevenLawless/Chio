import { format, parseISO } from 'date-fns';

export const formatDateParam = (date: Date | string) => {
  const value = typeof date === 'string' ? parseISO(date) : date;
  const iso = value.toISOString();
  return iso;
};

export const formatDayLabel = (date: string) => format(parseISO(date), 'EEE, MMM d');

export const formatRangeLabel = (start: string, end: string) => `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d')}`;

