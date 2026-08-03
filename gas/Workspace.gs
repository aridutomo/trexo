// Workspace.gs — handlers for "workspace.list/create/update/delete".
// A workspace belongs to one owner; only the owner can see/mutate it.

const Workspace = {
  list(payload, ctx) {
    const rows = Supabase.list("/ms_workspace", {
      owner_id: "eq." + ctx.userId,
      is_active: "eq.true",
      order: "created_time.asc",
    });
    return rows.map(Shape.workspace);
  },

  create(payload, ctx) {
    requireFields(payload, ["name", "type", "color"]);
    const now = nowIso();
    const row = {
      workspace_id: genId("ws"),
      name: payload.name,
      type: payload.type,
      owner_id: ctx.userId,
      color: payload.color,
      created_by: ctx.userId,
      created_time: now,
      modified_by: ctx.userId,
      modified_time: now,
      is_active: true,
    };
    return Shape.workspace(Supabase.insertOne("/ms_workspace", row));
  },

  update(payload, ctx) {
    requireFields(payload, ["id"]);
    const existing = Supabase.one("/ms_workspace", {
      workspace_id: "eq." + payload.id,
      owner_id: "eq." + ctx.userId,
    });
    if (!existing) throw Errors.notFound("Workspace not found.");

    const patch = { modified_by: ctx.userId, modified_time: nowIso() };
    if (payload.name != null) patch.name = payload.name;
    if (payload.type != null) patch.type = payload.type;
    if (payload.color != null) patch.color = payload.color;

    const updated = Supabase.update("/ms_workspace", { workspace_id: "eq." + payload.id }, patch);
    return Shape.workspace((updated && updated[0]) || existing);
  },

  delete(payload, ctx) {
    requireFields(payload, ["id"]);
    const existing = Supabase.one("/ms_workspace", {
      workspace_id: "eq." + payload.id,
      owner_id: "eq." + ctx.userId,
    });
    if (!existing) throw Errors.notFound("Workspace not found.");
    // Hard delete. ms_project has ON DELETE RESTRICT, so the caller must delete
    // projects first. (Frontend flow deletes projects before the workspace.)
    Supabase.remove("/ms_workspace", { workspace_id: "eq." + payload.id });
    return { id: payload.id, deleted: true };
  },
};
