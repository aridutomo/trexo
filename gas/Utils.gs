// Utils.gs — shared helpers (business logic + ownership checks).

function requireFields(obj, fields) {
  for (let i = 0; i < fields.length; i++) {
    const v = obj[fields[i]];
    if (v === undefined || v === null || v === "") {
      throw Errors.validation("Missing field: " + fields[i]);
    }
  }
}

function nowIso() {
  return new Date().toISOString();
}

// --- ownership / authorization ---------------------------------------------
// RLS is deny-all and GAS uses the service role (bypasses RLS), so GAS is the
// ONLY place that enforces "this user may touch this row". Every mutating op
// must pass one of these checks first.

function userOwnsWorkspace(workspaceId, userId) {
  const row = Supabase.one("/ms_workspace", {
    workspace_id: "eq." + workspaceId,
    owner_id: "eq." + userId,
  });
  return !!row;
}

function userCanAccessProject(projectId, userId) {
  const proj = Supabase.one("/ms_project", {
    project_id: "eq." + projectId,
    is_active: "eq.true",
  });
  if (!proj) return false;
  return userOwnsWorkspace(proj.workspace_id, userId);
}

function userCanAccessTask(taskId, userId) {
  const t = Supabase.one("/ms_task", { task_id: "eq." + taskId });
  if (!t) return false;
  return userCanAccessProject(t.project_id, userId);
}
