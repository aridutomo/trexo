-- 000001_business_tables.up.sql
-- Skema bisnis (workspace, project, task, step, comment) untuk MySQL 8.
-- Charset utf8mb4 (icon default '📁' is a 4-byte sequence). ENUMs enforce the
-- value set (parity with Postgres enum types). DATETIME(3) (not TIMESTAMP) to
-- avoid auto timezone conversion + the 2038 problem. FK actions mirror Postgres:
--   ms_project   -> ms_workspace   ON DELETE RESTRICT
--   ms_task      -> ms_project     ON DELETE CASCADE
--   tr_task_step -> ms_task        ON DELETE CASCADE
--   tr_comment   -> ms_task        ON DELETE CASCADE
-- Tabel better-auth (user/session/account/verification) dibuat terpisah oleh
-- `npx @better-auth/cli migrate` dan TIDAK dikelola golang-migrate.
-- owner_id / user_id / assignee_id adalah soft-FK varchar ke better-auth user.

SET NAMES utf8mb4;

-- ms_workspace -------------------------------------------------------------
CREATE TABLE ms_workspace (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  workspace_id  VARCHAR(40)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  type          ENUM('personal','company') NOT NULL DEFAULT 'personal',
  owner_id      VARCHAR(128) NOT NULL,
  color         VARCHAR(9)   NOT NULL DEFAULT '#0ea5e9',
  created_by    VARCHAR(128) NULL,
  created_time  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  modified_by   VARCHAR(128) NULL,
  modified_time DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_workspace_id (workspace_id),
  KEY idx_workspace_owner (owner_id),
  KEY idx_workspace_active_owner (is_active, owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ms_project ---------------------------------------------------------------
CREATE TABLE ms_project (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  project_id    VARCHAR(40)  NOT NULL,
  workspace_id  VARCHAR(40)  NOT NULL,
  name          VARCHAR(160) NOT NULL,
  description   TEXT         NOT NULL,
  icon          VARCHAR(8)   NOT NULL DEFAULT '📁',
  color         VARCHAR(9)   NOT NULL DEFAULT '#2196f3',
  created_by    VARCHAR(128) NULL,
  created_time  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  modified_by   VARCHAR(128) NULL,
  modified_time DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_project_id (project_id),
  KEY idx_project_workspace (workspace_id),
  KEY idx_project_active_ws (is_active, workspace_id),
  CONSTRAINT fk_project_workspace
    FOREIGN KEY (workspace_id) REFERENCES ms_workspace (workspace_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ms_task ------------------------------------------------------------------
CREATE TABLE ms_task (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  task_id       VARCHAR(40)  NOT NULL,
  project_id    VARCHAR(40)  NOT NULL,
  name          VARCHAR(200) NOT NULL,
  description   TEXT         NOT NULL,
  status        ENUM('todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
  source        ENUM('own_idea','user_request')            NOT NULL DEFAULT 'own_idea',
  difficulty    ENUM('easy','medium','hard')               NOT NULL DEFAULT 'medium',
  assignee_id   VARCHAR(128) NULL,
  due_date      DATETIME(3)  NULL,
  created_by    VARCHAR(128) NULL,
  created_time  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  modified_by   VARCHAR(128) NULL,
  modified_time DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_task_task_id (task_id),
  KEY idx_task_project (project_id),
  KEY idx_task_active_project (is_active, project_id),
  KEY idx_task_assignee (assignee_id),
  KEY idx_task_status (status),
  CONSTRAINT fk_task_project
    FOREIGN KEY (project_id) REFERENCES ms_project (project_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- tr_task_step -------------------------------------------------------------
CREATE TABLE tr_task_step (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  step_id       VARCHAR(40)  NOT NULL,
  task_id       VARCHAR(40)  NOT NULL,
  name          VARCHAR(200) NOT NULL,
  completed     TINYINT(1)   NOT NULL DEFAULT 0,
  position      INT          NOT NULL DEFAULT 0,
  created_by    VARCHAR(128) NULL,
  created_time  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  modified_by   VARCHAR(128) NULL,
  modified_time DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_taskstep_step_id (step_id),
  KEY idx_taskstep_task_position (task_id, position),
  KEY idx_taskstep_active_task (is_active, task_id),
  CONSTRAINT fk_taskstep_task
    FOREIGN KEY (task_id) REFERENCES ms_task (task_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- tr_comment ---------------------------------------------------------------
CREATE TABLE tr_comment (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  comment_id    VARCHAR(40)  NOT NULL,
  task_id       VARCHAR(40)  NOT NULL,
  user_id       VARCHAR(128) NOT NULL,
  content       TEXT         NOT NULL,
  created_by    VARCHAR(128) NULL,
  created_time  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  modified_by   VARCHAR(128) NULL,
  modified_time DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_comment_comment_id (comment_id),
  KEY idx_comment_task (task_id),
  KEY idx_comment_active_task (is_active, task_id),
  KEY idx_comment_user (user_id),
  CONSTRAINT fk_comment_task
    FOREIGN KEY (task_id) REFERENCES ms_task (task_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
