-- Make categories dynamic - allow user-created categories
-- Add Category table for user-defined categories

CREATE TABLE IF NOT EXISTS `Category` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `color` VARCHAR(191) NULL,
  `order` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `Category_userId_name_key` (`userId`, `name`),
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `Category_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Convert Task.category from ENUM to VARCHAR to support dynamic categories
-- Step 1: Add a temporary new column for category name
ALTER TABLE `Task` ADD COLUMN `categoryName` VARCHAR(191) NULL AFTER `category`;

-- Step 2: Copy existing ENUM values to the new column
UPDATE `Task` SET `categoryName` = `category`;

-- Step 3: Drop the old ENUM column
ALTER TABLE `Task` DROP COLUMN `category`;

-- Step 4: Rename the new column to `category` and set it as NOT NULL with default
ALTER TABLE `Task` CHANGE COLUMN `categoryName` `category` VARCHAR(191) NOT NULL DEFAULT 'MAIN';

-- Step 5: Recreate the index (it was dropped when we removed the column)
CREATE INDEX `Task_category_idx` ON `Task`(`category`);

