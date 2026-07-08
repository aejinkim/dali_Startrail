import { describe, it, expect } from 'vitest'
import { completeSession, abandonSession } from '../../src/domain/session'
import type { AppState, Task } from '../../src/domain/types'

function baseState(taskOverrides: Partial<Task> = {}): AppState {
  const t: Task = {
    id: 't1', projectId: 'p1', title: 'logo',
    estimatedSessions: 2, completedSessions: 0,
    order: 0, done: false, ...taskOverrides,
  }
  return {
    northStar: { id: 'n1', title: 'launch', statement: '', createdAt: 0 },
    projects: [{ id: 'p1', northStarId: 'n1', title: 'brand', order: 0 }],
    tasks: [t],
    sessions: [],
    activeTaskId: 't1',
  }
}

describe('completeSession', () => {
  it('increments completedSessions and records a completed session', () => {
    const next = completeSession(baseState(), { taskId: 't1', durationMin: 10, now: 1000 })
    expect(next.tasks[0].completedSessions).toBe(1)
    expect(next.sessions).toHaveLength(1)
    expect(next.sessions[0].completedAt).toBe(1000)
    expect(next.tasks[0].done).toBe(false)
  })

  it('marks the task done when it reaches its estimate', () => {
    const s1 = completeSession(baseState(), { taskId: 't1', durationMin: 10, now: 1 })
    const s2 = completeSession(s1, { taskId: 't1', durationMin: 10, now: 2 })
    expect(s2.tasks[0].completedSessions).toBe(2)
    expect(s2.tasks[0].done).toBe(true)
  })

  it('does not mutate the input state', () => {
    const state = baseState()
    completeSession(state, { taskId: 't1', durationMin: 10, now: 1 })
    expect(state.tasks[0].completedSessions).toBe(0)
    expect(state.sessions).toHaveLength(0)
  })

  it('leaves other tasks untouched', () => {
    const state = baseState()
    state.tasks.push({
      id: 't2', projectId: 'p1', title: 'x',
      estimatedSessions: 3, completedSessions: 1, order: 1, done: false,
    })
    const next = completeSession(state, { taskId: 't1', durationMin: 10, now: 1 })
    expect(next.tasks.find((t) => t.id === 't2')!.completedSessions).toBe(1)
  })
})

describe('abandonSession', () => {
  it('records a session with completedAt null and no counter change', () => {
    const next = abandonSession(baseState(), { taskId: 't1', durationMin: 10, now: 500 })
    expect(next.tasks[0].completedSessions).toBe(0)
    expect(next.sessions).toHaveLength(1)
    expect(next.sessions[0].completedAt).toBeNull()
  })
})
