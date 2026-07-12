# Completion Celebration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Confetti + a "yay!" cheer when Jhen finds the 7th secret live, "our song" starting by itself off the gate gesture, and the song ducking under every sound effect.

**Architecture:** A new `src/lib/sfx.ts` owns the effect-plays-and-ducks contract via `duck-song`/`unduck-song` window events (same idiom as the existing `pause-song`/`resume-song`). AudioPlayer gains autoplay-with-gesture-fallback and a lazy Web Audio gain graph that answers the duck events (iPhone Safari ignores `HTMLMediaElement.volume`, so a gain node is the only ducking that works on the target device). A new `src/lib/celebrate.ts` wraps `canvas-confetti`; SecretsCounter triggers both on the live 7th find using its existing `sizeAtMount` live-transition pattern.

**Tech Stack:** Vite 8 + React 19 + TS + Tailwind v4; vitest (node environment — no DOM package; stub `window`/`Audio` with `vi.stubGlobal`); new runtime dep `canvas-confetti` + devDep `@types/canvas-confetti`.

**Spec:** `docs/superpowers/specs/2026-07-12-completion-celebration-design.md`

---

## PROJECT RULES (apply to every task)

1. **NO git commits.** Gabriel makes all commits himself. Never run `git add`/`git commit`. Each task ends with a suggested checkpoint message only.
2. **`photos-raw/` must never be committed or touched.**
3. **User-facing copy is fixed by the spec** — do not invent or reword any text.
4. **Dev server runs via the Claude Code Browser pane (`preview_start`), never Bash.** Only the orchestrator does browser verification (Task 5).
5. Gates that must stay green after every task: `npm test`, `npx tsc -b`, `npm run lint`.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/lib/sfx.ts` | new | play a one-shot effect; dispatch duck/unduck around it |
| `src/lib/sfx.test.ts` | new | vitest for the duck/unduck contract |
| `src/lib/celebrate.ts` | new | the 7/7 confetti burst (theme colors, reduced-motion safe) |
| `public/audio/all-found.mp3` | new | the yay cheer, copied as-is (6.7 s, 162 KB) |
| `src/components/AudioPlayer.tsx` | modified | autoplay + gesture fallback; Web Audio gain graph; duck listeners |
| `src/components/SecretsCounter.tsx` | modified | chime via `playEffect`; one-shot live-completion effect |
| `package.json` / `package-lock.json` | modified | `canvas-confetti` + `@types/canvas-confetti` |

No new localStorage keys. `StartOver`, `gate.ts`, `secrets.ts`, `hint.ts` untouched.

---

### Task 1: `sfx.ts` — the effect-plays-and-ducks contract (TDD)

**Files:**
- Create: `src/lib/sfx.ts`
- Test: `src/lib/sfx.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/sfx.test.ts`. The suite runs in vitest's default **node** environment (matching `secrets.test.ts`/`hint.test.ts` — there is no jsdom/happy-dom installed). Node ships `EventTarget` and `CustomEvent` natively, so a bare `EventTarget` stands in for `window` and a tiny fake stands in for `Audio`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playEffect } from './sfx'

/**
 * Minimal stand-in for the DOM Audio element — playEffect only uses
 * the constructor, play(), and addEventListener('ended', …, {once}).
 */
class FakeAudio {
  static instances: FakeAudio[] = []
  static playResult: () => Promise<void> = () => Promise.resolve()
  src: string
  played = false
  private endedListeners: Array<{ fn: () => void; once: boolean }> = []
  constructor(src: string) {
    this.src = src
    FakeAudio.instances.push(this)
  }
  addEventListener(type: string, fn: () => void, opts?: { once?: boolean }) {
    if (type === 'ended') this.endedListeners.push({ fn, once: opts?.once ?? false })
  }
  play() {
    this.played = true
    return FakeAudio.playResult()
  }
  /** test helper: simulate playback finishing */
  end() {
    const current = this.endedListeners
    this.endedListeners = current.filter((l) => !l.once)
    for (const l of current) l.fn()
  }
}

describe('playEffect', () => {
  let events: string[]

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
    expect(events).toEqual(['duck'])
    expect(FakeAudio.instances).toHaveLength(1)
    expect(FakeAudio.instances[0].src).toBe('/audio/secret-found.wav')
    expect(FakeAudio.instances[0].played).toBe(true)
  })

  it('unducks when the effect ends', () => {
    playEffect('/audio/all-found.mp3')
    FakeAudio.instances[0].end()
    expect(events).toEqual(['duck', 'unduck'])
  })

  it('unducks when play() is blocked, so the song never sticks quiet', async () => {
    FakeAudio.playResult = () => Promise.reject(new Error('NotAllowedError'))
    playEffect('/audio/all-found.mp3')
    // let the rejection handler's microtask run
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(events).toEqual(['duck', 'unduck'])
  })

  it('fires exactly one unduck per call even if ended somehow repeats', () => {
    playEffect('/audio/secret-found.wav')
    FakeAudio.instances[0].end()
    FakeAudio.instances[0].end()
    expect(events).toEqual(['duck', 'unduck'])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- --run src/lib/sfx.test.ts`
