-- Simplify TaskState enum from 3 states to 2 states
-- Remove SKIPPED state, keep only NOT_STARTED (TODO) and COMPLETED (DONE)
-- Update existing SKIPPED entries to NOT_STARTED

-- First, update any existing SKIPPED entries to NOT_STARTED
UPDATE `TaskEntry` SET `state` = 'NOT_STARTED' WHERE `state` = 'SKIPPED';

-- Note: MySQL doesn't support direct ENUM modification, so we need to:
-- 1. Alter the column to allow the new enum values
-- 2. This will be handled by the application layer, but we ensure data consistency here

