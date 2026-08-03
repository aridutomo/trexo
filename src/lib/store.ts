import { create } from "zustand";
import { api } from "./api";
import type {
  Comment,
  Project,
  Task,
  TaskDifficulty,
  TaskSource,
  TaskStatus,
  TaskStep,
  User,
  Workspace,
  WorkspaceType,
} from "./types";

// ============================================================
// State shape
// ============================================================
// All mutators are async. Creates/deletes await the API and then reconcile
// local state (so IDs come from the server). Toggles/edits/moves apply
// optimistically and sync in the background (best-effort; v1 has no rollback).
// Data is no longer persisted to localStorage — it is loaded from the backend
// via bootstrap() after login.
interface TrexoState {
  user: User | null;
  workspaces: Workspace[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];

  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  bootstrapped: boolean;

  // ---- session / data load ----
  loginFromSession: (u: { id: string; name: string; email: string; avatar_color?: string }) => void;
  bootstrap: () => Promise<void>;
  reset: () => void;
  loadComments: (taskId: string) => Promise<void>;

  // ---- workspace ----
  addWorkspace: (data: { name: string; type: WorkspaceType; color: string }) => Promise<Workspace>;
  setActiveWorkspace: (id: string) => void;

  // ---- project ----
  addProject: (data: {
    workspaceId: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string) => void;

  // ---- task ----
  addTask: (data: {
    projectId: string;
    name: string;
    description?: string;
    status?: TaskStatus;
    source: TaskSource;
    difficulty: TaskDifficulty;
    steps?: string[];
  }) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;

  // ---- steps ----
  addStep: (taskId: string, name: string) => Promise<void>;
  toggleStep: (taskId: string, stepId: string) => Promise<void>;
  updateStep: (taskId: string, stepId: string, name: string) => Promise<void>;
  deleteStep: (taskId: string, stepId: string) => Promise<void>;

  // ---- comments ----
  addComment: (taskId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

const touch = (task: Task): Task => ({ ...task, updatedAt: new Date().toISOString() });

// Fire a background sync, surfacing failures to the console (v1: no rollback).
function fire(p: Promise<unknown>) {
  p.catch((e) => console.error("[trexo] background sync failed:", e));
}

export const useTrexo = create<TrexoState>()((set, get) => ({
  user: null,
  workspaces: [],
  projects: [],
  tasks: [],
  comments: [],
  activeWorkspaceId: null,
  activeProjectId: null,
  bootstrapped: false,

  // ---------------------------------------------------------------- session
  loginFromSession: (u) =>
    set(() => ({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarColor: u.avatar_color ?? "#1e88e5",
        authProvider: "email",
      },
    })),

  bootstrap: async () => {
    if (get().bootstrapped) return;
    set({ bootstrapped: true }); // prevent re-entry (esp. React strict mode)
    try {
      const workspaces = await api.workspace.list();
      const projects = (
        await Promise.all(workspaces.map((w) => api.project.list(w.id)))
      ).flat();
      const tasks = (await Promise.all(projects.map((p) => api.task.list(p.id)))).flat();
      set((s) => ({
        workspaces,
        projects,
        tasks,
        comments: [],
        activeWorkspaceId:
          s.activeWorkspaceId && workspaces.some((w) => w.id === s.activeWorkspaceId)
            ? s.activeWorkspaceId
            : workspaces[0]?.id ?? null,
      }));
    } catch (e) {
      set({ bootstrapped: false }); // allow retry on failure
      // A 401 here is expected during logout teardown: the session was just
      // cleared, so an in-flight data load correctly aborts. Not a real error.
      if ((e as { code?: string }).code === "UNAUTH") return;
      console.error("[trexo] bootstrap failed:", e);
      throw e;
    }
  },

  reset: () =>
    set({
      user: null,
      workspaces: [],
      projects: [],
      tasks: [],
      comments: [],
      activeWorkspaceId: null,
      activeProjectId: null,
      bootstrapped: false,
    }),

  loadComments: async (taskId) => {
    const cs = await api.comment.list(taskId);
    set((s) => ({
      comments: [...s.comments.filter((c) => c.taskId !== taskId), ...cs],
    }));
  },

  // ---------------------------------------------------------------- workspace
  addWorkspace: async ({ name, type, color }) => {
    const ws = await api.workspace.create({ name, type, color });
    set((s) => ({ workspaces: [...s.workspaces, ws], activeWorkspaceId: ws.id }));
    return ws;
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id, activeProjectId: null }),

  // ---------------------------------------------------------------- project
  addProject: async ({ workspaceId, name, description = "", icon = "📁", color = "#2196f3" }) => {
    const project = await api.project.create({ workspaceId, name, description, icon, color });
    set((s) => ({ projects: [...s.projects, project], activeProjectId: project.id }));
    return project;
  },

  updateProject: async (id, patch) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    fire(api.project.update(id, patch));
  },

  deleteProject: async (id) => {
    await api.project.remove(id);
    set((s) => {
      const taskIds = s.tasks.filter((t) => t.projectId === id).map((t) => t.id);
      return {
        projects: s.projects.filter((p) => p.id !== id),
        tasks: s.tasks.filter((t) => t.projectId !== id),
        comments: s.comments.filter((c) => !taskIds.includes(c.taskId)),
        activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
      };
    });
  },

  setActiveProject: (id) => set({ activeProjectId: id }),

  // ---------------------------------------------------------------- task
  addTask: async ({ projectId, name, description = "", status = "todo", source, difficulty, steps = [] }) => {
    const task = await api.task.create({
      projectId,
      name,
      description,
      status,
      source,
      difficulty,
      steps,
    });
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, patch) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? touch({ ...t, ...patch }) : t)) }));
    fire(api.task.update(id, patch));
  },

  deleteTask: async (id) => {
    await api.task.remove(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      comments: s.comments.filter((c) => c.taskId !== id),
    }));
  },

  moveTask: async (id, status) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? touch({ ...t, status }) : t)) }));
    fire(api.task.move(id, status));
  },

  // ---------------------------------------------------------------- steps
  addStep: async (taskId, name) => {
    const step = await api.step.create(taskId, name);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? touch({ ...t, steps: [...t.steps, step] }) : t
      ),
    }));
  },

  toggleStep: async (taskId, stepId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? touch({
              ...t,
              steps: t.steps.map((st) =>
                st.id === stepId ? { ...st, completed: !st.completed } : st
              ),
            })
          : t
      ),
    }));
    fire(api.step.toggle(stepId));
  },

  updateStep: async (taskId, stepId, name) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? touch({
              ...t,
              steps: t.steps.map((st) => (st.id === stepId ? { ...st, name } : st)),
            })
          : t
      ),
    }));
    fire(api.step.update(stepId, name));
  },

  deleteStep: async (taskId, stepId) => {
    await api.step.remove(stepId);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? touch({ ...t, steps: t.steps.filter((st) => st.id !== stepId) }) : t
      ),
    }));
  },

  // ---------------------------------------------------------------- comments
  addComment: async (taskId, content) => {
    const c = await api.comment.create(taskId, content);
    set((s) => ({ comments: [...s.comments, c] }));
  },

  deleteComment: async (commentId) => {
    await api.comment.remove(commentId);
    set((s) => ({ comments: s.comments.filter((c) => c.id !== commentId) }));
  },
}));

// ============================================================
// Selectors
// ============================================================

export const selectTasksByProject = (projectId: string) => (s: TrexoState) =>
  s.tasks.filter((t) => t.projectId === projectId);

export const selectProjectsByWorkspace = (workspaceId: string) => (s: TrexoState) =>
  s.projects.filter((p) => p.workspaceId === workspaceId);
