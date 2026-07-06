import { describe, it, expect } from 'vitest'
import { taskSegments, campFractions, currentFraction } from '../../src/domain/journey'
import type { Project, Task } from '../../src/domain/types'

const projects: Project[] = [
  { id: 'p1', northStarId: 'n', title: 'a', order: 0 },
  { id: 'p2', northStarId: 'n', title: 'b', order: 1 },
]

function tasks(): Task[] {
  return [
    { id: 't2', projectId: 'p1', title: 'x', estimatedSessions: 2, completedSessions: 2, order: 1, done: true },
    { id: 't1', projectId: 'p1', title: 'y', estimatedSessions: 2, completedSessions: 2, order: 0, done: true },
    { id: 't3', projectId: 'p2', title: 'z', estimatedSessions: 4, completedSessions: 1, order: 0, done: false },
  ]
}

describe('taskSegments', () => {
  it('orders by project order then task order and sizes by estimate', () => {
    const segs = taskSegments(projects, tasks())
    expect(segs.map((s) => s.taskId)).toEqual(['t1', 't2', 't3'])
    // total estimate = 8; t1 -> [0, .25], t2 -> [.25, .5], t3 -> [.5, 1]
    expect(segs[0]).toMatchObject({ start: 0, end: 0.25 })
    expect(segs[1]).toMatchObject({ start: 0.25, end: 0.5 })
    expect(segs[2]).toMatchObject({ start: 0.5, end: 1 })
  })

  it('returns [] when there are no tasks', () => {
    expect(taskSegments(projects, [])).toEqual([])
  })

  it('treats a task whose project is unknown as project order 0 and still tiles to 1', () => {
    const withGhost: Task[] = [
      ...tasks(),
      { id: 'tg', projectId: 'ghost', title: 'g', estimatedSessions: 2, completedSessions: 0, order: 9, done: false },
    ]
    const segs = taskSegments(projects, withGhost)
    // ghost project falls back to order 0 (?? 0), so it groups with p1;
    // within order 0 it sorts by task order: t1 (0), t2 (1), tg (9), then p2's t3
    expect(segs.map((s) => s.taskId)).toEqual(['t1', 't2', 'tg', 't3'])
    // segments remain contiguous and end at exactly 1
    expect(segs[0].start).toBe(0)
    for (let i = 1; i < segs.length; i++) {
      expect(segs[i].start).toBe(segs[i - 1].end)
    }
    expect(segs[segs.length - 1].end).toBe(1)
  })

  it('gives a zero-estimate task a zero-width segment and lets the rest span to 1', () => {
    const mixed: Task[] = [
      { id: 'z0', projectId: 'p1', title: 'zero', estimatedSessions: 0, completedSessions: 0, order: 0, done: false },
      { id: 'z1', projectId: 'p1', title: 'two', estimatedSessions: 2, completedSessions: 0, order: 1, done: false },
    ]
    const segs = taskSegments(projects, mixed)
    expect(segs.map((s) => s.taskId)).toEqual(['z0', 'z1'])
    // zero-estimate task collapses to a point
    expect(segs[0].start).toBe(segs[0].end)
    expect(segs[0]).toMatchObject({ start: 0, end: 0 })
    // the valid task occupies the full remaining span
    expect(segs[1]).toMatchObject({ start: 0, end: 1 })
  })
})

describe('campFractions', () => {
  it('is the end fraction of each task', () => {
    expect(campFractions(projects, tasks())).toEqual([0.25, 0.5, 1])
  })
})

describe('currentFraction', () => {
  it('equals total completed / total estimated', () => {
    // completed = 2+2+1 = 5, estimated = 8
    expect(currentFraction(tasks())).toBeCloseTo(5 / 8)
  })
  it('is 0 with no tasks', () => {
    expect(currentFraction([])).toBe(0)
  })
})
