import type { AppState } from './types'
import { newId } from './ids'

interface SessionArgs {
  taskId: string
  durationMin: number
  now: number
}

export function completeSession(state: AppState, args: SessionArgs): AppState {
  const tasks = state.tasks.map((t) => {
    if (t.id !== args.taskId) return t
    const completedSessions = t.completedSessions + 1
    return {
      ...t,
      completedSessions,
      done: completedSessions >= t.estimatedSessions,
    }
  })
  return {
    ...state,
    tasks,
    sessions: [
      ...state.sessions,
      {
        id: newId(),
        taskId: args.taskId,
        durationMin: args.durationMin,
        startedAt: args.now - args.durationMin * 60_000,
        completedAt: args.now,
      },
    ],
  }
}

export function abandonSession(state: AppState, args: SessionArgs): AppState {
  return {
    ...state,
    sessions: [
      ...state.sessions,
      {
        id: newId(),
        taskId: args.taskId,
        durationMin: args.durationMin,
        startedAt: args.now - args.durationMin * 60_000,
        completedAt: null,
      },
    ],
  }
}
