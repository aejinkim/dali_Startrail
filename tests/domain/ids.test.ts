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
