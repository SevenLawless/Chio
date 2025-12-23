-- Add category column to Task table for organizing daily missions
-- Categories: MAIN, MORNING, FOOD, BOOKS, COURSES

ALTER TABLE `Task` ADD COLUMN `category` ENUM('MAIN', 'MORNING', 'FOOD', 'BOOKS', 'COURSES') NOT NULL DEFAULT 'MAIN' AFTER `parentId`;

-- Add index for efficient category filtering
CREATE INDEX `Task_category_idx` ON `Task`(`category`);

