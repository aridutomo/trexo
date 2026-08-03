-- 20_business_tables.sql
-- Five business tables following the project convention:
--   int8 id PK (GENERATED ALWAYS AS IDENTITY)
--   + varchar <entity>_id UNIQUE NOT NULL  (the ID the frontend uses)
--   + audit columns: created_by, created_time, modified_by, modified_time
--   + is_active boolean default true
-- Foreign keys target the varchar business-key columns (valid in Postgres
-- because they carry a UNIQUE constraint).
-- Run AFTER 10_enums.sql and AFTER `npx better-auth migrate`.

-- ms_workspace -------------------------------------------------------------
create table if not exists ms_workspace (
  id            int8 generated always as identity primary key,
  workspace_id  varchar(40)  not null unique,
  name          varchar(120) not null,
  type          workspace_type not null default 'personal',
  owner_id      varchar(128) not null,                 -- soft-FK -> "user".id
  color         varchar(9)   not null default '#0ea5e9',
  created_by    varchar(128),
  created_time  timestamptz not null default now(),
  modified_by   varchar(128),
  modified_time timestamptz not null default now(),
  is_active     boolean not null default true
);

-- ms_project ---------------------------------------------------------------
create table if not exists ms_project (
  id            int8 generated always as identity primary key,
  project_id    varchar(40)  not null unique,
  workspace_id  varchar(40)  not null
                references ms_workspace(workspace_id) on delete restrict,
  name          varchar(160) not null,
  description   text not null default '',
  icon          varchar(8)   not null default '📁',
  color         varchar(9)   not null default '#2196f3',
  created_by    varchar(128),
  created_time  timestamptz not null default now(),
  modified_by   varchar(128),
  modified_time timestamptz not null default now(),
  is_active     boolean not null default true
);

-- ms_task ------------------------------------------------------------------
create table if not exists ms_task (
  id            int8 generated always as identity primary key,
  task_id       varchar(40)  not null unique,
  project_id    varchar(40)  not null
                references ms_project(project_id) on delete cascade,
  name          varchar(200) not null,
  description   text not null default '',
  status        task_status     not null default 'todo',
  source        task_source     not null default 'own_idea',
  difficulty    task_difficulty not null default 'medium',
  assignee_id   varchar(128),                          -- soft-FK -> "user".id, nullable
  due_date      timestamptz,
  created_by    varchar(128),
  created_time  timestamptz not null default now(),
  modified_by   varchar(128),
  modified_time timestamptz not null default now(),
  is_active     boolean not null default true
);

-- tr_task_step -------------------------------------------------------------
-- Normalized out of the frontend's embedded Task.steps[] so each step is
-- individually addressable, ordered (position), and audited.
create table if not exists tr_task_step (
  id            int8 generated always as identity primary key,
  step_id       varchar(40)  not null unique,
  task_id       varchar(40)  not null
                references ms_task(task_id) on delete cascade,
  name          varchar(200) not null,
  completed     boolean not null default false,
  position      int not null default 0,
  created_by    varchar(128),
  created_time  timestamptz not null default now(),
  modified_by   varchar(128),
  modified_time timestamptz not null default now(),
  is_active     boolean not null default true
);

-- tr_comment ---------------------------------------------------------------
-- Comments are immutable in the UI (create/delete only); modified_* columns
-- are kept so one uniform insert/update helper serves all five tables.
create table if not exists tr_comment (
  id            int8 generated always as identity primary key,
  comment_id    varchar(40)  not null unique,
  task_id       varchar(40)  not null
                references ms_task(task_id) on delete cascade,
  user_id       varchar(128) not null,                 -- soft-FK -> "user".id
  content       text not null,
  created_by    varchar(128),
  created_time  timestamptz not null default now(),
  modified_by   varchar(128),
  modified_time timestamptz not null default now(),
  is_active     boolean not null default true
);
