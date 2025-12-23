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

-- Migrate existing enum categories to Category table
-- We'll create default categories for each user on first use, but for now we keep the enum
-- The Task.category column will remain as ENUM for backward compatibility
-- New categories will be stored in the Category table and referenced by name

