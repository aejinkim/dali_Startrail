# Startrail MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Startrail MVP — a mobile web pomodoro app where every focus session is a step along a contour journey map toward a single north-star goal, with a dual light(map)/dark(dial) mode.

**Architecture:** Pure TypeScript domain layer (`src/domain/`) holds all entity + progress + journey-layout logic and is unit-tested with Vitest — zero React. A Zustand store (`src/store/`) wraps the domain, persists to localStorage, and is the single source of truth. React screens/components (`src/screens/`, `src/components/`) are thin renderers. The journey map is a single SVG `<path>`; progress is a 0–1 fraction mapped onto it via `getPointAtLength`, so camps, the character, and the walked/remaining split all derive from one number.

**Tech Stack:** Vite, React 19 (vite@latest react-ts template), TypeScript, Zustand, Vitest + @testing-library/react, plain CSS with design-token custom properties.

**Scope:** MVP only, per spec §10 — north-star/project/task CRUD, session timer + dual-mode transition, journey map (static SVG + advance animation), character 2 states (idle/walking), localStorage. Records screen, onboarding cinematics, sound, and account sync are explicitly out of scope and appear as a stub tab only.

**Reference spec:** `docs/superpowers/specs/2026-07-06-north-star-trail-redesign-design.md`

---

## File Structure

```
legacy/                         # old vanilla app, moved for reference only
index.html                      # Vite entry
vite.config.ts                  # Vite + Vitest config
tsconfig.json
package.json
src/
  main.tsx                      # React mount
  App.tsx                       # shell: tab routing + theme class
  domain/
    types.ts                    # NorthStar, Project, Task, Session, AppState
    ids.ts                      # newId()
    progress.ts                 # taskProgress, projectProgress, northStarProgress
    session.ts                  # completeSession, abandonSession (pure state transitions)
    journey.ts                  # taskSegments, campFractions, currentFraction
  store/
    useStore.ts                 # Zustand store + localStorage persist + actions
  screens/
    HomeScreen.tsx              # journey map + fixed current-task card
    FocusScreen.tsx             # dark dial timer + session flow
    ProjectsScreen.tsx          # north-star / project / task CRUD
    RecordsScreen.tsx           # stub ("이후 단계")
    OnboardingScreen.tsx        # minimal set-north-star
  components/
    JourneyMap.tsx              # contour SVG, trail, camps, summit, character
    Character.tsx               # explorer SVG, idle/walking
    TabBar.tsx                  # 여정 / 프로젝트 / 기록
    DialTimer.tsx               # dark tan-ring dial + red needle
  styles/
    tokens.css                  # CSS custom properties (light + dark)
    global.css                  # resets + base layout
tests/
  domain/
    progress.test.ts
    session.test.ts
    journey.test.ts
  store/
    useStore.test.ts
  components/
    JourneyMap.test.tsx
    HomeScreen.test.tsx
```

---

## Task 0: Archive legacy, scaffold Vite + React + TS + Vitest

**Files:**
- Move: `index.html`, `app.js`, `styles.css`, `assets/` → `legacy/`
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/global.css`

- [ ] **Step 1: Move legacy files out of the way**

```bash
cd ~/Projects/dali_timetimer
mkdir -p legacy
git mv index.html app.js styles.css assets legacy/
```

Expected: `git status` shows the four paths renamed under `legacy/`. `README.md`, `AGENTS.md`, `docs/`, `.gitignore` stay at root.

- [ ] **Step 2: Scaffold with Vite (non-interactive), then overwrite generated files**

```bash
cd ~/Projects/dali_timetimer
npm create vite@latest . -- --template react-ts
```

If prompted about a non-empty directory, choose "Ignore files and continue". This creates `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, and boilerplate we will replace in later steps.

- [ ] **Step 3: Add app + test dependencies**

```bash
cd ~/Projects/dali_timetimer
npm install zustand
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/coverage-v8
npm install
```

Expected: installs complete with no errors; `node_modules/` present (already gitignored via `node_modules/`).

- [ ] **Step 4: Configure Vitest in `vite.config.ts`**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 5: Create the test setup file**

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add scripts to `package.json`**

In `package.json`, ensure the `scripts` block contains:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 7: Add jsdom `getPointAtLength` note as a smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs a passing test', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 8: Run the smoke test**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: archive legacy app, scaffold Vite + React + TS + Vitest"
```

---

## Task 1: Domain types and id helper

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/ids.ts`
- Test: `tests/domain/ids.test.ts`

- [ ] **Step 1: Write the failing test for id uniqueness**

Create `tests/domain/ids.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { newId } from '../../src/domain/ids'

describe('newId', () => {
  it('returns a non-empty string', () => {
    expect(newId().length).toBeGreaterThan(0)
  })

  it('returns distinct values across calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()))
    expect(ids.size).toBe(1000)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/domain/ids.test.ts`
Expected: FAIL — cannot resolve `src/domain/ids`.

- [ ] **Step 3: Implement `ids.ts`**

Create `src/domain/ids.ts`:

```ts
export function newId(): string {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/domain/ids.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Create `types.ts` (no test — types only)**

Create `src/domain/types.ts`:

```ts
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
```

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/ids.ts tests/domain/ids.test.ts
git commit -m "feat: domain types and id helper"
```

---

## Task 2: Progress calculations

**Files:**
- Create: `src/domain/progress.ts`
- Test: `tests/domain/progress.test.ts`

Rules (spec §3): task = completed/estimated clamped to [0,1]; project = sum of per-task clamped completed / sum estimated over its tasks; north star = same over all tasks. Per-task clamping matters: an over-completed task (5 done of 2 estimated) must not push the aggregate — and the character on the map — past work that hasn't happened. Empty denominator → 0.

- [ ] **Step 1: Write the failing tests**

Create `tests/domain/progress.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/domain/progress.test.ts`
Expected: FAIL — cannot resolve `src/domain/progress`.

