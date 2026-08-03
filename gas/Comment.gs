// Comment.gs — handlers for "comment.list/create/delete".
// Comments are immutable (no update). A comment's author OR the workspace
// owner can delete it.

const Comment = {
  list(payload, ctx) {
    requireFields(payload, ["taskId"]);
    if (!userCanAccessTask(payload.taskId, ctx.userId)) throw Errors.forbidden();

    const rows = Supabase.list("/tr_comment", {
      task_id: "eq." + payload.taskId,
      is_active: "eq.true",
      order: "created_time.asc",
    });
    return rows.map(Shape.comment);
  },

  create(payload, ctx) {
    requireFields(payload, ["taskId", "content"]);
    if (!userCanAccessTask(payload.taskId, ctx.userId)) throw Errors.forbidden();

    const now = nowIso();
    const row = {
      comment_id: genId("c"),
      task_id: payload.taskId,
      user_id: ctx.userId,
      content: payload.content,
      created_by: ctx.userId,
      created_time: now,
      modified_by: ctx.userId,
      modified_time: now,
      is_active: true,
    };
    return Shape.comment(Supabase.insertOne("/tr_comment", row));
  },

  delete(payload, ctx) {
    requireFields(payload, ["id"]);
    const c = Supabase.one("/tr_comment", { comment_id: "eq." + payload.id });
    if (!c) throw Errors.notFound("Comment not found.");

    const isAuthor = c.user_id === ctx.userId;
    const ownsWorkspace = userCanAccessTask(c.task_id, ctx.userId);
    if (!isAuthor && !ownsWorkspace) throw Errors.forbidden();

    Supabase.remove("/tr_comment", { comment_id: "eq." + payload.id });
    return { id: payload.id, deleted: true };
  },
};
