-- Add order field to Task table for custom task ordering
ALTER TABLE `Task` 
ADD COLUMN `order` INT NOT NULL DEFAULT 0 AFTER `isCancelled`;

-- Add index for efficient sorting by user and order
CREATE INDEX `Task_userId_order_idx` ON `Task` (`userId`, `order`);