Expected: FAIL — `Cannot find module './sfx'` (or equivalent resolve error).

- [ ] **Step 3: Write the implementation**

Create `src/lib/sfx.ts`:

```ts
/**
 * Play a one-shot sound effect, ducking "our song" underneath it so
 * the effect is clearly audible. The AudioPlayer answers duck-song /
 * unduck-song; if the song isn't playing (or Web Audio is
 * unavailable) the events are harmless no-ops.
 *
 * Every terminal path — `ended`, a mid-playback `error`, or a
 * rejected play() (blocked OR failed load) — funnels through a
 * once-guarded unduck, so exactly one unduck fires per call and the
 * song can never stick quiet. Effects are garnish, never
 * load-bearing — failures are silent.
 *
 * Only two effects exist (first-find chime, 7/7 yay) and they can't
 * overlap, so duck/unduck needs no nesting counter. A third effect
 * that CAN overlap must revisit this (see the design doc).
 */
export function playEffect(src: string): void {
  const audio = new Audio(src)
  let unducked = false
  const unduck = () => {
    if (unducked) return
    unducked = true
    window.dispatchEvent(new CustomEvent('unduck-song'))
  }
  window.dispatchEvent(new CustomEvent('duck-song'))
  audio.addEventListener('ended', unduck, { once: true })
  audio.addEventListener('error', unduck, { once: true })
  audio.play().catch(unduck)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- --run src/lib/sfx.test.ts`
Expected: 4/4 PASS.

> **As executed:** code review hardened this task — a mid-playback `error`
> listener + once-guard were added (shown in Step 3 above), the tests grew
> to 5 (ordering pinned via a shared `['duck','play']` log; mid-stream
> error path; rejection+error dedupe). `src/lib/sfx.test.ts` is the source
> of truth; the Step 1 block reflects the pre-review version.

- [ ] **Step 5: Full gates**

Run: `npm test -- --run && npx tsc -b && npm run lint`
Expected: all previous tests still pass (15 before this task → 19 now), tsc silent, lint clean.

- [ ] **Step 6: Checkpoint (no commit — suggest to Gabriel)**

Suggested message: `Add sfx helper that ducks the song under sound effects`

---

### Task 2: Celebration assets — yay clip, canvas-confetti, `celebrate.ts`

**Files:**
- Create: `public/audio/all-found.mp3` (copy of `~/Downloads/Children Yay Sound Effect (HD).mp3`)
- Create: `src/lib/celebrate.ts`
- Modify: `package.json`, `package-lock.json` (dependency install only)

- [ ] **Step 1: Copy the sound asset byte-identically**

```bash
cp "$HOME/Downloads/Children Yay Sound Effect (HD).mp3" public/audio/all-found.mp3
cmp "$HOME/Downloads/Children Yay Sound Effect (HD).mp3" public/audio/all-found.mp3 && echo IDENTICAL
```

