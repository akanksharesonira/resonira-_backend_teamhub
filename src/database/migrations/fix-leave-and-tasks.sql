-- Combined Migration: Fix Leave Requests and Task Assignment Relation
-- Description: Ensures proper relations and constraints for both leave_requests and tasks tables.

-- ==========================================
-- 1. LEAVE REQUESTS FIX
-- ==========================================

-- Ensure leave_type_id column exists in leave_requests
DELIMITER //
CREATE PROCEDURE AddLeaveTypeIdIfNotExists()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'leave_requests' 
        AND COLUMN_NAME = 'leave_type_id'
    ) THEN
        ALTER TABLE leave_requests ADD COLUMN leave_type_id INT NULL;
    END IF;
END //
DELIMITER ;
CALL AddLeaveTypeIdIfNotExists();
DROP PROCEDURE AddLeaveTypeIdIfNotExists;

-- Populate default leave_type_id for existing records where it's NULL
UPDATE leave_requests SET leave_type_id = 1 WHERE leave_type_id IS NULL;

-- Ensure leave_type_id is NOT NULL
ALTER TABLE leave_requests MODIFY COLUMN leave_type_id INT NOT NULL;

-- Ensure foreign key constraint for leave_requests
DELIMITER //
CREATE PROCEDURE UpdateLeaveTypeForeignKey()
BEGIN
    DECLARE fk_name VARCHAR(100);
    
    SELECT CONSTRAINT_NAME INTO fk_name
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_NAME = 'leave_requests' 
    AND TABLE_SCHEMA = DATABASE()
    AND COLUMN_NAME = 'leave_type_id'
    AND REFERENCED_TABLE_NAME = 'leave_types'
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
        SET @query = CONCAT('ALTER TABLE leave_requests DROP FOREIGN KEY ', fk_name);
        PREPARE stmt FROM @query;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    ALTER TABLE leave_requests 
    ADD CONSTRAINT fk_leave_requests_leave_type_id 
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;
END //
DELIMITER ;
CALL UpdateLeaveTypeForeignKey();
DROP PROCEDURE UpdateLeaveTypeForeignKey;

-- Final check for common leave types
INSERT INTO leave_types (name, description, max_days_per_year, is_paid, is_active)
SELECT 'Annual', 'Annual Leave', 15, 1, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE name = 'Annual');

INSERT INTO leave_types (name, description, max_days_per_year, is_paid, is_active)
SELECT 'Sick', 'Sick Leave', 10, 1, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE name = 'Sick');

INSERT INTO leave_types (name, description, max_days_per_year, is_paid, is_active)
SELECT 'Casual', 'Casual Leave', 10, 1, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE name = 'Casual');


-- ==========================================
-- 2. TASKS FIX
-- ==========================================

-- Ensure columns exist and have correct types
ALTER TABLE tasks MODIFY COLUMN assigned_to INT NOT NULL;
ALTER TABLE tasks MODIFY COLUMN assigned_by INT NOT NULL;

-- Ensure foreign key for assigned_to (reference users(id))
DELIMITER //
CREATE PROCEDURE UpdateTaskAssigneeForeignKey()
BEGIN
    DECLARE fk_name VARCHAR(100);
    
    SELECT CONSTRAINT_NAME INTO fk_name
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_NAME = 'tasks' 
    AND TABLE_SCHEMA = DATABASE()
    AND COLUMN_NAME = 'assigned_to'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
        SET @query = CONCAT('ALTER TABLE tasks DROP FOREIGN KEY ', fk_name);
        PREPARE stmt FROM @query;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    ALTER TABLE tasks 
    ADD CONSTRAINT fk_tasks_assigned_to 
    FOREIGN KEY (assigned_to) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;
END //
DELIMITER ;
CALL UpdateTaskAssigneeForeignKey();
DROP PROCEDURE UpdateTaskAssigneeForeignKey;

-- Ensure foreign key for assigned_by (reference users(id))
DELIMITER //
CREATE PROCEDURE UpdateTaskCreatorForeignKey()
BEGIN
    DECLARE fk_name VARCHAR(100);
    
    SELECT CONSTRAINT_NAME INTO fk_name
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_NAME = 'tasks' 
    AND TABLE_SCHEMA = DATABASE()
    AND COLUMN_NAME = 'assigned_by'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
        SET @query = CONCAT('ALTER TABLE tasks DROP FOREIGN KEY ', fk_name);
        PREPARE stmt FROM @query;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    ALTER TABLE tasks 
    ADD CONSTRAINT fk_tasks_assigned_by 
    FOREIGN KEY (assigned_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;
END //
DELIMITER ;
CALL UpdateTaskCreatorForeignKey();
DROP PROCEDURE UpdateTaskCreatorForeignKey;
