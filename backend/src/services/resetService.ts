import { query } from '../utils/prisma';

/**
 * Reset service for daily task cleanup
 * Deletes all TaskEntry records from previous days, keeping only current day's data
 * This should be run daily at 5am UTC to reset all tasks to NOT_STARTED
 */
export const resetDailyTasks = async (): Promise<void> => {
  try {
    // Delete all TaskEntry records where date is before current UTC date
    // This effectively resets all tasks to NOT_STARTED for the new day
    await query(
      'DELETE FROM TaskEntry WHERE DATE(date) < CURDATE()',
      []
    );
    
    console.log('[ResetService] Daily task reset completed - old TaskEntry records deleted');
  } catch (error) {
    console.error('[ResetService] Error resetting daily tasks:', error);
    throw error;
  }
};

