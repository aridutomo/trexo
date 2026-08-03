-- 40_rls.sql
-- Deny-all Row Level Security.
-- Run LAST.
--
-- RLS is enabled with NO policies, which means anon/publishable-key access
-- (the key exposed to browsers) can read/modify NOTHING.
--   - GAS connects with the SERVICE ROLE key, which bypasses RLS entirely.
--   - better-auth connects over the pg pooler (postgres role), unaffected by RLS.
-- So legitimate access keeps working, but a leaked publishable key is harmless.
--
-- This is CRITICAL for the better-auth tables: they ship WITHOUT RLS, so by
-- default the anon key can read password hashes (account.password) and active
-- sessions. Enable deny-all on them too.

-- better-auth tables (created by `npx better-auth migrate`) ---------------
alter table "user"        enable row level security;
alter table session       enable row level security;
alter table account       enable row level security;
alter table verification  enable row level security;

-- business tables (created by 20_business_tables.sql) ---------------------
alter table ms_workspace  enable row level security;
alter table ms_project    enable row level security;
alter table ms_task       enable row level security;
alter table tr_task_step  enable row level security;
alter table tr_comment    enable row level security;

-- Intentionally NO `create policy` statements anywhere.
-- If you later want direct browser access via the publishable key, add
-- explicit per-table policies — but the recommended design keeps all
-- reads/writes flowing through GAS (service role).
