-- Add parentId column to Task table for mission hierarchy support
-- Top-level items are "missions", items with parentId are "tasks" (sub-items)

ALTER TABLE `Task` ADD COLUMN `parentId` VARCHAR(191) NULL AFTER `userId`;

-- Add foreign key constraint for self-referencing hierarchy
ALTER TABLE `Task` ADD CONSTRAINT `fk_task_parent` 
  FOREIGN KEY (`parentId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for efficient parent lookups
CREATE INDEX `Task_parentId_idx` ON `Task`(`parentId`);