Expected: `IDENTICAL`. Size ~162,514 bytes.

- [ ] **Step 2: Install the confetti dependency**

```bash
npm install canvas-confetti && npm install -D @types/canvas-confetti
```

Expected: both appear in `package.json` (`canvas-confetti` under `dependencies`, types under `devDependencies`), install succeeds.

- [ ] **Step 3: Write `src/lib/celebrate.ts`**

```ts
import confetti from 'canvas-confetti'

/**
 * Theme tokens resolved at runtime — a canvas can't read CSS
 * variables. Falls back to the shipped hex if a token is missing so
 * the burst never renders colorless.
 */
const themeColor = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

/**
 * The 7/7 moment: one big celebratory burst — a wide center shot,
 * then two angled side shots — that rains down and settles in ~4 s.
 * SecretsCounter owns the trigger (live seventh find only).
 *
 * canvas-confetti draws on its own fixed, full-screen,
 * pointer-events-none canvas (z-index 100, above the Lightbox's
 * z-50), so nothing blocks her tap on "open the vault".
 * disableForReducedMotion skips every particle; the yay sound still
 * marks the moment. No cream in the palette — it's the page
 * background, cream confetti would vanish.
 */
export function celebrate(): void {
  const colors = [
    themeColor('--color-rose', '#c26a85'),
    themeColor('--color-blush', '#e8b4c4'),
    themeColor('--color-sky', '#b8d4e8'),
    themeColor('--color-lavender', '#cfc0e8'),
    themeColor('--color-sage', '#a8c096'),
  ]
  const shot = (particleCount: number, opts: confetti.Options) => {
    confetti({ disableForReducedMotion: true, particleCount, colors, ...opts })
  }
  shot(160, { spread: 100, startVelocity: 55, origin: { x: 0.5, y: 0.7 } })
  setTimeout(() => shot(60, { angle: 60, spread: 70, origin: { x: 0, y: 0.8 } }), 300)
  setTimeout(() => shot(60, { angle: 120, spread: 70, origin: { x: 1, y: 0.8 } }), 600)
}
```

- [ ] **Step 4: Gates**

Run: `npm test -- --run && npx tsc -b && npm run lint`
Expected: 19/19 pass, tsc silent (the `confetti.Options` type comes from `@types/canvas-confetti`), lint clean. (`celebrate.ts` is browser-only — no unit test; Task 5 verifies it live.)

- [ ] **Step 5: Checkpoint (no commit — suggest to Gabriel)**

Suggested message: `Add all-found cheer asset and confetti celebration module`

---

### Task 3: AudioPlayer — autoplay, Web Audio gain graph, duck listeners

**Files:**
- Modify: `src/components/AudioPlayer.tsx` (full replacement below)

The ♪ button, the label pill, the JSX, and the `pause-song`/`resume-song` contract keep their exact behavior. What changes: playback starts itself; every play path funnels through one `play()` helper that wires a lazy gain graph and resumes a suspended context; `duck-song`/`unduck-song` ramp the gain.

- [ ] **Step 1: Replace the component**

Write `src/components/AudioPlayer.tsx` in full:

