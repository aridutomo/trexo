# Trexo — Backend setup runbook

The code for the full backend is in place (Supabase schema, Google Apps Script
API, better-auth, and the Next.js↔GAS bridge). This is the ordered set of
**manual steps** to make it run. Each references the files already in the repo.

> Architecture: Browser → Next.js (better-auth) → GAS (CRUD) → Supabase.
> See `gas/README.md` and the plan for detail.

## 1. Supabase — connection strings & keys

In Supabase → **Settings**:

- **Database → Connection string → "Transaction pooler"** (port 6543) → copy it.
  This is `DATABASE_URL` for Next.js (better-auth connects over pg, NOT REST).
- **API → Project URL** → `https://xjxyktjfajcqukuzfsdi.supabase.co` (= `SUPABASE_URL` for GAS).
- **API → `service_role` secret key** → for GAS only (`SUPABASE_SERVICE_ROLE_KEY`).
  **Never** use the publishable/anon key on the server side.

## 2. Next.js — env + better-auth tables

1. Edit `.env.local`:
   - `DATABASE_URL` — paste the pooler string (replace `[PASSWORD]` + `[REGION]`,
     keep `?pgbouncer=true`).
   - `BETTER_AUTH_SECRET` — already generated for you; rotate if you like.
   - `GAS_API_URL` / `GAS_API_KEY` — fill in **after** step 5.
2. Create the better-auth tables (user / session / account / verification +
   the `additionalFields`):
   ```
   npm run auth:migrate
   ```

## 3. Supabase — business schema (run in SQL Editor, in order)

Paste each file from `supabase/schema/`:

1. `10_enums.sql`
2. `20_business_tables.sql`
3. `30_indexes.sql`
4. `40_rls.sql`  ← enables deny-all RLS on business **and** better-auth tables
   (critical: without it the anon key can read password hashes / sessions).

## 4. Google Apps Script — deploy

See `gas/README.md` for full detail. Summary:

1. New project at script.google.com → create one `.gs` file per file in `gas/`
   (Code, Config, Auth, Supabase, Ids, Shape, Router, Utils, Errors, Workspace,
   Project, Task, TaskStep, Comment). Paste `appsscript.json` via Project Settings
   → "Show appsscript.json manifest".
2. **Script Properties** (Project Settings):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (service role!),
   - `GAS_API_KEYS` = a comma-separated allowlist. Generate a secret, e.g.
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. **Deploy → New deployment → Web app** → Execute as: *Me*, Access: *Anyone*.
   Copy the `/exec` URL.

## 5. Finish Next.js env

In `.env.local`:
- `GAS_API_URL` = the GAS Web App `/exec` URL.
- `GAS_API_KEY` = one of the values in GAS `GAS_API_KEYS`.

## 6. Run & verify

```
npm run dev
```

- Open `/login` → **Daftar** (register) a new account (password ≥ 8 chars).
  You should land on `/app/dashboard`.
- In Supabase, confirm: a `u_…` row in `"user"` (with `avatar_color`/`is_active`),
  a `session` row, an `account` row (`providerId='credential'`, hashed `password`).
- Add a workspace → check `ms_workspace` (owner_id/created_by = your user id).
- Add a project, a task with a few steps → check `ms_project`, `ms_task`,
  `tr_task_step` (positioned 0,1,2). Toggle a step, move a task on the Kanban,
  add a comment, delete a task (steps + comments cascade away).

If something 401s: it's usually `GAS_API_KEY` mismatch, an expired/unmatched
session token, or RLS blocking because the wrong key was used. The GAS error
envelope (`{ ok:false, error:{ code, message } }`) tells you which.
