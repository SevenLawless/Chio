-- Convert Task.category from ENUM to VARCHAR to support dynamic categories
-- This migration handles the case where 010_dynamic_categories.sql was already applied
-- but didn't convert the column type
-- 
-- Note: If the column is already VARCHAR, some statements may fail, but the migration
-- runner will ignore duplicate column/index errors

-- Step 1: Add a temporary new column for category name
ALTER TABLE `Task` ADD COLUMN `categoryName` VARCHAR(191) NULL AFTER `category`;

-- Step 2: Copy existing ENUM values to the new column
UPDATE `Task` SET `categoryName` = `category` WHERE `categoryName` IS NULL;

-- Step 3: Drop the old ENUM column
ALTER TABLE `Task` DROP COLUMN `category`;

-- Step 4: Rename the new column to `category` and set it as NOT NULL with default
ALTER TABLE `Task` CHANGE COLUMN `categoryName` `category` VARCHAR(191) NOT NULL DEFAULT 'MAIN';

-- Step 5: Recreate the index (it was dropped when we removed the column)
CREATE INDEX `Task_category_idx` ON `Task`(`category`);

