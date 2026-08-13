-- 000006_task_is_document_task.up.sql
-- Rename ms_task.is_document_project -> is_document_task.
-- 000005 added the column under the old name (already applied). This forward
-- rename realigns the schema with the rest of the codebase; golang-migrate
-- runs it automatically on startup (db.Migrate).

ALTER TABLE ms_task
  RENAME COLUMN is_document_project TO is_document_task;
