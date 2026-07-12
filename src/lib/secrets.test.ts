import { describe, expect, it } from 'vitest'
import { eggId, loadFound, saveFound, totalSecrets } from './secrets'

/** Minimal in-memory stand-in for localStorage. */
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

function throwingStorage(): Storage {
  const s = fakeStorage()
  s.getItem = () => {
    throw new Error('denied')
  }
  s.setItem = () => {
    throw new Error('denied')
  }
  return s
}

describe('eggId', () => {
  it('is stable and readable', () => {
    expect(eggId('how-we-met', '🎬')).toBe('how-we-met:🎬')
  })
})

describe('totalSecrets', () => {
  it('counts every egg across eras', () => {
    expect(
      totalSecrets([{ easterEggs: [{}, {}] }, { easterEggs: [{}] }] as never),
    ).toBe(3)
  })
})

describe('loadFound / saveFound', () => {
  it('round-trips a set of ids', () => {
    const storage = fakeStorage()
    saveFound(new Set(['a:🎬', 'b:🍣']), storage)
    expect(loadFound(storage)).toEqual(new Set(['a:🎬', 'b:🍣']))
  })

  it('returns empty set when nothing stored', () => {
    expect(loadFound(fakeStorage())).toEqual(new Set())
  })

  it('returns empty set on corrupt JSON', () => {
    const storage = fakeStorage({ 'eightyears:secrets': '{not json' })
    expect(loadFound(storage)).toEqual(new Set())
  })

  it('ignores non-array JSON payloads', () => {
    const storage = fakeStorage({ 'eightyears:secrets': '{"a":1}' })
    expect(loadFound(storage)).toEqual(new Set())
  })

  it('never throws when storage is unavailable', () => {
    const storage = throwingStorage()
    expect(() => saveFound(new Set(['x:y']), storage)).not.toThrow()
    expect(loadFound(storage)).toEqual(new Set())
  })
})
