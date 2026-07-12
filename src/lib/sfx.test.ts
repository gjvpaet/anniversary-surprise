import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playEffect } from './sfx'

/**
 * Shared log of observable actions (duck/unduck events and play()
 * calls) so tests can assert exact ordering across window and Audio.
 */
let events: string[] = []

/**
 * Minimal stand-in for the DOM Audio element — playEffect only uses
 * the constructor, play(), and addEventListener(…, {once}).
 */
class FakeAudio {
  static instances: FakeAudio[] = []
  static playResult: () => Promise<void> = () => Promise.resolve()
  src: string
  private listeners = new Map<string, Array<{ fn: () => void; once: boolean }>>()
  constructor(src: string) {
    this.src = src
    FakeAudio.instances.push(this)
  }
  addEventListener(type: string, fn: () => void, opts?: { once?: boolean }) {
    const list = this.listeners.get(type) ?? []
    list.push({ fn, once: opts?.once ?? false })
    this.listeners.set(type, list)
  }
  play() {
    events.push('play')
    return FakeAudio.playResult()
  }
  /** test helper: simulate a media event, e.g. 'ended' or 'error' */
  fire(type: string) {
    const current = this.listeners.get(type) ?? []
    this.listeners.set(
      type,
      current.filter((l) => !l.once),
    )
    for (const l of current) l.fn()
  }
}

describe('playEffect', () => {
  beforeEach(() => {
    events = []
    FakeAudio.instances = []
    FakeAudio.playResult = () => Promise.resolve()
    const fakeWindow = new EventTarget()
    fakeWindow.addEventListener('duck-song', () => events.push('duck'))
    fakeWindow.addEventListener('unduck-song', () => events.push('unduck'))
    vi.stubGlobal('window', fakeWindow)
    vi.stubGlobal('Audio', FakeAudio)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ducks the song before playing the effect', () => {
    playEffect('/audio/secret-found.wav')
    expect(events).toEqual(['duck', 'play'])
    expect(FakeAudio.instances).toHaveLength(1)
    expect(FakeAudio.instances[0].src).toBe('/audio/secret-found.wav')
  })

  it('unducks when the effect ends', () => {
    playEffect('/audio/all-found.mp3')
    FakeAudio.instances[0].fire('ended')
    expect(events).toEqual(['duck', 'play', 'unduck'])
  })

  it('unducks when play() is blocked, so the song never sticks quiet', async () => {
    FakeAudio.playResult = () => Promise.reject(new Error('NotAllowedError'))
    playEffect('/audio/all-found.mp3')
    // let the rejection handler's microtask run
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(events).toEqual(['duck', 'play', 'unduck'])
    // a failed load realistically rejects play() AND fires 'error' —
    // the guard must dedupe the pair into a single unduck
    FakeAudio.instances[0].fire('error')
    expect(events).toEqual(['duck', 'play', 'unduck'])
  })

  it('unducks when playback dies mid-stream', () => {
    playEffect('/audio/all-found.mp3')
    FakeAudio.instances[0].fire('error')
    expect(events).toEqual(['duck', 'play', 'unduck'])
  })

  it('fires exactly one unduck per call even if ended somehow repeats', () => {
    playEffect('/audio/secret-found.wav')
    FakeAudio.instances[0].fire('ended')
    FakeAudio.instances[0].fire('ended')
    expect(events).toEqual(['duck', 'play', 'unduck'])
  })
})
