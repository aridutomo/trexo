-- 000002_task_is_document_project.up.sql
-- Tambah kolom is_document_project pada ms_task.
-- golang-migrate menjalankan file ini otomatis saat startup (db.Migrate).

ALTER TABLE ms_task
  ADD COLUMN is_document_project TINYINT(1)
  NOT NULL AFTER is_active;