- [ ] **Step 3: Implement `progress.ts`**

Create `src/domain/progress.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/domain/progress.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/progress.ts tests/domain/progress.test.ts
git commit -m "feat: task/project/north-star progress calculations"
```

---

## Task 3: Session completion and abandonment

**Files:**
- Create: `src/domain/session.ts`
- Test: `tests/domain/session.test.ts`

Behavior (spec §6): completing a session appends a `Session` with `completedAt` set, increments the task's `completedSessions`, and marks the task `done` when `completedSessions >= estimatedSessions`. Abandoning appends a `Session` with `completedAt: null` and changes no task counters (no partial credit). Both are pure: `(AppState, args) => AppState`.

- [ ] **Step 1: Write the failing tests**

Create `tests/domain/session.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/domain/session.test.ts`
Expected: FAIL — cannot resolve `src/domain/session`.

- [ ] **Step 3: Implement `session.ts`**

Create `src/domain/session.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/domain/session.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/session.ts tests/domain/session.test.ts
git commit -m "feat: session complete/abandon state transitions"
```

---

## Task 4: Journey layout math

**Files:**
- Create: `src/domain/journey.ts`
- Test: `tests/domain/journey.test.ts`

The journey is one path of length 1 (fraction space). Each task occupies a slice proportional to its `estimatedSessions`. Tasks are ordered by project `order`, then task `order`. `taskSegments` returns `{ taskId, start, end }` in fraction space. `campFractions` returns the `end` of each task (a camp marker). `currentFraction` = north-star progress (0–1) — where the character stands.

- [ ] **Step 1: Write the failing tests**

Create `tests/domain/journey.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/domain/journey.test.ts`
Expected: FAIL — cannot resolve `src/domain/journey`.

- [ ] **Step 3: Implement `journey.ts`**

Create `src/domain/journey.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/domain/journey.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/journey.ts tests/domain/journey.test.ts
git commit -m "feat: journey layout fraction math"
```

---

## Task 5: Zustand store with localStorage persistence

**Files:**
- Create: `src/store/useStore.ts`
- Test: `tests/store/useStore.test.ts`

The store holds `AppState` plus actions. Actions delegate to domain functions for session logic and implement straightforward CRUD for entities. Persistence uses Zustand's `persist` middleware with key `startrail-state`.

- [ ] **Step 1: Write the failing tests**

Create `tests/store/useStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../../src/store/useStore'
import { EMPTY_STATE } from '../../src/domain/types'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ ...EMPTY_STATE })
})

describe('useStore CRUD', () => {
  it('sets the north star', () => {
    useStore.getState().setNorthStar('Launch brand', 'toward my star')
    const ns = useStore.getState().northStar
    expect(ns?.title).toBe('Launch brand')
    expect(ns?.statement).toBe('toward my star')
  })

  it('adds a project and a task, then activates the task', () => {
    const s = useStore.getState()
    s.setNorthStar('Launch', '')
    const pid = useStore.getState().addProject('Branding')
    const tid = useStore.getState().addTask(pid, 'Logo drafts', 4)
    const state = useStore.getState()
    expect(state.projects).toHaveLength(1)
    expect(state.tasks[0].projectId).toBe(pid)
    expect(state.tasks[0].estimatedSessions).toBe(4)
    expect(state.activeTaskId).toBe(tid)
  })

  it('finishing a session advances the active task', () => {
    const s = useStore.getState()
    s.setNorthStar('Launch', '')
    const pid = s.addProject('Branding')
    const tid = useStore.getState().addTask(pid, 'Logo', 2)
    useStore.getState().finishSession(tid, 10)
    expect(useStore.getState().tasks[0].completedSessions).toBe(1)
  })
})

describe('useStore persistence', () => {
  it('writes to localStorage under startrail-state', () => {
    useStore.getState().setNorthStar('Persist me', '')
    expect(localStorage.getItem('startrail-state')).toContain('Persist me')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/store/useStore.test.ts`
Expected: FAIL — cannot resolve `src/store/useStore`.

- [ ] **Step 3: Implement `useStore.ts`**

Create `src/store/useStore.ts`:

```ts
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
        })),

      reset: () => set({ ...EMPTY_STATE }),
    }),
    { name: 'startrail-state' },
  ),
)
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/store/useStore.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/useStore.ts tests/store/useStore.test.ts
git commit -m "feat: zustand store with localStorage persistence"
```

---

## Task 6: Design tokens and global styles

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

Colors come straight from spec §8.

- [ ] **Step 1: Create `tokens.css`**

Create `src/styles/tokens.css`:

```css
:root {
  --cream: #E8E4DB;
  --paper: #F4F1EA;
  --ink: #2B2925;
  --orange: #E8562A;
  --amber: #E8983A;
  --border: #D8D3C7;
  --contour: #DDD8CC;
  --muted: #8A857A;

  --charcoal: #1B1A17;
  --tan: #A89C82;
  --ivory: #EDE6D6;
  --needle: #D94F35;
  --track: #33312B;
  --dark-muted: #8A8272;
  --serif-label: #C7BBA3;

  --mono: ui-monospace, "SF Mono", Menlo, monospace;
  --serif: Georgia, "Times New Roman", serif;
  --sans: system-ui, -apple-system, "Segoe UI", sans-serif;

  --radius: 12px;
  --maxw: 430px;
}
```

- [ ] **Step 2: Create `global.css`**

Create `src/styles/global.css`:

```css
@import './tokens.css';

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root { height: 100%; }

body {
  font-family: var(--sans);
  background: var(--cream);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

.app {
  max-width: var(--maxw);
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.app.dark { background: var(--charcoal); color: var(--ivory); }

button { font-family: inherit; cursor: pointer; border: none; background: none; }

.mono { font-family: var(--mono); }
.serif-italic { font-family: var(--serif); font-style: italic; }
```

- [ ] **Step 3: Import global styles in `main.tsx`**

