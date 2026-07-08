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
