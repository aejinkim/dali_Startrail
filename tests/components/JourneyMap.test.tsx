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

  it('renders the last camp as the summit with a larger radius', () => {
    const twoTasks: Task[] = [
      { id: 't1', projectId: 'p1', title: 'A', estimatedSessions: 2, completedSessions: 2, order: 0, done: true },
      { id: 't2', projectId: 'p1', title: 'B', estimatedSessions: 2, completedSessions: 0, order: 1, done: false },
    ]
    const { container } = render(
      <JourneyMap projects={projects} tasks={twoTasks} sampler={sampler} />,
    )
    const camps = container.querySelectorAll('[data-camp]')
    expect(camps).toHaveLength(2)
    expect(camps[0].getAttribute('r')).toBe('4')
    expect(camps[1].getAttribute('r')).toBe('6')
  })
})
