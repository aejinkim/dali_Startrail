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
