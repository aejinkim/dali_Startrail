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

  it('clears activeTaskId when its project is deleted', () => {
    const s = useStore.getState()
    s.setNorthStar('Launch', '')
    const pid = useStore.getState().addProject('Branding')
    useStore.getState().addTask(pid, 'Logo drafts', 4)
    useStore.getState().deleteProject(pid)
    const state = useStore.getState()
    expect(state.activeTaskId).toBeNull()
    expect(state.tasks).toHaveLength(0)
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
