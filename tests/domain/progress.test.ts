import { describe, it, expect } from 'vitest'
import { taskProgress, projectProgress, northStarProgress } from '../../src/domain/progress'
import type { Task } from '../../src/domain/types'

function task(partial: Partial<Task>): Task {
  return {
    id: 'x', projectId: 'p1', title: 't',
    estimatedSessions: 4, completedSessions: 0,
    order: 0, done: false, ...partial,
  }
}

describe('taskProgress', () => {
  it('is completed / estimated', () => {
    expect(taskProgress(task({ estimatedSessions: 4, completedSessions: 1 }))).toBe(0.25)
  })
  it('clamps to 1 when over-completed', () => {
    expect(taskProgress(task({ estimatedSessions: 2, completedSessions: 5 }))).toBe(1)
  })
  it('is 0 when estimated is 0', () => {
    expect(taskProgress(task({ estimatedSessions: 0, completedSessions: 3 }))).toBe(0)
  })
})

describe('projectProgress', () => {
  it('sums sessions across the project tasks', () => {
    const tasks = [
      task({ projectId: 'p1', estimatedSessions: 4, completedSessions: 2 }),
      task({ projectId: 'p1', estimatedSessions: 6, completedSessions: 1 }),
      task({ projectId: 'p2', estimatedSessions: 10, completedSessions: 10 }),
    ]
    expect(projectProgress('p1', tasks)).toBeCloseTo(3 / 10)
  })
  it('clamps each task before summing so over-completion does not inflate the aggregate', () => {
    const tasks = [
      task({ projectId: 'p1', estimatedSessions: 2, completedSessions: 5 }),
      task({ projectId: 'p1', estimatedSessions: 8, completedSessions: 0 }),
    ]
    expect(projectProgress('p1', tasks)).toBeCloseTo(2 / 10)
  })
  it('is 0 for a project with no tasks', () => {
    expect(projectProgress('pX', [])).toBe(0)
  })
})

describe('northStarProgress', () => {
  it('sums sessions across all tasks', () => {
    const tasks = [
      task({ estimatedSessions: 4, completedSessions: 2 }),
      task({ estimatedSessions: 6, completedSessions: 4 }),
    ]
    expect(northStarProgress(tasks)).toBeCloseTo(6 / 10)
  })
  it('is 0 with no tasks', () => {
    expect(northStarProgress([])).toBe(0)
  })
})