```tsx
import { useEffect, useRef, useState } from 'react'
import { content } from '../content'

/**
 * "Our song" — a persistent fixed control, bottom-left (the chapter
 * nav owns the right edge). The song starts itself the moment the
 * world appears (deliberately superseding the PRD §7 no-autoplay
 * rule): after a live gate unlock her "Come in" tap is the gesture
 * that authorizes playback; on a return visit, where the browser
 * usually blocks the attempt, her first tap or keypress starts it.
 * The ♪ button remains the manual pause/play control and the song
 * loops for the whole scroll.
 *
 * Sound effects (lib/sfx.ts) duck the song via a Web Audio gain
 * node — duck-song dips it to 20%, unduck-song swells it back.
 * iPhone Safari ignores HTMLMediaElement.volume, so the gain graph
 * is the only ducking that works on her actual device.
 */
export default function AudioPlayer() {
  const audio = useRef<HTMLAudioElement>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const gain = useRef<GainNode | null>(null)
  const [playing, setPlaying] = useState(false)
  const [everPlayed, setEverPlayed] = useState(false)
  // set when a video interrupts the song, so it only resumes if it was playing
  const resumeAfterVideo = useRef(false)

  // Route the element through AudioContext → gain → speakers so
  // effects can duck it. One-shot: createMediaElementSource is only
  // legal once per element. Once routed, sound reaches the speakers
  // ONLY through the graph — a suspended context would silence the
  // song, so every play path (and the safety-net tap listener below)
  // resumes it.
  const ensureGraph = () => {
    const el = audio.current
    if (!el || gain.current) return
    try {
      const ctx = new AudioContext()
      const source = ctx.createMediaElementSource(el)
      const g = ctx.createGain()
      source.connect(g)
      g.connect(ctx.destination)
      audioCtx.current = ctx
      gain.current = g
    } catch {
      // Web Audio unavailable — the song simply plays unducked
    }
  }

  const play = () => {
    const el = audio.current
    if (!el) return Promise.resolve()
    return el.play().then(() => {
      ensureGraph()
      audioCtx.current?.resume().catch(() => {})
      setPlaying(true)
      setEverPlayed(true)
    })
  }

  // Autoplay: try as soon as the player mounts — the world just
  // appeared. Blocked (typical on a return visit, where unlock came
  // from localStorage with no gesture) → retry once on her first
  // tap or keypress.
  useEffect(() => {
    const retry = () => {
      remove()
      play().catch(() => setPlaying(false))
    }
    const remove = () => {
      window.removeEventListener('pointerdown', retry)
      window.removeEventListener('keydown', retry)
    }
    play().catch((err: unknown) => {
      // pause() during the pending play() rejects with AbortError —
      // an intentional stop, not an autoplay block; don't arm the retry
      if (err instanceof DOMException && err.name === 'AbortError') return
      window.addEventListener('pointerdown', retry)
      window.addEventListener('keydown', retry)
    })
    return remove
  }, [])

  // Safety net: if the context ends up suspended anyway (iOS gesture
  // strictness, tab backgrounding), any tap heals it. resume() on a
  // running context is a free no-op.
  useEffect(() => {
    const resume = () => {
      audioCtx.current?.resume().catch(() => {})
    }
    window.addEventListener('pointerdown', resume)
    return () => window.removeEventListener('pointerdown', resume)
  }, [])

  useEffect(() => {
    const onPause = () => {
      const el = audio.current
      if (!el || el.paused) return
      resumeAfterVideo.current = true
      el.pause()
      setPlaying(false)
    }
    const onResume = () => {
      if (!resumeAfterVideo.current) return
      resumeAfterVideo.current = false
      play().catch(() => setPlaying(false))
    }
    window.addEventListener('pause-song', onPause)
    window.addEventListener('resume-song', onResume)
    return () => {
      window.removeEventListener('pause-song', onPause)
      window.removeEventListener('resume-song', onResume)
    }
  }, [])

  // Effects ask the song to make room: dip fast, swell back gently.
  useEffect(() => {
    const ramp = (target: number, seconds: number) => {
      const g = gain.current
      if (!g) return
      const t = g.context.currentTime
      // read BEFORE cancel: cancelling an in-flight ramp reverts the
      // param to the prior anchor, not the audible mid-ramp value
      const current = g.gain.value
      g.gain.cancelScheduledValues(t)
      g.gain.setValueAtTime(current, t)
      g.gain.linearRampToValueAtTime(target, t + seconds)
    }
    const onDuck = () => ramp(0.2, 0.15)
    const onUnduck = () => ramp(1, 0.6)
    window.addEventListener('duck-song', onDuck)
    window.addEventListener('unduck-song', onUnduck)
    return () => {
      window.removeEventListener('duck-song', onDuck)
      window.removeEventListener('unduck-song', onUnduck)
    }
  }, [])

  const toggle = () => {
    const el = audio.current
    if (!el) return
    if (el.paused) {
      // browsers may still reject (e.g. interrupted) — keep state honest
      play().catch(() => setPlaying(false))
    } else {
      el.pause()
      setPlaying(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2.5">
      <audio ref={audio} src={content.song.file} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Pause our song' : 'Play our song'}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-blush-soft text-lg text-rose shadow-md transition-transform hover:scale-105 motion-reduce:transition-none"
      >
        {playing ? '❚❚' : '♪'}
      </button>
      <div
        className={`rounded-full bg-cream/90 px-3 py-1.5 text-xs text-ink-soft shadow-sm transition-opacity duration-500 motion-reduce:transition-none ${
          everPlayed && !playing ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden={everPlayed && !playing}
      >
        {playing ? (
          <span className="text-rose">
            {content.song.title} — {content.song.artist}
          </span>
        ) : (
          'our song 🎵'
        )}
      </div>
    </div>
  )
}
```

Implementer notes:
- The JSX block is byte-identical to the current file — only the doc comment, hooks, and handlers change.
- The mount effects intentionally close over `play` with an empty dep array — they must run once. oxlint has no exhaustive-deps rule; do not "fix" this by adding deps.
- Dev StrictMode double-invokes the mount effects: a second `play()` on an already-playing element resolves harmlessly; a duplicated blocked-retry listener at worst calls `play()` twice on the first tap, which is also harmless. No extra guards.
- `onResume` no longer needs the `el` null-check — `play()` owns it.

- [ ] **Step 2: Gates**

Run: `npm test -- --run && npx tsc -b && npm run lint`
Expected: 19/19 pass, tsc silent, lint clean.

- [ ] **Step 3: Checkpoint (no commit — suggest to Gabriel)**

Suggested message: `Song starts itself off the gate gesture and ducks under effects`

---

### Task 4: SecretsCounter — chime via sfx, live-completion celebration

**Files:**
- Modify: `src/components/SecretsCounter.tsx`

- [ ] **Step 1: Add imports**

After the existing imports (`useSecrets`, `hint`), add:

```tsx
import { celebrate } from '../lib/celebrate'
import { playEffect } from '../lib/sfx'
```

(Alphabetical within the lib group to match the file's style; final import order: react, `../SecretsContext`, `../lib/celebrate`, `../lib/hint`, `../lib/sfx`.)

- [ ] **Step 2: Route the debut chime through the ducking path**

In the debut effect, replace:

```tsx
    // fires inside her tap on the egg, so autoplay policies allow it;
    // if blocked anyway, the chime is garnish — fail silently
    new Audio('/audio/secret-found.wav').play().catch(() => {})
