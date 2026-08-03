// Task.gs — handlers for "task.list/get/create/update/delete/move".
// task.list fetches tasks + a single bulk fetch of their steps (2 round-trips).

const Task = {
  list(payload, ctx) {
    requireFields(payload, ["projectId"]);
    if (!userCanAccessProject(payload.projectId, ctx.userId)) throw Errors.forbidden();

    const tasks = Supabase.list("/ms_task", {
      project_id: "eq." + payload.projectId,
      is_active: "eq.true",
      order: "created_time.asc",
    });
    if (!tasks.length) return [];

    const taskIds = tasks.map(function (t) { return t.task_id; });
    const stepRows = Supabase.list("/tr_task_step", {
      task_id: "in.(" + taskIds.join(",") + ")",
      is_active: "eq.true",
      order: "position.asc",
    });
    const stepsByTask = {};
    stepRows.forEach(function (s) {
      if (!stepsByTask[s.task_id]) stepsByTask[s.task_id] = [];
      stepsByTask[s.task_id].push(Shape.step(s));
    });

    return tasks.map(function (t) {
      return Shape.task(t, stepsByTask[t.task_id] || []);
    });
  },

  get(payload, ctx) {
    requireFields(payload, ["id"]);
    const t = Supabase.one("/ms_task", { task_id: "eq." + payload.id, is_active: "eq.true" });
    if (!t) throw Errors.notFound("Task not found.");
    if (!userCanAccessProject(t.project_id, ctx.userId)) throw Errors.forbidden();

    const steps = Supabase.list("/tr_task_step", {
      task_id: "eq." + payload.id,
      is_active: "eq.true",
      order: "position.asc",
    }).map(Shape.step);
    return Shape.task(t, steps);
  },

  create(payload, ctx) {
    requireFields(payload, ["projectId", "name", "source", "difficulty"]);
    if (!userCanAccessProject(payload.projectId, ctx.userId)) throw Errors.forbidden();

    const now = nowIso();
    const taskRow = {
      task_id: genId("t"),
      project_id: payload.projectId,
      name: payload.name,
      description: payload.description || "",
      status: payload.status || "todo",
      source: payload.source,
      difficulty: payload.difficulty,
      assignee_id: payload.assigneeId || ctx.userId,
      due_date: payload.dueDate || null,
      created_by: ctx.userId,
      created_time: now,
      modified_by: ctx.userId,
      modified_time: now,
      is_active: true,
    };
    const created = Supabase.insertOne("/ms_task", taskRow);

    let steps = [];
    if (Array.isArray(payload.steps) && payload.steps.length) {
      const stepRows = payload.steps.map(function (name, i) {
        return {
          step_id: genId("s"),
          task_id: created.task_id,
          name: name,
          completed: false,
          position: i,
          created_by: ctx.userId,
          created_time: now,
          modified_by: ctx.userId,
          modified_time: now,
          is_active: true,
        };
      });
      const inserted = Supabase.insert("/tr_task_step", stepRows); // bulk insert
      steps = (Array.isArray(inserted) ? inserted : []).map(Shape.step);
    }
    return Shape.task(created, steps);
  },

  update(payload, ctx) {
    requireFields(payload, ["id"]);
    const t = Supabase.one("/ms_task", { task_id: "eq." + payload.id });
    if (!t) throw Errors.notFound("Task not found.");
    if (!userCanAccessProject(t.project_id, ctx.userId)) throw Errors.forbidden();

    const patch = { modified_by: ctx.userId, modified_time: nowIso() };
    if (payload.name != null) patch.name = payload.name;
    if (payload.description != null) patch.description = payload.description;
    if (payload.status != null) patch.status = payload.status;
    if (payload.source != null) patch.source = payload.source;
    if (payload.difficulty != null) patch.difficulty = payload.difficulty;
    if (payload.assigneeId !== undefined) patch.assignee_id = payload.assigneeId || null;
    if (payload.dueDate !== undefined) patch.due_date = payload.dueDate || null;

    const updated = Supabase.update("/ms_task", { task_id: "eq." + payload.id }, patch);
    // Steps are managed via taskstep.* actions; keep the response scalar-only.
    return Shape.task((updated && updated[0]) || t, []);
  },

  move(payload, ctx) {
    requireFields(payload, ["id", "status"]);
    const t = Supabase.one("/ms_task", { task_id: "eq." + payload.id });
    if (!t) throw Errors.notFound("Task not found.");
    if (!userCanAccessProject(t.project_id, ctx.userId)) throw Errors.forbidden();

    const updated = Supabase.update("/ms_task", { task_id: "eq." + payload.id }, {
      status: payload.status,
      modified_by: ctx.userId,
      modified_time: nowIso(),
    });
    return Shape.task((updated && updated[0]) || t, []);
  },

  delete(payload, ctx) {
    requireFields(payload, ["id"]);
    const t = Supabase.one("/ms_task", { task_id: "eq." + payload.id });
    if (!t) throw Errors.notFound("Task not found.");
    if (!userCanAccessProject(t.project_id, ctx.userId)) throw Errors.forbidden();

    // FK ON DELETE CASCADE removes this task's steps + comments.
    Supabase.remove("/ms_task", { task_id: "eq." + payload.id });
    return { id: payload.id, deleted: true };
  },
};
