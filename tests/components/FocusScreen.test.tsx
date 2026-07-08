import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import FocusScreen from '../../src/screens/FocusScreen'
import { useStore } from '../../src/store/useStore'
import { EMPTY_STATE } from '../../src/domain/types'

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  useStore.setState({ ...EMPTY_STATE })
  const s = useStore.getState()
  s.setNorthStar('Launch', '')
  const pid = s.addProject('Branding')
  useStore.getState().addTask(pid, 'Logo', 2)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('FocusScreen', () => {
  it('credits exactly one session and exits on natural completion', () => {
    const onExit = vi.fn()
    render(<FocusScreen onExit={onExit} />)
    act(() => {
      vi.advanceTimersByTime(10 * 60_000 + 500)
    })
    expect(onExit).toHaveBeenCalledOnce()
    expect(useStore.getState().tasks[0].completedSessions).toBe(1)
  })

  it('cancel exits without crediting a session', () => {
    const onExit = vi.fn()
    const { getByLabelText } = render(<FocusScreen onExit={onExit} />)
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    fireEvent.click(getByLabelText('세션 취소'))
    expect(onExit).toHaveBeenCalledOnce()
    expect(useStore.getState().tasks[0].completedSessions).toBe(0)
  })
})
