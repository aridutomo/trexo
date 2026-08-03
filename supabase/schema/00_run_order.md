# Supabase Schema — Run Order

Run these in the **Supabase SQL Editor** (`Dashboard → SQL Editor → New query`) in this exact order.

| # | File | What it does | When |
|---|------|--------------|------|
| 0 | — | Run `npx @better-auth/cli@latest migrate` from the project (after Phase 2 files + `.env.local` exist). This creates `user`, `session`, `account`, `verification` and the `additionalFields` columns on `"user"`. | After Phase 2 |
| 1 | `10_enums.sql` | Creates the 4 Postgres enum types. | First |
| 2 | `20_business_tables.sql` | Creates the 5 business tables. | After step 0 + 1 |
| 3 | `30_indexes.sql` | Creates indexes for every list view. | After step 2 |
| 4 | `40_rls.sql` | Enables deny-all RLS on business tables AND the better-auth tables. | Last |

## Notes

- **`"user"` is a Postgres reserved word** — always double-quote it in manual SQL (`"user"`, not `user`).
- Table names are **snake_case** (`ms_workspace`) even though the conceptual name is `ms-workspace`. Postgres doesn't allow hyphens in unquoted identifiers; underscores avoid a quoting nightmare. The `ms_` / `tr_` prefix intent is preserved.
- `created_by` / `modified_by` / `owner_id` / `assignee_id` / `user_id` are **soft references** to `"user".id` (indexed, no hard FK) so that auth-layer changes and user hard-deletes can't break business tables.
- Progress is **derived** in the frontend (`computeProgress`) — never stored. Display labels/colors (`STATUS_META` etc.) also stay in the frontend; only enum *keys* live in the DB.
