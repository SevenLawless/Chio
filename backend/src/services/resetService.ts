import { query } from '../utils/prisma';

/**
 * Reset service for daily task cleanup
 * Resets all selected tasks to NOT_STARTED at 5am daily
 * This should be run daily at 5am UTC
 */
export const resetSelectedTasks = async (): Promise<void> => {
  try {
    // Get current UTC date
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const currentDate = new Date(Date.UTC(year, month, day));

    // Get all selected tasks
    const selectedTasks = await query<{ taskId: string }>(
      'SELECT taskId FROM SelectedTask',
      []
    );

    if (selectedTasks.length === 0) {
      console.log('[ResetService] No selected tasks to reset');
      return;
    }

    const taskIds = selectedTasks.map(st => st.taskId);

    // Reset all selected tasks to NOT_STARTED for today
    // Delete existing entries for today and let them default to NOT_STARTED
    await query(
      `DELETE FROM TaskEntry 
       WHERE taskId IN (${taskIds.map(() => '?').join(',')})
       AND DATE(date) = DATE(?)`,
      [...taskIds, currentDate]
    );
    
    console.log(`[ResetService] Reset ${taskIds.length} selected tasks to NOT_STARTED`);
  } catch (error) {
    console.error('[ResetService] Error resetting selected tasks:', error);
    throw error;
  }
};

