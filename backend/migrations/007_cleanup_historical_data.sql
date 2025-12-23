-- Clean up historical TaskEntry records - keep only current day's data
-- This enforces single-day storage as per new requirements

DELETE FROM `TaskEntry` WHERE DATE(`date`) < CURDATE();

