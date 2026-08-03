import type { Comment, Project, Task, TaskStatus, TaskStep, Workspace } from "./types";

// Typed browser client for business data. It POSTs { action, payload } to the
// /api/gas proxy (which authenticates and forwards to GAS). This is the ONLY
// data surface the frontend components / store should use.

async function gas<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/gas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload: payload ?? {} }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    data?: T;
    error?: { code?: string; message?: string };
  };
  if (!body.ok) {
    const err = new Error(body.error?.message ?? "Request failed") as Error & {
      code?: string;
    };
    err.code = body.error?.code;
    throw err;
  }
  return body.data as T;
}

export const api = {
  workspace: {
    list: () => gas<Workspace[]>("workspace.list"),
    create: (d: { name: string; type: Workspace["type"]; color: string }) =>
      gas<Workspace>("workspace.create", d),
    update: (id: string, patch: Partial<Pick<Workspace, "name" | "type" | "color">>) =>
      gas<Workspace>("workspace.update", { id, ...patch }),
    remove: (id: string) => gas<{ id: string; deleted: boolean }>("workspace.delete", { id }),
  },

  project: {
    list: (workspaceId: string) => gas<Project[]>("project.list", { workspaceId }),
    create: (d: {
      workspaceId: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
    }) => gas<Project>("project.create", d),
    update: (
      id: string,
      patch: Partial<Pick<Project, "name" | "description" | "icon" | "color">>
    ) => gas<Project>("project.update", { id, ...patch }),
    remove: (id: string) => gas<{ id: string; deleted: boolean }>("project.delete", { id }),
  },

  task: {
    list: (projectId: string) => gas<Task[]>("task.list", { projectId }),
    get: (id: string) => gas<Task>("task.get", { id }),
    create: (d: {
      projectId: string;
      name: string;
      description?: string;
      status?: TaskStatus;
      source: Task["source"];
      difficulty: Task["difficulty"];
      steps?: string[];
    }) => gas<Task>("task.create", d),
    update: (
      id: string,
      patch: Partial<
        Pick<Task, "name" | "description" | "status" | "source" | "difficulty" | "assigneeId" | "dueDate">
      >
    ) => gas<Task>("task.update", { id, ...patch }),
    remove: (id: string) => gas<{ id: string; deleted: boolean }>("task.delete", { id }),
    move: (id: string, status: TaskStatus) => gas<Task>("task.move", { id, status }),
  },

  step: {
    create: (taskId: string, name: string) =>
      gas<TaskStep>("taskstep.create", { taskId, name }),
    update: (id: string, name: string) => gas<TaskStep>("taskstep.update", { id, name }),
    toggle: (id: string) => gas<TaskStep>("taskstep.toggle", { id }),
    remove: (id: string) => gas<{ id: string; deleted: boolean }>("taskstep.delete", { id }),
    reorder: (taskId: string, stepIds: string[]) =>
      gas<{ taskId: string; ordered: string[] }>("taskstep.reorder", { taskId, stepIds }),
  },

  comment: {
    list: (taskId: string) => gas<Comment[]>("comment.list", { taskId }),
    create: (taskId: string, content: string) =>
      gas<Comment>("comment.create", { taskId, content }),
    remove: (id: string) => gas<{ id: string; deleted: boolean }>("comment.delete", { id }),
  },
};
