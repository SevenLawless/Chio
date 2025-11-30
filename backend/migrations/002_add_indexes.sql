-- Add indexes for better query performance
-- Note: MySQL doesn't support IF NOT EXISTS for CREATE INDEX
-- Duplicate index errors are handled gracefully by the migration system

-- Index on Task.userId for faster user task lookups
CREATE INDEX `idx_task_userId` ON `Task`(`userId`);

-- Index on Task.taskType and isCancelled for filtered queries
CREATE INDEX `idx_task_type_cancelled` ON `Task`(`taskType`, `isCancelled`);

-- Index on Task.dueDate for ONE_TIME task queries
CREATE INDEX `idx_task_dueDate` ON `Task`(`dueDate`);

-- Index on TaskEntry.taskId for entry lookups
CREATE INDEX `idx_taskentry_taskId` ON `TaskEntry`(`taskId`);

-- Composite index for TaskEntry date range queries
CREATE INDEX `idx_taskentry_date_taskId` ON `TaskEntry`(`date`, `taskId`);

