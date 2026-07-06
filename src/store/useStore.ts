import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { EMPTY_STATE } from '../domain/types'
import type { AppState } from '../domain/types'
import { newId } from '../domain/ids'
import { completeSession } from '../domain/session'

interface Actions {
  setNorthStar: (title: string, statement: string) => void
  addProject: (title: string) => string
  addTask: (projectId: string, title: string, estimatedSessions: number) => string
  setActiveTask: (taskId: string) => void
  finishSession: (taskId: string, durationMin: number) => void
  deleteTask: (taskId: string) => void
  deleteProject: (projectId: string) => void
  reset: () => void
}

export const useStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      setNorthStar: (title, statement) =>
        set({
          northStar: { id: newId(), title, statement, createdAt: Date.now() },
        }),

      addProject: (title) => {
        const id = newId()
        const northStarId = get().northStar?.id ?? ''
        set((s) => ({
          projects: [...s.projects, { id, northStarId, title, order: s.projects.length }],
        }))
        return id
      },

      addTask: (projectId, title, estimatedSessions) => {
        const id = newId()
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id,
              projectId,
              title,
              estimatedSessions: Math.max(1, Math.round(estimatedSessions)),
              completedSessions: 0,
              order: s.tasks.filter((t) => t.projectId === projectId).length,
              done: false,
            },
          ],
          activeTaskId: s.activeTaskId ?? id,
        }))
        return id
      },

      setActiveTask: (taskId) => set({ activeTaskId: taskId }),

      finishSession: (taskId, durationMin) =>
        set((s) => completeSession(s, { taskId, durationMin, now: Date.now() })),

      deleteTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId),
          activeTaskId: s.activeTaskId === taskId ? null : s.activeTaskId,
        })),

      deleteProject: (projectId) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== projectId),
          tasks: s.tasks.filter((t) => t.projectId !== projectId),
          activeTaskId:
            s.tasks.find((t) => t.id === s.activeTaskId)?.projectId === projectId
              ? null
              : s.activeTaskId,
        })),

      reset: () => set({ ...EMPTY_STATE }),
    }),
    { name: 'startrail-state' },
  ),
)
