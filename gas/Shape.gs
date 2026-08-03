// Shape.gs — DB row (snake_case, audit columns) -> frontend DTO (src/lib/types.ts).
// Business keys become the frontend's `id`. Audit internals (int8 id, created_by,
// is_active, modified_by) are dropped. assigneeId/dueDate become undefined when null.

const Shape = {
  workspace(r) {
    return {
      id: r.workspace_id,
      name: r.name,
      type: r.type,
      ownerId: r.owner_id,
      color: r.color,
      createdAt: r.created_time,
    };
  },
  project(r) {
    return {
      id: r.project_id,
      workspaceId: r.workspace_id,
      name: r.name,
      description: r.description || "",
      icon: r.icon,
      color: r.color,
      createdAt: r.created_time,
    };
  },
  step(r) {
    return { id: r.step_id, name: r.name, completed: !!r.completed };
  },
  task(r, steps) {
    return {
      id: r.task_id,
      projectId: r.project_id,
      name: r.name,
      description: r.description || "",
      status: r.status,
      source: r.source,
      difficulty: r.difficulty,
      steps: steps || [],
      assigneeId: r.assignee_id ? r.assignee_id : undefined,
      dueDate: r.due_date ? r.due_date : undefined,
      createdAt: r.created_time,
      updatedAt: r.modified_time || r.created_time,
    };
  },
  comment(r) {
    return {
      id: r.comment_id,
      taskId: r.task_id,
      userId: r.user_id,
      content: r.content,
      createdAt: r.created_time,
    };
  },
};
