import { describe, expect, it } from 'vitest'
import { clearHint, dismissHint, isHintDismissed } from './hint'

/** Minimal in-memory stand-in for localStorage (mirrors secrets.test.ts). */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  }
}

describe('isHintDismissed', () => {
  it('is false by default', () => {
    expect(isHintDismissed(fakeStorage())).toBe(false)
  })

  it('is true after dismissHint', () => {
    const storage = fakeStorage()
    dismissHint(storage)
    expect(isHintDismissed(storage)).toBe(true)
  })

  it('degrades to false when storage is unavailable', () => {
    const storage = fakeStorage()
    storage.getItem = () => {
      throw new Error('denied')
    }
    expect(isHintDismissed(storage)).toBe(false)
  })
})

describe('dismissHint', () => {
  it('never throws when storage is unavailable', () => {
    const storage = fakeStorage()
    storage.setItem = () => {
      throw new Error('denied')
    }
    expect(() => dismissHint(storage)).not.toThrow()
  })
})

describe('clearHint', () => {
  it('removes the dismissal', () => {
    const storage = fakeStorage()
    dismissHint(storage)
    clearHint(storage)
    expect(isHintDismissed(storage)).toBe(false)
    expect(storage.getItem('eightyears:hint')).toBeNull()
  })

  it('never throws when storage is unavailable', () => {
    const storage = fakeStorage()
    storage.removeItem = () => {
      throw new Error('denied')
    }
    expect(() => clearHint(storage)).not.toThrow()
  })
})
