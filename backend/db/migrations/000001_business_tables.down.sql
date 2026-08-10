-- 000001_business_tables.down.sql
-- Drop in reverse FK dependency order.

DROP TABLE IF EXISTS tr_comment;
DROP TABLE IF EXISTS tr_task_step;
DROP TABLE IF EXISTS ms_task;
DROP TABLE IF EXISTS ms_project;
DROP TABLE IF EXISTS ms_workspace;
