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
