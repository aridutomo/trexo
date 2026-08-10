import type { Comment, Project, Task, TaskStatus, TaskStep, Workspace } from "./types";

// Typed browser client for business data. It calls the Next.js BFF at /api/v1/*
// (src/app/api/v1/[...path]), which authenticates via better-auth and forwards
// to the Golang backend. This is the ONLY data surface the frontend components /
// store should use.
//
// Method signatures are stable so store.ts and all components stay unchanged —
// only the REST transport matters.

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const err = (json && typeof json === "object" && "error" in (json as Record<string, unknown>)
      ? (json as { error?: { code?: string; message?: string } }).error
      : undefined);
    const e = new Error(err?.message ?? "Request failed") as Error & { code?: string };
    e.code = err?.code;
    throw e;
  }
  return json as T;
}

export const api = {
  workspace: {
    list: () => request<Workspace[]>("GET", "/workspaces"),
    create: (d: { name: string; type: Workspace["type"]; color: string }) =>
      request<Workspace>("POST", "/workspaces", d),
    update: (id: string, patch: Partial<Pick<Workspace, "name" | "type" | "color">>) =>
      request<Workspace>("PATCH", `/workspaces/${id}`, patch),
    remove: (id: string) =>
      request<{ id: string; deleted: boolean }>("DELETE", `/workspaces/${id}`),
  },

  project: {
    list: (workspaceId: string) =>
      request<Project[]>("GET", `/workspaces/${workspaceId}/projects`),
    create: (d: {
      workspaceId: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
    }) =>
      request<Project>("POST", `/workspaces/${d.workspaceId}/projects`, {
        name: d.name,
        description: d.description,
        icon: d.icon,
        color: d.color,
      }),
    update: (
      id: string,
      patch: Partial<Pick<Project, "name" | "description" | "icon" | "color">>
    ) => request<Project>("PATCH", `/projects/${id}`, patch),
    remove: (id: string) =>
      request<{ id: string; deleted: boolean }>("DELETE", `/projects/${id}`),
  },

  task: {
    list: (projectId: string) => request<Task[]>("GET", `/projects/${projectId}/tasks`),
    get: (id: string) => request<Task>("GET", `/tasks/${id}`),
    create: (d: {
      projectId: string;
      name: string;
      description?: string;
      status?: TaskStatus;
      source: Task["source"];
      difficulty: Task["difficulty"];
      steps?: string[];
    }) =>
      request<Task>("POST", `/projects/${d.projectId}/tasks`, {
        name: d.name,
        description: d.description,
        status: d.status,
        source: d.source,
        difficulty: d.difficulty,
        steps: d.steps,
      }),
    update: (
      id: string,
      patch: Partial<
        Pick<Task, "name" | "description" | "status" | "source" | "difficulty" | "assigneeId" | "dueDate">
      >
    ) => request<Task>("PATCH", `/tasks/${id}`, patch),
    remove: (id: string) =>
      request<{ id: string; deleted: boolean }>("DELETE", `/tasks/${id}`),
    move: (id: string, status: TaskStatus) =>
      request<Task>("PATCH", `/tasks/${id}`, { status }),
  },

  step: {
    create: (taskId: string, name: string) =>
      request<TaskStep>("POST", `/tasks/${taskId}/steps`, { name }),
    update: (id: string, name: string) =>
      request<TaskStep>("PATCH", `/steps/${id}`, { name }),
    toggle: (id: string) => request<TaskStep>("PATCH", `/steps/${id}/toggle`),
    remove: (id: string) =>
      request<{ id: string; deleted: boolean }>("DELETE", `/steps/${id}`),
    reorder: (taskId: string, stepIds: string[]) =>
      request<{ taskId: string; ordered: string[] }>(
        "PUT",
        `/tasks/${taskId}/steps/reorder`,
        { stepIds },
      ),
  },

  comment: {
    list: (taskId: string) => request<Comment[]>("GET", `/tasks/${taskId}/comments`),
    create: (taskId: string, content: string) =>
      request<Comment>("POST", `/tasks/${taskId}/comments`, { content }),
    remove: (id: string) =>
      request<{ id: string; deleted: boolean }>("DELETE", `/comments/${id}`),
  },
};