```

with:

```tsx
    // fires inside her tap on the egg, so autoplay policies allow it;
    // playEffect ducks the song under the chime and fails silently
    playEffect('/audio/secret-found.wav')
```

- [ ] **Step 3: Add the one-shot completion effect**

Directly below the debut effect (all hooks stay ABOVE the `if (found.size === 0) return null` early return), add:

```tsx
  const completionFired = useRef(false)

  useEffect(() => {
    // the live 7th find only — a visit that already STARTS at 7/7
    // mounts quiet, same rule as the debut above. sizeAtMount does
    // double duty: 5/7-persisted-then-finished-live still celebrates.
    if (!allFound || sizeAtMount.current >= total || completionFired.current) return
    completionFired.current = true
    playEffect('/audio/all-found.mp3')
    celebrate()
  }, [allFound, total])
```

Note: declare `completionFired` next to the existing `debutFired` ref (refs grouped together), and place the effect after the debut effect — either way, everything before the early return.

- [ ] **Step 4: Update the component doc comment**

Extend the existing doc comment's last paragraph with the finale, so the comment ends:

```tsx
 * The chip's debut — the live first find, not a reload with persisted
 * progress — gets a chime and a short glow so it can't slip in
 * unnoticed, plus a tooltip above it that explains the counter and
 * stays (across visits) until she closes it. The live SEVENTH find is
 * the finale: confetti and a cheer (both one-shot, never on a reload
 * already at 7/7) as the chip morphs into the vault key.
 */
