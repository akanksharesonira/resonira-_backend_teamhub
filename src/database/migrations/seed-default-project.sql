-- Migration: Seed Default Project
-- Description: Ensures a default "General" project exists with ID 1 to prevent FK failures.

INSERT INTO projects (id, name, description, status, created_at, updated_at)
SELECT 1, 'General', 'Main organizational project', 'active', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = 1);

-- If ID 1 is taken but we need a general project
INSERT INTO projects (name, description, status, created_at, updated_at)
SELECT 'General', 'Main organizational project', 'active', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'General');
