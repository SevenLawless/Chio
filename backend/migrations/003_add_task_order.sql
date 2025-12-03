-- Add order field to Task table for custom task ordering

ALTER TABLE `Task` 
ADD COLUMN `order` INT NOT NULL DEFAULT 0 AFTER `isCancelled`;

-- Add index for efficient sorting by user and order
CREATE INDEX `Task_userId_order_idx` ON `Task` (`userId`, `order`);

-- Note: Existing tasks will have order = 0
-- Order will be properly set when:
-- 1. New tasks are created (they get max order + 1)
-- 2. Tasks are reordered via drag-and-drop
-- This avoids complex window function queries that may not work on all MySQL versions

