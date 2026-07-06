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

  it('invites adding a task and disables the play button when there are no tasks', () => {
    useStore.getState().setNorthStar('Launch', '')
    render(<HomeScreen onStart={() => {}} />)
    expect(screen.getByText('태스크를 추가해 여정을 시작하세요')).toBeInTheDocument()
    expect(screen.getByLabelText('세션 시작')).toBeDisabled()
  })
})
