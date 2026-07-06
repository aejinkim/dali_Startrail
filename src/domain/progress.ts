import type { Task } from './types'

export function taskProgress(task: Task): number {
  if (task.estimatedSessions <= 0) return 0
  return Math.min(1, task.completedSessions / task.estimatedSessions)
}

function ratio(tasks: Task[]): number {
  const estimated = tasks.reduce((s, t) => s + t.estimatedSessions, 0)
  if (estimated <= 0) return 0
  const completed = tasks.reduce(
    (s, t) => s + Math.min(t.completedSessions, t.estimatedSessions),
    0,
  )
  return completed / estimated
}

export function projectProgress(projectId: string, tasks: Task[]): number {
  return ratio(tasks.filter((t) => t.projectId === projectId))
}

export function northStarProgress(tasks: Task[]): number {
  return ratio(tasks)
}
