// TaskStep.gs — handlers for "taskstep.create/update/toggle/delete/reorder".
// Steps belong to a task; the caller must be able to access the task's project.

const TaskStep = {
  create(payload, ctx) {
    requireFields(payload, ["taskId", "name"]);
    if (!userCanAccessTask(payload.taskId, ctx.userId)) throw Errors.forbidden();

    const existing = Supabase.list("/tr_task_step", {
      task_id: "eq." + payload.taskId,
      is_active: "eq.true",
    });
    const now = nowIso();
    const row = {
      step_id: genId("s"),
      task_id: payload.taskId,
      name: payload.name,
      completed: false,
      position: existing.length,
      created_by: ctx.userId,
      created_time: now,
      modified_by: ctx.userId,
      modified_time: now,
      is_active: true,
    };
    return Shape.step(Supabase.insertOne("/tr_task_step", row));
  },

  update(payload, ctx) {
    requireFields(payload, ["id", "name"]);
    const step = Supabase.one("/tr_task_step", { step_id: "eq." + payload.id });
    if (!step) throw Errors.notFound("Step not found.");
    if (!userCanAccessTask(step.task_id, ctx.userId)) throw Errors.forbidden();

    const updated = Supabase.update("/tr_task_step", { step_id: "eq." + payload.id }, {
      name: payload.name,
      modified_by: ctx.userId,
      modified_time: nowIso(),
    });
    return Shape.step((updated && updated[0]) || step);
  },

  toggle(payload, ctx) {
    requireFields(payload, ["id"]);
    const step = Supabase.one("/tr_task_step", { step_id: "eq." + payload.id });
    if (!step) throw Errors.notFound("Step not found.");
    if (!userCanAccessTask(step.task_id, ctx.userId)) throw Errors.forbidden();

    const updated = Supabase.update("/tr_task_step", { step_id: "eq." + payload.id }, {
      completed: !step.completed,
      modified_by: ctx.userId,
      modified_time: nowIso(),
    });
    if (updated && updated[0]) return Shape.step(updated[0]);
    return Shape.step({ step_id: step.step_id, name: step.name, completed: !step.completed });
  },

  delete(payload, ctx) {
    requireFields(payload, ["id"]);
    const step = Supabase.one("/tr_task_step", { step_id: "eq." + payload.id });
    if (!step) throw Errors.notFound("Step not found.");
    if (!userCanAccessTask(step.task_id, ctx.userId)) throw Errors.forbidden();

    Supabase.remove("/tr_task_step", { step_id: "eq." + payload.id });
    return { id: payload.id, deleted: true };
  },

  reorder(payload, ctx) {
    requireFields(payload, ["taskId", "stepIds"]);
    if (!userCanAccessTask(payload.taskId, ctx.userId)) throw Errors.forbidden();

    const now = nowIso();
    payload.stepIds.forEach(function (sid, i) {
      Supabase.update("/tr_task_step", {
        step_id: "eq." + sid,
        task_id: "eq." + payload.taskId,
      }, { position: i, modified_by: ctx.userId, modified_time: now });
    });
    return { taskId: payload.taskId, ordered: payload.stepIds };
  },
};