```

- [ ] **Step 5: Gates**

Run: `npm test -- --run && npx tsc -b && npm run lint`
Expected: 19/19 pass, tsc silent, lint clean.

- [ ] **Step 6: Checkpoint (no commit — suggest to Gabriel)**

Suggested message: `Confetti and a cheer when the seventh secret is found live`

---

### Task 5: Browser verification sweep + final review (orchestrator only)

**Files:** none (verification). Dev server via the Browser pane (`preview_start`), never Bash.

- [ ] **Step 1: Full gates + build**

Run: `npm test -- --run && npx tsc -b && npm run lint && npm run build`
Expected: 19/19, silent, clean; build succeeds; note gzip bundle delta (canvas-confetti adds ~2–5 KB). Confirm `dist/audio/all-found.mp3` exists.

- [ ] **Step 2: Autoplay off the gate gesture**

Clear site data → load `localhost:5173` → gate visible → type `july 15 2018` → click "Come in". Evidence: network shows `song.mp3` fetched; the ♪ button reads `aria-pressed="true"` / shows ❚❚; the label pill shows the song title. (The hidden pane can't prove audibility — element/network state is the evidence.)

- [ ] **Step 3: Return-visit fallback**

Reload the page (unlock persisted, no gesture). If the pane's browser blocks autoplay: button shows ♪/`aria-pressed="false"`; then one real click anywhere → button flips to playing. If the pane allows autoplay (some embedded browsers do), record that and verify the listener path by code inspection only.

- [ ] **Step 4: Ducking is real**

With the song playing, click one egg (first find). Evidence: `secret-found.wav` requested; assert via `javascript_tool` that the gain node exists and dipped — e.g. instrument by reading `document.querySelector('audio')` graph is not reachable from outside, so instead listen: `(() => { let seen = []; window.addEventListener('duck-song', () => seen.push('duck')); window.addEventListener('unduck-song', () => seen.push('unduck')); window.__duckLog = seen })()` BEFORE clicking, then after the click read `window.__duckLog` → `['duck']` then `['duck','unduck']` (~0.3 s later). Both events firing + graph code reviewed = ducking verified as far as the pane allows; audible confirmation goes on the real-iPhone checklist.

- [ ] **Step 5: The 7/7 moment**

Find the remaining six eggs (total 7). On the 7th click, evidence: network requests `all-found.mp3`; a `<canvas>` appended by canvas-confetti exists in the DOM (`document.querySelector('canvas')`); duck log shows a new duck event; chip morphed to "open the vault" and is clickable WHILE the canvas exists (confetti canvas is pointer-events-none). After ~7 s: unduck logged (yay is 6.7 s).

- [ ] **Step 6: Reload at 7/7 stays quiet**

Reload. Evidence: no `all-found.mp3` request, no confetti canvas, vault button present. (Song fallback from Step 3 applies.)

- [ ] **Step 7: Reduced motion**

Emulate `prefers-reduced-motion: reduce` → clear `eightyears:secrets` only (keep unlock) → reload → find all 7 eggs. Evidence: `all-found.mp3` still requested on the 7th; no confetti canvas appears (`disableForReducedMotion`).

- [ ] **Step 8: Start-over replay unchanged**

Run the finale's "start over" (two-step confirm). Evidence: all three `eightyears:*` keys null, gate returns. (No new keys — nothing new to clear.)

- [ ] **Step 9: Console + restore**

Zero console errors across the sweep. Restore viewport 1280×800, normal motion preference.

- [ ] **Step 10: Final holistic review + report**

Dispatch the final code reviewer over the whole diff (spec: `docs/superpowers/specs/2026-07-12-completion-celebration-design.md`). Then report to Gabriel: what shipped, evidence, bundle delta, suggested per-task checkpoint messages (Tasks 1–4 above) or squash `Celebrate the seventh secret — confetti, a cheer, and a self-starting song`, and the real-iPhone checklist additions: song starts after "Come in"; ducking audibly works; celebration audible; return-visit first-tap start works.
