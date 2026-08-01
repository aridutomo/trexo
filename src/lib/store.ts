import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import {
  seedComments,
  seedProjects,
  seedTasks,
  seedUser,
  seedWorkspaces,
} from "./mock-data";
import { uid } from "./utils";
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
interface TrexoState {
  user: User | null;
  workspaces: Workspace[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];

  activeWorkspaceId: string | null;
  activeProjectId: string | null;

  // ---- auth ----
  login: (email: string, name?: string) => void;
  logout: () => void;

  // ---- workspace ----
  addWorkspace: (data: { name: string; type: WorkspaceType; color: string }) => Workspace;
  setActiveWorkspace: (id: string) => void;

  // ---- project ----
  addProject: (data: {
    workspaceId: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
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
  }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;

  // ---- steps ----
  addStep: (taskId: string, name: string) => void;
  toggleStep: (taskId: string, stepId: string) => void;
  updateStep: (taskId: string, stepId: string, name: string) => void;
  deleteStep: (taskId: string, stepId: string) => void;

  // ---- comments ----
  addComment: (taskId: string, content: string) => void;
  deleteComment: (commentId: string) => void;

  // ---- util ----
  resetData: () => void;
}

const safeStorage = () => {
  if (typeof window === "undefined") {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return window.localStorage;
};

const touch = (task: Task): Task => ({ ...task, updatedAt: new Date().toISOString() });

export const useTrexo = create<TrexoState>()(
  persist(
    (set, get) => ({
      user: null,
      workspaces: seedWorkspaces,
      projects: seedProjects,
      tasks: seedTasks,
      comments: seedComments,
      activeWorkspaceId: seedWorkspaces[0].id,
      activeProjectId: null,

      login: (email, name) =>
        set(() => ({
          user: {
            id: seedUser.id,
            email,
            name: name && name.trim() ? name.trim() : email.split("@")[0],
            avatarColor: seedUser.avatarColor,
            authProvider: "email",
          },
          activeWorkspaceId: get().activeWorkspaceId ?? get().workspaces[0]?.id ?? null,
        })),

      logout: () => set({ user: null }),

      addWorkspace: ({ name, type, color }) => {
        const ws: Workspace = {
          id: uid("ws"),
          name,
          type,
          color,
          ownerId: get().user?.id ?? "u_ari",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ workspaces: [...s.workspaces, ws], activeWorkspaceId: ws.id }));
        return ws;
      },

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id, activeProjectId: null }),

      addProject: ({ workspaceId, name, description = "", icon = "📁", color = "#2196f3" }) => {
        const project: Project = {
          id: uid("prj"),
          workspaceId,
          name,
          description,
          icon,
          color,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ projects: [...s.projects, project], activeProjectId: project.id }));
        return project;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.filter((t) => t.projectId !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        })),

      setActiveProject: (id) => set({ activeProjectId: id }),

      addTask: ({ projectId, name, description = "", status = "todo", source, difficulty, steps = [] }) => {
        const nowIso = new Date().toISOString();
        const task: Task = {
          id: uid("t"),
          projectId,
          name,
          description,
          status,
          source,
          difficulty,
          steps: steps.map((n) => ({ id: uid("s"), name: n, completed: false })),
          assigneeId: get().user?.id,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? touch({ ...t, ...patch }) : t)),
        })),

      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          comments: s.comments.filter((c) => c.taskId !== id),
        })),

      moveTask: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? touch({ ...t, status }) : t)),
        })),

      addStep: (taskId, name) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? touch({ ...t, steps: [...t.steps, { id: uid("s"), name, completed: false }] })
              : t
          ),
        })),

      toggleStep: (taskId, stepId) =>
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
        })),

      updateStep: (taskId, stepId, name) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? touch({
                  ...t,
                  steps: t.steps.map((st) => (st.id === stepId ? { ...st, name } : st)),
                })
              : t
          ),
        })),

      deleteStep: (taskId, stepId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? touch({ ...t, steps: t.steps.filter((st) => st.id !== stepId) })
              : t
          ),
        })),

      addComment: (taskId, content) => {
        const c: Comment = {
          id: uid("c"),
          taskId,
          userId: get().user?.id ?? "u_ari",
          content,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ comments: [...s.comments, c] }));
      },

      deleteComment: (commentId) =>
        set((s) => ({ comments: s.comments.filter((c) => c.id !== commentId) })),

      resetData: () =>
        set({
          workspaces: seedWorkspaces,
          projects: seedProjects,
          tasks: seedTasks,
          comments: seedComments,
          activeWorkspaceId: seedWorkspaces[0].id,
          activeProjectId: null,
        }),
    }),
    {
      name: "trexo-store-v1",
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({
        user: s.user,
        workspaces: s.workspaces,
        projects: s.projects,
        tasks: s.tasks,
        comments: s.comments,
        activeWorkspaceId: s.activeWorkspaceId,
        activeProjectId: s.activeProjectId,
      }),
    }
  )
);

// ============================================================
// Hooks & selectors
// ============================================================

/** Hook SSR-safe: true setelah store terhidrasi dari localStorage. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    const unsub = useTrexo.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);
  return hydrated;
}

export const selectTasksByProject = (projectId: string) => (s: TrexoState) =>
  s.tasks.filter((t) => t.projectId === projectId);

export const selectProjectsByWorkspace = (workspaceId: string) => (s: TrexoState) =>
  s.projects.filter((p) => p.workspaceId === workspaceId);
