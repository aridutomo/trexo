// Project.gs — handlers for "project.list/create/update/delete".
// Every op first checks the caller owns the project's workspace.

const Project = {
  list(payload, ctx) {
    requireFields(payload, ["workspaceId"]);
    if (!userOwnsWorkspace(payload.workspaceId, ctx.userId)) throw Errors.forbidden();

    const rows = Supabase.list("/ms_project", {
      workspace_id: "eq." + payload.workspaceId,
      is_active: "eq.true",
      order: "created_time.asc",
    });
    return rows.map(Shape.project);
  },

  create(payload, ctx) {
    requireFields(payload, ["workspaceId", "name"]);
    if (!userOwnsWorkspace(payload.workspaceId, ctx.userId)) throw Errors.forbidden();

    const now = nowIso();
    const row = {
      project_id: genId("prj"),
      workspace_id: payload.workspaceId,
      name: payload.name,
      description: payload.description || "",
      icon: payload.icon || "📁",
      color: payload.color || "#2196f3",
      created_by: ctx.userId,
      created_time: now,
      modified_by: ctx.userId,
      modified_time: now,
      is_active: true,
    };
    return Shape.project(Supabase.insertOne("/ms_project", row));
  },

  update(payload, ctx) {
    requireFields(payload, ["id"]);
    const proj = Supabase.one("/ms_project", { project_id: "eq." + payload.id });
    if (!proj) throw Errors.notFound("Project not found.");
    if (!userOwnsWorkspace(proj.workspace_id, ctx.userId)) throw Errors.forbidden();

    const patch = { modified_by: ctx.userId, modified_time: nowIso() };
    if (payload.name != null) patch.name = payload.name;
    if (payload.description != null) patch.description = payload.description;
    if (payload.icon != null) patch.icon = payload.icon;
    if (payload.color != null) patch.color = payload.color;

    const updated = Supabase.update("/ms_project", { project_id: "eq." + payload.id }, patch);
    return Shape.project((updated && updated[0]) || proj);
  },

  delete(payload, ctx) {
    requireFields(payload, ["id"]);
    const proj = Supabase.one("/ms_project", { project_id: "eq." + payload.id });
    if (!proj) throw Errors.notFound("Project not found.");
    if (!userOwnsWorkspace(proj.workspace_id, ctx.userId)) throw Errors.forbidden();

    // Hard delete. FK ON DELETE CASCADE removes this project's tasks, and each
    // task's steps + comments in turn (matching the frontend's cascade behavior).
    Supabase.remove("/ms_project", { project_id: "eq." + payload.id });
    return { id: payload.id, deleted: true };
  },
};
