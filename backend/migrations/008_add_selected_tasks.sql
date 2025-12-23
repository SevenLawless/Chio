-- Add SelectedTask table to track which tasks are currently selected/active
-- This allows users to focus on specific tasks for the day

CREATE TABLE IF NOT EXISTS `SelectedTask` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `taskId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `selectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `order` INT NOT NULL DEFAULT 0,
  UNIQUE KEY `SelectedTask_taskId_userId_key` (`taskId`, `userId`),
  FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `SelectedTask_userId_idx` (`userId`),
  INDEX `SelectedTask_taskId_idx` (`taskId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

