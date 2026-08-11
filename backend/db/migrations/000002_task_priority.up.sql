-- 000002_task_priority.up.sql
-- Tambah kolom priority pada ms_task (parity dengan difficulty).
-- ENUM membatasi value set; DEFAULT 'medium' mengisi row yang sudah ada.
-- golang-migrate menjalankan file ini otomatis saat startup (db.Migrate).

ALTER TABLE ms_task
  ADD COLUMN priority ENUM('low','medium','high','urgent')
  NOT NULL DEFAULT 'medium' AFTER difficulty;
