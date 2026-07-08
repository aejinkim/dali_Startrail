export interface NorthStar {
  id: string
  title: string
  statement: string
  createdAt: number
}

export interface Project {
  id: string
  northStarId: string
  title: string
  order: number
}

export interface Task {
  id: string
  projectId: string
  title: string
  estimatedSessions: number
  completedSessions: number
  order: number
  done: boolean
}

export interface Session {
  id: string
  taskId: string
  durationMin: number
  startedAt: number
  completedAt: number | null
}

export type SessionLength = 5 | 10 | 20

export interface AppState {
  northStar: NorthStar | null
  projects: Project[]
  tasks: Task[]
  sessions: Session[]
  activeTaskId: string | null
}

export const EMPTY_STATE: AppState = {
  northStar: null,
  projects: [],
  tasks: [],
  sessions: [],
  activeTaskId: null,
}
