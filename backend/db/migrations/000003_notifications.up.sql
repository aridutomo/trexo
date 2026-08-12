-- 000003_notifications.up.sql
-- Tabel notifikasi/pengingat. Baris di-upsert oleh generator Go (store.Generate)
-- dari ms_task yang overdue / mendekati due_date. Penerima = assignee task.
--
--   is_read          = "sudah dibaca" (klik notifikasi) -> mengurangi badge lonceng.
--   is_dismissed     = "close / X" (snooze). dismissed_until = kapan boleh muncul lagi.
--   is_active        = 0 ketika task sudah done / due_date dihapus -> hilang permanen.
--
-- UNIQUE (user_id, ref_type, ref_id) -> 1 baris pengingat per (user, task); generator
-- pakai INSERT ... ON DUPLICATE KEY UPDATE. Ketika snooze lewat (dismissed_until < now)
-- generator me-reset is_dismissed=0 dan is_read=0 -> MUNCUL LAGI selama task belum done.
SET NAMES utf8mb4;

CREATE TABLE ms_notification (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  notification_id  VARCHAR(40)  NOT NULL,
  user_id          VARCHAR(128) NOT NULL,                          -- penerima (soft-FK better-auth user)
  type             ENUM('task_overdue','task_due_soon','task_assigned','comment_mention')
                                 NOT NULL DEFAULT 'task_due_soon',
  severity         ENUM('info','warning','urgent')
                                 NOT NULL DEFAULT 'info',          -- warna UI: info / warning / urgent
  title            VARCHAR(200) NOT NULL,
  body             TEXT         NOT NULL,
  ref_type         VARCHAR(40)  NOT NULL DEFAULT 'task',           -- task | project | comment
  ref_id           VARCHAR(40)  NOT NULL,                          -- task_id / project_id
  project_id       VARCHAR(40)  NULL,                              -- denormalized -> filter "per project"
  due_at           DATETIME(3)  NULL,                              -- snapshot due_date task (sort + tampilan)
  target_url       VARCHAR(255) NOT NULL,                          -- deep link saat diklik
  is_read          TINYINT(1)   NOT NULL DEFAULT 0,                -- "sudah dibaca"
  read_at          DATETIME(3)  NULL,
  is_dismissed     TINYINT(1)   NOT NULL DEFAULT 0,                -- "close / X" (snooze)
  dismissed_until  DATETIME(3)  NULL,                              -- kapan boleh muncul lagi
  created_by       VARCHAR(128) NULL,
  created_time     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  modified_by      VARCHAR(128) NULL,
  modified_time    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,                -- 0 = task done -> hilang permanen
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_notification_id (notification_id),
  -- upsert key: 1 pengingat per (user, task) -> anti-duplikat + re-enable saat snooze lewat
  UNIQUE KEY uq_notification_user_ref (user_id, ref_type, ref_id),
  KEY idx_notification_user_unread (user_id, is_read, is_active),
  KEY idx_notification_user_active (user_id, is_active, is_dismissed),
  KEY idx_notification_project (project_id),
  KEY idx_notification_ref (ref_type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
