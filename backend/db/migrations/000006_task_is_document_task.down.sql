-- 000006_task_is_document_task.down.sql
ALTER TABLE ms_task
  RENAME COLUMN is_document_task TO is_document_project;
