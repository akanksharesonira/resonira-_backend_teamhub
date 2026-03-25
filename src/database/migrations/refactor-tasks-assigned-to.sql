-- Migration: Refactor Task Assignment Naming
-- Description: Standardizes on assignedTo and createdBy (camelCase) to match frontend requirements.

-- 1. Rename columns
ALTER TABLE tasks CHANGE COLUMN assigned_to assignedTo INT NOT NULL;
ALTER TABLE tasks CHANGE COLUMN assigned_by createdBy INT NOT NULL;

-- 2. Clean up any invalid data (if any)
-- If assignedTo is 0 or invalid, we'll keep it but the controller will handle validation.

-- 3. Verify
-- DESCRIBE tasks;