Replace `src/main.tsx` with:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 4: Delete leftover Vite boilerplate styles**

```bash
cd ~/Projects/dali_timetimer
rm -f src/App.css src/index.css src/assets/react.svg src/assets/hero.png src/assets/vite.svg public/icons.svg
```

Vite 8 template ships extra boilerplate (hero.png, vite.svg, icons.svg, .oxlintrc.json, oxlint `lint` script) not present in older templates; .oxlintrc.json and the lint script are kept intentionally. Replace public/favicon.svg content with the north-star icon from legacy/assets/north-star.svg so index.html's icon link stays valid.

Expected: files removed (they were Vite boilerplate; App.tsx is rewritten in Task 7).

- [ ] **Step 5: Commit**

```bash
git add src/styles/ src/main.tsx
git commit -m "feat: design tokens and global styles"
```

---

## Task 7: App shell, tab routing, and theme

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/TabBar.tsx`
- Create: `src/screens/RecordsScreen.tsx`

The shell is a tiny state machine over screens: `onboarding` (when no north star), else one of `journey` / `projects` / `records`, plus a full-screen `focus` overlay. Light theme everywhere except focus. HomeScreen, ProjectsScreen, OnboardingScreen, FocusScreen are built in later tasks; for this task, create temporary placeholders so the app compiles, then replace them.

- [ ] **Step 1: Create the RecordsScreen stub**

Create `src/screens/RecordsScreen.tsx`:

```tsx
export default function RecordsScreen() {
  return (
    <div style={{ padding: '2rem 1.25rem' }}>
      <h2 style={{ fontSize: 18, fontWeight: 500 }}>기록</h2>
      <p style={{ marginTop: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        걸어온 거리와 주간 리듬이 여기에 담깁니다. 다음 단계에서 열립니다.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create `TabBar.tsx`**

Create `src/components/TabBar.tsx`:

```tsx
export type Tab = 'journey' | 'projects' | 'records'

const TABS: { id: Tab; label: string }[] = [
  { id: 'journey', label: '여정' },
  { id: 'projects', label: '프로젝트' },
  { id: 'records', label: '기록' },
]

export default function TabBar({
  active,
  onChange,
}: {
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <nav style={{ display: 'flex', gap: 8, padding: '10px 14px 16px' }}>
      {TABS.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 8,
              fontSize: 12,
              background: on ? 'var(--ink)' : 'var(--paper)',
              color: on ? 'var(--paper)' : 'var(--muted)',
              border: on ? 'none' : '1px solid var(--border)',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3: Create temporary placeholder screens so App compiles**

Create `src/screens/HomeScreen.tsx`:

```tsx
export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
      <h2 style={{ fontSize: 18, fontWeight: 500 }}>여정</h2>
      <button onClick={onStart} style={{ marginTop: 16, color: 'var(--orange)' }}>
        세션 시작 (placeholder)
      </button>
    </div>
  )
}
```

Create `src/screens/ProjectsScreen.tsx`:

```tsx
export default function ProjectsScreen() {
  return <div style={{ padding: '1rem 1.25rem' }}>프로젝트 (placeholder)</div>
}
```

Create `src/screens/OnboardingScreen.tsx`:

```tsx
export default function OnboardingScreen() {
  return <div style={{ padding: '1rem 1.25rem' }}>온보딩 (placeholder)</div>
}
```

Create `src/screens/FocusScreen.tsx`:

```tsx
export default function FocusScreen({ onExit }: { onExit: () => void }) {
  return (
    <div style={{ padding: '1rem 1.25rem' }}>
      <button onClick={onExit}>나가기 (placeholder)</button>
    </div>
  )
}
```

- [ ] **Step 4: Create `App.tsx`**

Create `src/App.tsx`:

```tsx
import { useState } from 'react'
import { useStore } from './store/useStore'
import TabBar, { type Tab } from './components/TabBar'
import HomeScreen from './screens/HomeScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import RecordsScreen from './screens/RecordsScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import FocusScreen from './screens/FocusScreen'

export default function App() {
  const northStar = useStore((s) => s.northStar)
  const [tab, setTab] = useState<Tab>('journey')
  const [focus, setFocus] = useState(false)

  if (!northStar) {
    return (
      <div className="app dark">
        <OnboardingScreen />
      </div>
    )
  }

  if (focus) {
    return (
      <div className="app dark">
        <FocusScreen onExit={() => setFocus(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {tab === 'journey' && <HomeScreen onStart={() => setFocus(true)} />}
        {tab === 'projects' && <ProjectsScreen />}
        {tab === 'records' && <RecordsScreen />}
      </div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
```

- [ ] **Step 5: Verify it builds and runs**

Run: `npm run build`
Expected: `tsc` + Vite build succeed with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/TabBar.tsx src/screens/
git commit -m "feat: app shell, tab routing, theme, screen placeholders"
```

---

## Task 8: JourneyMap SVG component

**Files:**
- Create: `src/components/JourneyMap.tsx`
- Create: `src/components/Character.tsx`
- Test: `tests/components/JourneyMap.test.tsx`

The map draws contour ellipses (one cluster per project), a fixed trail path, a solid-orange walked portion, a dashed remaining portion, camp dots at each `campFractions` value, a summit star, and the character at `currentFraction`. Marker positions are computed from the SVG path via `getPointAtLength`. Because jsdom does not implement `getTotalLength`/`getPointAtLength`, the component must accept an injectable sampler so it is testable; default uses the real SVG API.

- [ ] **Step 1: Write the failing test**

Create `tests/components/JourneyMap.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import JourneyMap from '../../src/components/JourneyMap'
import type { Project, Task } from '../../src/domain/types'

const projects: Project[] = [
  { id: 'p1', northStarId: 'n', title: 'Branding', order: 0 },
]
const tasks: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Logo', estimatedSessions: 4, completedSessions: 1, order: 0, done: false },
]

// deterministic sampler: point at fraction f on a 100x100 diagonal
const sampler = (f: number) => ({ x: f * 100, y: f * 100 })

describe('JourneyMap', () => {
  it('renders a camp marker for each task and a character group', () => {
    const { container } = render(
      <JourneyMap projects={projects} tasks={tasks} sampler={sampler} />,
    )
    expect(container.querySelectorAll('[data-camp]')).toHaveLength(1)
    expect(container.querySelector('[data-character]')).not.toBeNull()
  })

  it('places the character at the current fraction via the sampler', () => {
    const { container } = render(
      <JourneyMap projects={projects} tasks={tasks} sampler={sampler} />,
    )
    // currentFraction = 1/4 -> sampler -> (25, 25)
    const ch = container.querySelector('[data-character]') as SVGGElement
    expect(ch.getAttribute('transform')).toContain('25')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/components/JourneyMap.test.tsx`
Expected: FAIL — cannot resolve `src/components/JourneyMap`.

- [ ] **Step 3: Create `Character.tsx`**

Create `src/components/Character.tsx`:

```tsx
export default function Character({ walking = false }: { walking?: boolean }) {
  return (
    <g data-character-body>
      <circle cx="0" cy="0" r="9" fill="#FFFFFF" stroke="var(--ink)" strokeWidth="1.3" />
      <circle cx="-3.5" cy="-1.5" r="1.3" fill="var(--ink)" />
      <circle cx="3.5" cy="-1.5" r="1.3" fill="var(--ink)" />
      <path
        d={walking ? 'M-2.5 3.5 q2.5 3 5 0' : 'M-2.5 3 q2.5 2 5 0'}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.1"
      />
      <circle cx="6" cy="-4" r="3" fill="var(--orange)" />
    </g>
  )
}
```

- [ ] **Step 4: Create `JourneyMap.tsx`**

Create `src/components/JourneyMap.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import type { Project, Task } from '../domain/types'
import { campFractions, currentFraction } from '../domain/journey'
import Character from './Character'

interface Point { x: number; y: number }
type Sampler = (fraction: number) => Point

const VIEW_W = 220
const VIEW_H = 250

// Fixed decorative trail from bottom-left up to the summit near top.
const TRAIL_D =
  'M25 235 C 55 225, 45 210, 60 200 C 78 188, 95 180, 118 168 ' +
  'C 140 156, 148 152, 150 150 C 152 130, 130 110, 112 95 C 103 88, 97 84, 95 80'

const CONTOURS = [
  { cx: 60, cy: 200 }, { cx: 150, cy: 150 }, { cx: 95, cy: 80 },
]

export default function JourneyMap({
  projects,
  tasks,
  walking = false,
  sampler: injectedSampler,
}: {
  projects: Project[]
  tasks: Task[]
  walking?: boolean
  sampler?: Sampler
}) {
  const pathRef = useRef<SVGPathElement>(null)
  const [sampler, setSampler] = useState<Sampler | null>(injectedSampler ?? null)

  useEffect(() => {
    if (injectedSampler) return
    const path = pathRef.current
    if (!path || typeof path.getTotalLength !== 'function') return
    const len = path.getTotalLength()
    setSampler(() => (f: number) => {
      const pt = path.getPointAtLength(Math.max(0, Math.min(1, f)) * len)
      return { x: pt.x, y: pt.y }
    })
  }, [injectedSampler])

  const camps = campFractions(projects, tasks)
  const current = currentFraction(tasks)

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="북극성으로 향하는 여정 지도"
    >
      <path
        d="M110 22 l3.5 7 7.5 1 -5.5 5.5 1.5 7.5 -7 -3.8 -7 3.8 1.5 -7.5 -5.5 -5.5 7.5 -1 z"
        fill="var(--amber)"
      />
      {CONTOURS.map((c, i) => (
        <g key={i} fill="none" stroke="var(--contour)" strokeWidth="1">
          <ellipse cx={c.cx} cy={c.cy} rx="46" ry="28" />
          <ellipse cx={c.cx} cy={c.cy} rx="30" ry="17" />
          <ellipse cx={c.cx} cy={c.cy} rx="14" ry="8" />
        </g>
      ))}

      <path ref={pathRef} d={TRAIL_D} fill="none" stroke="transparent" />
      <path d={TRAIL_D} fill="none" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="1 6" strokeLinecap="round" />

      {sampler && (
        <>
          {camps.map((f, i) => {
            const p = sampler(f)
            const isSummit = i === camps.length - 1
            return (
              <circle
                key={i}
                data-camp
                cx={p.x}
                cy={p.y}
                r={isSummit ? 6 : 4}
                fill="var(--paper)"
                stroke={isSummit ? 'var(--ink)' : 'var(--amber)'}
                strokeWidth={isSummit ? 1.5 : 2}
              />
            )
          })}
          <WalkedTrail sampler={sampler} to={current} />
          <g data-character transform={`translate(${sampler(current).x} ${sampler(current).y})`}>
            <Character walking={walking} />
          </g>
        </>
      )}
    </svg>
  )
}

function WalkedTrail({ sampler, to }: { sampler: Sampler; to: number }) {
  const steps = 40
  const pts: string[] = []
  const end = Math.max(0, Math.min(1, to))
  for (let i = 0; i <= steps; i++) {
    const f = (end * i) / steps
    const p = sampler(f)
    pts.push(`${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
  }
  return <path d={pts.join(' ')} fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" />
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- tests/components/JourneyMap.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/JourneyMap.tsx src/components/Character.tsx tests/components/JourneyMap.test.tsx
git commit -m "feat: journey map SVG with camps, walked trail, character"
```

---

## Task 9: Home screen — map plus fixed current-task card

**Files:**
- Modify: `src/screens/HomeScreen.tsx` (replace placeholder)
- Test: `tests/components/HomeScreen.test.tsx`

Home shows: header with north-star title + overall progress %, the JourneyMap filling the space, and a fixed dark card at the bottom naming the active task with its session count and a play button that calls `onStart`. If there is no active task, the card invites the user to add one.

- [ ] **Step 1: Write the failing test**

Create `tests/components/HomeScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomeScreen from '../../src/screens/HomeScreen'
import { useStore } from '../../src/store/useStore'
import { EMPTY_STATE } from '../../src/domain/types'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ ...EMPTY_STATE })
})

describe('HomeScreen', () => {
  it('shows the north-star title and overall progress', () => {
    const s = useStore.getState()
    s.setNorthStar('브랜딩 런칭', '')
    const pid = s.addProject('Branding')
    useStore.getState().addTask(pid, 'Logo', 4)
    useStore.getState().finishSession(useStore.getState().tasks[0].id, 10)
    render(<HomeScreen onStart={() => {}} />)
    expect(screen.getByText('브랜딩 런칭')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('calls onStart when the play button is pressed', () => {
    const s = useStore.getState()
    s.setNorthStar('Launch', '')
    const pid = s.addProject('Branding')
    useStore.getState().addTask(pid, 'Logo', 4)
    const onStart = vi.fn()
    render(<HomeScreen onStart={onStart} />)
    fireEvent.click(screen.getByLabelText('세션 시작'))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/components/HomeScreen.test.tsx`
Expected: FAIL — placeholder HomeScreen renders none of the expected text/labels.

- [ ] **Step 3: Replace `HomeScreen.tsx`**

Replace `src/screens/HomeScreen.tsx` with:

```tsx
import { useStore } from '../store/useStore'
import { northStarProgress } from '../domain/progress'
import JourneyMap from '../components/JourneyMap'

export default function HomeScreen({ onStart }: { onStart: () => void }) {
  const northStar = useStore((s) => s.northStar)
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const activeTaskId = useStore((s) => s.activeTaskId)

  const pct = Math.round(northStarProgress(tasks) * 100)
  const active = tasks.find((t) => t.id === activeTaskId && !t.done)
    ?? tasks.find((t) => !t.done)
    ?? null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 14px 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--muted)' }}>
            NORTH STAR
          </div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{northStar?.title}</div>
        </div>
        <div className="mono" style={{ fontSize: 14, color: 'var(--orange)' }}>{pct}%</div>
      </header>

      <div
        style={{
          flex: 1,
          marginTop: 10,
          background: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          minHeight: 320,
        }}
      >
        <JourneyMap projects={projects} tasks={tasks} />

        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 10,
            background: 'var(--ink)',
            borderRadius: 12,
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--paper)', fontWeight: 500 }}>
              {active ? active.title : '태스크를 추가해 여정을 시작하세요'}
            </div>
            {active && (
              <div className="mono" style={{ fontSize: 9, color: '#A8A296', marginTop: 2 }}>
                SESSION {active.completedSessions}/{active.estimatedSessions}
              </div>
            )}
          </div>
          <button
            aria-label="세션 시작"
            disabled={!active}
            onClick={onStart}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              flexShrink: 0,
              background: active ? 'var(--orange)' : 'var(--track)',
              color: 'var(--paper)',
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/components/HomeScreen.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx tests/components/HomeScreen.test.tsx
git commit -m "feat: home screen with journey map and current-task card"
```

---

## Task 10: Focus mode — dark dial timer and session flow

**Files:**
- Create: `src/components/DialTimer.tsx`
- Modify: `src/screens/FocusScreen.tsx` (replace placeholder)
- Test: `tests/components/DialTimer.test.tsx`

DialTimer is a pure presentational SVG: given `remainingMs` and `totalMs`, it draws a tan arc that shrinks and a red needle. FocusScreen owns the countdown with `setInterval`, shows the active task's session length (default 10 min), and on natural completion calls `finishSession` then `onExit`; a cancel button calls `onExit` without crediting a session (abandonment is not persisted in MVP — only completed sessions advance the trail, matching spec §6 "no partial credit").

- [ ] **Step 1: Write the failing test for DialTimer geometry**

Create `tests/components/DialTimer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import DialTimer from '../../src/components/DialTimer'

describe('DialTimer', () => {
  it('renders the remaining time as mm:ss', () => {
    const { getByText } = render(<DialTimer remainingMs={83_000} totalMs={600_000} label="LOGO" />)
    expect(getByText('01:23')).toBeInTheDocument()
  })

  it('renders a progress arc element', () => {
    const { container } = render(<DialTimer remainingMs={300_000} totalMs={600_000} label="X" />)
    expect(container.querySelector('[data-arc]')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/components/DialTimer.test.tsx`
Expected: FAIL — cannot resolve `src/components/DialTimer`.

- [ ] **Step 3: Create `DialTimer.tsx`**

Create `src/components/DialTimer.tsx`:

```tsx
const R = 78
const CIRC = 2 * Math.PI * R

function mmss(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DialTimer({
  remainingMs,
  totalMs,
  label,
}: {
  remainingMs: number
  totalMs: number
  label: string
}) {
  const frac = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  const angle = -Math.PI / 2 + (1 - frac) * 2 * Math.PI
  const nx = 100 + R * Math.cos(angle)
  const ny = 100 + R * Math.sin(angle)

  return (
    <svg viewBox="0 0 200 200" width="82%" role="img" aria-label="집중 타이머">
      <circle cx="100" cy="100" r={R} fill="none" stroke="var(--track)" strokeWidth="16" />
      <circle
        data-arc
        cx="100"
        cy="100"
        r={R}
        fill="none"
        stroke="var(--tan)"
        strokeWidth="16"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - frac)}
        transform="rotate(-90 100 100)"
        strokeLinecap="butt"
      />
      <line x1="100" y1="100" x2={nx} y2={ny} stroke="var(--needle)" strokeWidth="2" />
      <circle cx="100" cy="100" r="3" fill="var(--needle)" />
      <text x="100" y="96" textAnchor="middle" className="mono" fill="var(--ivory)" fontSize="26">
        {mmss(remainingMs)}
      </text>
      <text x="100" y="116" textAnchor="middle" fill="var(--dark-muted)" fontSize="8" letterSpacing="1.5">
        {label}
      </text>
    </svg>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/components/DialTimer.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Replace `FocusScreen.tsx`**

Replace `src/screens/FocusScreen.tsx` with:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import DialTimer from '../components/DialTimer'

const DEFAULT_MIN = 10

export default function FocusScreen({ onExit }: { onExit: () => void }) {
  const tasks = useStore((s) => s.tasks)
  const activeTaskId = useStore((s) => s.activeTaskId)
  const finishSession = useStore((s) => s.finishSession)

  const active = tasks.find((t) => t.id === activeTaskId && !t.done) ?? tasks.find((t) => !t.done)
  const totalMs = DEFAULT_MIN * 60_000

  const [remainingMs, setRemainingMs] = useState(totalMs)
  const endRef = useRef(Date.now() + totalMs)
  const doneRef = useRef(false)

  useEffect(() => {
    endRef.current = Date.now() + totalMs
    const id = setInterval(() => {
      const left = endRef.current - Date.now()
      if (left <= 0 && !doneRef.current) {
        doneRef.current = true
        clearInterval(id)
        if (active) finishSession(active.id, DEFAULT_MIN)
        setRemainingMs(0)
        onExit()
        return
      }
      setRemainingMs(Math.max(0, left))
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!active) {
    return (
      <div style={{ padding: '2rem 1.25rem' }}>
        <p>진행할 태스크가 없습니다.</p>
        <button onClick={onExit} style={{ marginTop: 16, color: 'var(--needle)' }}>돌아가기</button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 14 }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="serif-italic" style={{ fontSize: 14, color: 'var(--serif-label)' }}>Deep work</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--dark-muted)' }}>
          SESSION {active.completedSessions + 1}/{active.estimatedSessions}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <DialTimer remainingMs={remainingMs} totalMs={totalMs} label={active.title.slice(0, 14).toUpperCase()} />
      </div>

      <button
        aria-label="세션 취소"
        onClick={onExit}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid #4A463D', color: 'var(--dark-muted)',
          fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Run the full test suite and build**

Run: `npm test`
Expected: all tests PASS.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/DialTimer.tsx src/screens/FocusScreen.tsx tests/components/DialTimer.test.tsx
git commit -m "feat: focus mode dial timer and session countdown"
```

---

## Task 11: Projects screen — CRUD

**Files:**
- Modify: `src/screens/ProjectsScreen.tsx` (replace placeholder)
- Test: `tests/components/ProjectsScreen.test.tsx`

Lists projects with their tasks. Provides: add project (title), add task under a project (title + estimated sessions), set a task active, delete task, delete project. Uses store actions directly.

- [ ] **Step 1: Write the failing test**

Create `tests/components/ProjectsScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectsScreen from '../../src/screens/ProjectsScreen'
import { useStore } from '../../src/store/useStore'
import { EMPTY_STATE } from '../../src/domain/types'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ ...EMPTY_STATE })
  useStore.getState().setNorthStar('Launch', '')
})

describe('ProjectsScreen', () => {
  it('adds a project via the form', () => {
    render(<ProjectsScreen />)
    fireEvent.change(screen.getByPlaceholderText('새 프로젝트 이름'), { target: { value: 'Branding' } })
    fireEvent.click(screen.getByText('프로젝트 추가'))
    expect(useStore.getState().projects.map((p) => p.title)).toContain('Branding')
  })

  it('adds a task with an estimated session count', () => {
    const pid = useStore.getState().addProject('Branding')
    render(<ProjectsScreen />)
    fireEvent.change(screen.getByTestId(`task-title-${pid}`), { target: { value: 'Logo' } })
    fireEvent.change(screen.getByTestId(`task-sessions-${pid}`), { target: { value: '4' } })
    fireEvent.click(screen.getByTestId(`task-add-${pid}`))
    const task = useStore.getState().tasks.find((t) => t.title === 'Logo')
    expect(task?.estimatedSessions).toBe(4)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/components/ProjectsScreen.test.tsx`
Expected: FAIL — placeholder screen has no form controls.

- [ ] **Step 3: Replace `ProjectsScreen.tsx`**

Replace `src/screens/ProjectsScreen.tsx` with:

```tsx
import { useState } from 'react'
import { useStore } from '../store/useStore'
import { taskProgress } from '../domain/progress'

export default function ProjectsScreen() {
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const activeTaskId = useStore((s) => s.activeTaskId)
  const addProject = useStore((s) => s.addProject)
  const addTask = useStore((s) => s.addTask)
  const setActiveTask = useStore((s) => s.setActiveTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const deleteProject = useStore((s) => s.deleteProject)

  const [projectName, setProjectName] = useState('')
  const [draft, setDraft] = useState<Record<string, { title: string; sessions: string }>>({})

  const draftFor = (pid: string) => draft[pid] ?? { title: '', sessions: '4' }
  const setDraftFor = (pid: string, next: Partial<{ title: string; sessions: string }>) =>
    setDraft((d) => ({ ...d, [pid]: { ...draftFor(pid), ...next } }))

  return (
    <div style={{ padding: '1rem 1.25rem', overflowY: 'auto' }}>
      <h2 style={{ fontSize: 18, fontWeight: 500 }}>프로젝트</h2>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0 20px' }}>
        <input
          placeholder="새 프로젝트 이름"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={inputStyle}
        />
        <button
          onClick={() => {
            if (!projectName.trim()) return
            addProject(projectName.trim())
            setProjectName('')
          }}
          style={primaryBtn}
        >
          프로젝트 추가
        </button>
      </div>

      {projects.map((p) => {
        const pTasks = tasks.filter((t) => t.projectId === p.id)
        const d = draftFor(p.id)
        return (
          <div key={p.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14 }}>{p.title}</strong>
              <button onClick={() => deleteProject(p.id)} style={{ color: 'var(--muted)', fontSize: 12 }}>삭제</button>
            </div>

            {pTasks.map((t) => (
              <div key={t.id} style={taskRow}>
                <button
                  onClick={() => setActiveTask(t.id)}
                  style={{ fontSize: 13, color: t.id === activeTaskId ? 'var(--orange)' : 'var(--ink)' }}
                >
                  {t.id === activeTaskId ? '● ' : '○ '}{t.title}
                </button>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {t.completedSessions}/{t.estimatedSessions} · {Math.round(taskProgress(t) * 100)}%
                  <button onClick={() => deleteTask(t.id)} style={{ marginLeft: 8, color: 'var(--muted)' }}>×</button>
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input
                data-testid={`task-title-${p.id}`}
                placeholder="태스크"
                value={d.title}
                onChange={(e) => setDraftFor(p.id, { title: e.target.value })}
                style={{ ...inputStyle, flex: 2 }}
              />
              <input
                data-testid={`task-sessions-${p.id}`}
                type="number"
                min={1}
                value={d.sessions}
                onChange={(e) => setDraftFor(p.id, { sessions: e.target.value })}
                style={{ ...inputStyle, width: 56 }}
              />
              <button
                data-testid={`task-add-${p.id}`}
                onClick={() => {
                  if (!d.title.trim()) return
                  addTask(p.id, d.title.trim(), Number(d.sessions) || 1)
                  setDraftFor(p.id, { title: '', sessions: '4' })
                }}
                style={primaryBtn}
              >
                추가
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '8px 10px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--paper)', fontSize: 13,
}
const primaryBtn: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, background: 'var(--ink)', color: 'var(--paper)', fontSize: 12,
}
const card: React.CSSProperties = {
  background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 12,
  padding: '12px 14px', marginBottom: 12,
}
const taskRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/components/ProjectsScreen.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/screens/ProjectsScreen.tsx tests/components/ProjectsScreen.test.tsx
git commit -m "feat: projects screen with project/task CRUD"
```

---

## Task 12: Onboarding — set the north star

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx` (replace placeholder)
- Test: `tests/components/OnboardingScreen.test.tsx`

Minimal (spec MVP defers the cinematic intro): a dark screen with a star, a title input, and the ritual statement input. Submitting calls `setNorthStar`, which flips `App` into the main flow.

- [ ] **Step 1: Write the failing test**

Create `tests/components/OnboardingScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OnboardingScreen from '../../src/screens/OnboardingScreen'
import { useStore } from '../../src/store/useStore'
import { EMPTY_STATE } from '../../src/domain/types'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ ...EMPTY_STATE })
})

describe('OnboardingScreen', () => {
  it('sets the north star from the form', () => {
    render(<OnboardingScreen />)
    fireEvent.change(screen.getByPlaceholderText('예: 브랜드 첫 런칭'), { target: { value: '브랜딩 런칭' } })
    fireEvent.click(screen.getByText('여정 시작'))
    expect(useStore.getState().northStar?.title).toBe('브랜딩 런칭')
  })

  it('does nothing when the title is blank', () => {
    render(<OnboardingScreen />)
    fireEvent.click(screen.getByText('여정 시작'))
    expect(useStore.getState().northStar).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/components/OnboardingScreen.test.tsx`
Expected: FAIL — placeholder has no inputs.

- [ ] **Step 3: Replace `OnboardingScreen.tsx`**

Replace `src/screens/OnboardingScreen.tsx` with:

```tsx
import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function OnboardingScreen() {
  const setNorthStar = useStore((s) => s.setNorthStar)
  const [title, setTitle] = useState('')
  const [statement, setStatement] = useState('')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 1.5rem', gap: 20 }}>
      <div style={{ textAlign: 'center', fontSize: 40, color: 'var(--amber)' }}>★</div>
      <div style={{ textAlign: 'center' }}>
        <div className="serif-italic" style={{ fontSize: 18, color: 'var(--serif-label)' }}>
          당신의 북극성은 무엇인가요?
        </div>
        <p style={{ fontSize: 13, color: 'var(--dark-muted)', marginTop: 8, lineHeight: 1.6 }}>
          모든 집중이 향할 하나의 큰 목적을 정하세요.
        </p>
      </div>

      <input
        placeholder="예: 브랜드 첫 런칭"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={darkInput}
      />
      <input
        placeholder="이 시간은 나의 북극성을 향해 가고 있는가?"
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        style={darkInput}
      />

      <button
        onClick={() => {
          if (!title.trim()) return
          setNorthStar(title.trim(), statement.trim())
        }}
        style={{
          padding: '12px 0', borderRadius: 10, background: 'var(--needle)',
          color: 'var(--ivory)', fontSize: 14, fontWeight: 500,
        }}
      >
        여정 시작
      </button>
    </div>
  )
}

const darkInput: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 10, background: 'var(--track)',
  border: '1px solid #4A463D', color: 'var(--ivory)', fontSize: 14,
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tests/components/OnboardingScreen.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/screens/OnboardingScreen.tsx tests/components/OnboardingScreen.test.tsx
git commit -m "feat: onboarding screen to set the north star"
```

---

## Task 13: Character walk animation on session completion

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/screens/HomeScreen.tsx`
- Test: `tests/components/HomeScreen.test.tsx` (add a case)

When a session completes and focus mode exits, the character should briefly play the walking state as the trail advances. Implement by passing a transient `justFinished` flag from App → HomeScreen → JourneyMap, cleared after a timeout.

- [ ] **Step 1: Add the failing test case**

Append to `tests/components/HomeScreen.test.tsx`:

```tsx
import { act } from '@testing-library/react'

describe('HomeScreen walking state', () => {
  it('passes walking=true to the map when justFinished is set', () => {
    const s = useStore.getState()
    s.setNorthStar('Launch', '')
    const pid = s.addProject('Branding')
    useStore.getState().addTask(pid, 'Logo', 4)
    const { container } = render(<HomeScreen onStart={() => {}} justFinished />)
    // walking mouth path uses the 3.5 control point
    const body = container.querySelector('[data-character-body] path') as SVGPathElement
    expect(body.getAttribute('d')).toContain('3.5')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tests/components/HomeScreen.test.tsx`
Expected: FAIL — HomeScreen does not accept `justFinished`; type error / prop ignored.

- [ ] **Step 3: Thread the `justFinished` prop through HomeScreen**

In `src/screens/HomeScreen.tsx`, change the signature and pass it down:

```tsx
export default function HomeScreen({
  onStart,
  justFinished = false,
}: {
  onStart: () => void
  justFinished?: boolean
}) {
```

And update the JourneyMap usage:

```tsx
<JourneyMap projects={projects} tasks={tasks} walking={justFinished} />
```

- [ ] **Step 4: Manage the transient flag in `App.tsx`**

In `src/App.tsx`, replace the focus/exit handling so completing focus sets a brief walking flag. Update the component body:

```tsx
import { useState } from 'react'
import { useStore } from './store/useStore'
import TabBar, { type Tab } from './components/TabBar'
import HomeScreen from './screens/HomeScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import RecordsScreen from './screens/RecordsScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import FocusScreen from './screens/FocusScreen'

export default function App() {
  const northStar = useStore((s) => s.northStar)
  const [tab, setTab] = useState<Tab>('journey')
  const [focus, setFocus] = useState(false)
  const [justFinished, setJustFinished] = useState(false)

  if (!northStar) {
    return (
      <div className="app dark">
        <OnboardingScreen />
      </div>
    )
  }

  if (focus) {
    return (
      <div className="app dark">
        <FocusScreen
          onExit={() => {
            setFocus(false)
            setJustFinished(true)
            setTab('journey')
            setTimeout(() => setJustFinished(false), 2200)
          }}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {tab === 'journey' && <HomeScreen onStart={() => setFocus(true)} justFinished={justFinished} />}
        {tab === 'projects' && <ProjectsScreen />}
        {tab === 'records' && <RecordsScreen />}
      </div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
```

Note: `onExit` fires on both natural completion and cancel; in MVP both return to the map, and the walk flourish plays regardless (harmless — the trail only advances when a session was actually credited).

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- tests/components/HomeScreen.test.tsx`
Expected: PASS, all HomeScreen tests.

- [ ] **Step 6: Run full suite + build**

Run: `npm test`
Expected: all PASS.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/screens/HomeScreen.tsx tests/components/HomeScreen.test.tsx
git commit -m "feat: character walk flourish after finishing a session"
```

---

## Task 14: Manual verification and README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run the dev server and click through the core loop**

```bash
cd ~/Projects/dali_timetimer
npm run dev
```

Open the printed URL (default `http://localhost:5173`). Verify, in order:
1. First load shows the dark onboarding; entering a title + "여정 시작" reveals the map.
2. Projects tab: add a project, add a task with 2 estimated sessions.
3. Journey tab: the current-task card names the task; play ▶ opens the dark dial.
4. Let a session run (or shorten `DEFAULT_MIN` to 0.1 temporarily to speed up), confirm on completion it returns to the map and the character/percentage advanced.
5. Reload the page: state persists (localStorage).

- [ ] **Step 2: Update `README.md`**

Replace `README.md` with:

```markdown
# Startrail

A north-star pomodoro. Every focus session is a step along a contour journey
map toward one big goal. Light map view for planning, dark dial for focus.

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build && npm run preview
```

## Structure

- `src/domain/` — pure logic (types, progress, sessions, journey layout), unit-tested
- `src/store/useStore.ts` — Zustand store + localStorage persistence
- `src/screens/` — Onboarding, Home (journey), Focus, Projects, Records
- `src/components/` — JourneyMap, Character, DialTimer, TabBar
- `legacy/` — the previous vanilla-JS app, kept for reference only

See `docs/superpowers/specs/2026-07-06-north-star-trail-redesign-design.md` for the design concept.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README for Startrail"
```

- [ ] **Step 4: Push**

```bash
git push
```

---

## Self-Review Notes

- **Aggregate clamping (second-pass fix):** `ratio()` in Task 2 clamps each task's completed sessions to its estimate before summing, so an over-completed task cannot inflate project/north-star progress or move the character past unworked camps. `currentFraction` (Task 4) delegates to `northStarProgress`, so map position inherits the same rule.

- **Spec coverage:** §2 decisions → Tasks 5–13; §3 progress → Task 2; §4 journey rules → Tasks 4/8; §5 screens → Tasks 7–12 (Records is a stub per §10 scope); §6 session flow → Tasks 3/10/13; §7 character 2-state → Tasks 8/13 (축하/낮잠 states are out-of-MVP per §10); §8 visual system → Task 6 tokens; §9 legacy handling → Task 0. Records screen, onboarding cinematics, sound, and account sync are intentionally deferred (§10 "이후 단계").
- **Type consistency:** `AppState`, entity shapes, and action names (`setNorthStar`, `addProject`, `addTask`, `finishSession`, `setActiveTask`, `deleteTask`, `deleteProject`) are defined in Tasks 1/5 and used consistently thereafter. `campFractions`/`currentFraction`/`taskSegments` signatures are fixed in Task 4 and consumed unchanged in Task 8.
- **jsdom caveat:** `getPointAtLength` is unavailable in jsdom, so `JourneyMap` accepts an injectable `sampler` (Task 8) — tests use a deterministic sampler; the browser uses the real SVG API.
- **Abandonment:** `abandonSession` exists in the domain (Task 3) for completeness but the MVP FocusScreen cancel path does not persist it (spec §6 "no partial credit"); wiring it to a record is deferred with the Records screen.
