import type { Project, Task } from './types'
import { northStarProgress } from './progress'

export interface Segment {
  taskId: string
  projectId: string
  start: number
  end: number
}

export function orderedTasks(projects: Project[], tasks: Task[]): Task[] {
  const projectOrder = new Map(projects.map((p) => [p.id, p.order]))
  return [...tasks].sort((a, b) => {
    const pa = projectOrder.get(a.projectId) ?? 0
    const pb = projectOrder.get(b.projectId) ?? 0
    if (pa !== pb) return pa - pb
    return a.order - b.order
  })
}

export function taskSegments(projects: Project[], tasks: Task[]): Segment[] {
  const ordered = orderedTasks(projects, tasks)
  const total = ordered.reduce((s, t) => s + t.estimatedSessions, 0)
  if (total <= 0) return []
  let acc = 0
  return ordered.map((t) => {
    const start = acc / total
    acc += t.estimatedSessions
    return { taskId: t.id, projectId: t.projectId, start, end: acc / total }
  })
}

export function campFractions(projects: Project[], tasks: Task[]): number[] {
  return taskSegments(projects, tasks).map((s) => s.end)
}

export function currentFraction(tasks: Task[]): number {
  return northStarProgress(tasks)
}
