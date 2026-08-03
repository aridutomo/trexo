-- 10_enums.sql
-- Postgres enum types. Mirror src/lib/types.ts exactly.
-- Run FIRST, before the business tables.
-- (Safe to re-run after dropping the types; idempotent guard below.)

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_type') then
    create type workspace_type as enum ('personal', 'company');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('todo', 'in_progress', 'review', 'done');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_source') then
    create type task_source as enum ('own_idea', 'user_request');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_difficulty') then
    create type task_difficulty as enum ('easy', 'medium', 'hard');
  end if;
end $$;
