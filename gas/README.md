# Trexo — Google Apps Script backend

This is the business-data CRUD API. It talks to Supabase via the REST API
(`UrlFetchApp`) using the **service role key** (kept in Script Properties), and
it authenticates each call by verifying a better-auth session token against the
`session` table. Next.js calls this; the browser never does.

> ⚠️ GAS Web Apps **do not expose custom HTTP headers** in `doGet`/`doPost`, so
> the API key + session token travel in the request **body** (POST) / **query**
> (GET) — not in headers. See `Code.gs` for the contract.

## Files

All `.gs` files share one global scope (one Apps Script project). Copy **each**
file below into the editor as a separate file with the same name:

| File | Purpose |
|------|---------|
| `Code.gs` | `doGet`/`doPost` entrypoints + request parsing |
| `Config.gs` | reads Script Properties |
| `Auth.gs` | API-key gate + session-token verification (identity bridge) |
| `Supabase.gs` | `UrlFetchApp` REST helper |
| `Ids.gs` | prefixed business-key generator |
| `Shape.gs` | DB row → frontend DTO mapping |
| `Router.gs` | action parse + dispatch |
| `Utils.gs` | validation helpers + ownership checks |
| `Errors.gs` | typed errors + envelope |
| `Workspace.gs` `Project.gs` `Task.gs` `TaskStep.gs` `Comment.gs` | per-entity handlers |

`appsscript.json` is the project manifest (set via Project Settings →
"Show appsscript.json manifest file in editor").

## Setup (do this once)

1. **Create the project.** Go to [script.google.com](https://script.google.com) →
   New project. Name it e.g. `trexo-backend`. Delete the default `Code.gs`
   content, then create one file per `.gs` above and paste the contents.

2. **Set Script Properties** (Project Settings ⚙ → Script properties →
   Edit script properties). Add:

   | Property | Value |
   |----------|-------|
   | `SUPABASE_URL` | `https://xjxyktjfajcqukuzfsdi.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase **service role** key (Settings → API → `service_role`). **Never** the publishable/anon key. |
   | `GAS_API_KEYS` | a comma-separated allowlist of shared secrets, e.g. `dev-abc123...,prod-xyz789...` |

   Generate a shared secret, e.g.:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Put that same value in the Next.js `.env.local` as `GAS_API_KEY` (one of the
   entries in `GAS_API_KEYS`).

3. **Deploy as a Web App.**
   - Deploy → New deployment → select type **Web app**.
   - **Execute as:** *Me (your account)*
   - **Who has access:** *Anyone* (so the Next.js server can call it without a
     Google login — it is still gated by the `GAS_API_KEY`).
   - Deploy → authorize the scopes when prompted.
   - Copy the **Web app URL** (ends in `/exec`) → put it in Next.js `.env.local`
     as `GAS_API_URL`.

   > Every time you edit the `.gs` files, do **Deploy → Manage deployments →
   > Edit → Version: New version**, otherwise the live URL still runs the old
   > code.

## Contract

```
POST {GAS_API_URL}
Content-Type: application/json
{ "key": "<GAS_API_KEY>", "token": "<better-auth session token>",
  "action": "<entity>.<op>", "payload": { ... } }

→ 200 (always, at the transport layer)
   success: { "ok": true, "data": <...> }
   error:   { "ok": false, "error": { "code": "...", "message": "..." } }
```

### Actions

- `workspace.list` / `.create` / `.update` / `.delete`
- `project.list {workspaceId}` / `.get {id}` / `.create` / `.update {id}` / `.delete {id}`
- `task.list {projectId}` / `.get {id}` / `.create` / `.update {id}` / `.delete {id}` / `.move {id,status}`
- `taskstep.create {taskId,name}` / `.update {id,name}` / `.toggle {id}` / `.delete {id}` / `.reorder {taskId,stepIds[]}`
- `comment.list {taskId}` / `.create {taskId,content}` / `.delete {id}`

## Smoke test (curl)

Replace `<URL>`, `<KEY>`, `<TOKEN>` (grab a real session token from the `session`
table after signing in via the Next.js app):

```bash
# 1) no key → rejected
curl -s -X POST "<URL>" -H "Content-Type: application/json" \
  -d '{"action":"workspace.list"}'
# → {"ok":false,"error":{"code":"UNAUTH","message":"Invalid API key."}}

# 2) valid key + token → lists the caller's workspaces
curl -s -X POST "<URL>" -H "Content-Type: application/json" \
  -d '{"key":"<KEY>","token":"<TOKEN>","action":"workspace.list","payload":{}}'
```

## Security model (read this)

- **RLS is deny-all** on every table (business + better-auth). The browser's
  publishable/anon key can read nothing. The **service role key** (in GAS only)
  bypasses RLS, so GAS is the **only** place row-level access is enforced.
- Therefore **every handler checks ownership** (`userOwnsWorkspace` →
  `userCanAccessProject` → `userCanAccessTask`). A logged-in user can only
  touch rows in workspaces they own.
- **Identity is not trusted from Next.js**: GAS re-derives `userId` from the
  session token via a `session` table lookup. A forged `userId` is irrelevant.
- Keep the service role key and `GAS_API_KEY` out of git (Script Properties /
  `.env.local` only — `.env.local` is gitignored).
