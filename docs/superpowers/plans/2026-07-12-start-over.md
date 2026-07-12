# Start Over (Reset Everything) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A visible "relive it from the beginning" control at the end of the finale that re-locks the date gate and erases the secrets hunt, so the whole experience replays from scratch.

**Architecture:** Each storage-owning module exports its own reset (`lock()` in gate.ts, `clearFound()` in secrets.ts; the keys stay private). A new self-contained `StartOver` component in the finale runs a two-step inline confirm, clears both keys, and reloads on the bare pathname — the reload resets all runtime state (scroll, GSAP, song, counter chip) for free, and stripping the query string defeats the `?key=` owner bypass in `isUnlocked()`.

**Tech Stack:** Vite 8 + React 19 + TypeScript + Tailwind v4; vitest for the pure storage logic.

**Spec:** `docs/superpowers/specs/2026-07-12-start-over-design.md`

## Project rules (override skill defaults)

- **Gabriel makes ALL git commits himself.** Never run `git commit`. Commit
  steps below are *checkpoints*: stop, list the files, suggest the message.
- `photos-raw/` must never be committed (untouched by this plan, but the
  rule stands for any `git add` suggestion).
- Truthfulness rule: no new user-facing copy beyond what the spec fixes
  ("relive it from the beginning ↺", "start over? the secrets reset too —",
  "yes, take me back", "keep this").
- Dev server via the Browser pane (`preview_start`), never Bash.

---

### Task 1: `clearFound()` in the secrets module

**Files:**
- Modify: `src/lib/secrets.ts` (add function at end of file)
- Test: `src/lib/secrets.test.ts` (add describe block at end of file)

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/secrets.test.ts`, and add `clearFound` to the existing
import (alphabetical: `import { clearFound, eggId, loadFound, saveFound, totalSecrets } from './secrets'`):

```ts
describe('clearFound', () => {
  it('removes the stored ids', () => {
    const storage = fakeStorage({ 'eightyears:secrets': '["a:🎬"]' })
    clearFound(storage)
    expect(storage.getItem('eightyears:secrets')).toBeNull()
    expect(loadFound(storage)).toEqual(new Set())
  })

  it('never throws when storage is unavailable', () => {
    const storage = fakeStorage()
    storage.removeItem = () => {
      throw new Error('denied')
    }
    expect(() => clearFound(storage)).not.toThrow()
  })
})
```

(`fakeStorage` already exists at the top of the test file. `throwingStorage`
only overrides `getItem`/`setItem`, so the second test overrides
`removeItem` inline instead.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: the two new tests FAIL (`clearFound` is not exported); the 7 existing tests still pass.

- [ ] **Step 3: Implement `clearFound`**

Append to `src/lib/secrets.ts`:

```ts
/** Reset for the "start over" control — forgets every found secret. */
export function clearFound(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable — nothing persisted, so nothing to clear
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 9 tests pass.

- [ ] **Step 5: Checkpoint — suggested commit (Gabriel commits)**

Files: `src/lib/secrets.ts`, `src/lib/secrets.test.ts`
Message: `Add clearFound reset to the secrets store`

---

### Task 2: `lock()` in the gate module

**Files:**
- Modify: `src/lib/gate.ts` (add function after `unlock()`, line 71-73)

No unit test: gate.ts has no test file and uses `localStorage` directly
(not injectable) by design; `lock()` is one line and is exercised by the
browser sweep in Task 4.

- [ ] **Step 1: Implement `lock`**

Append to `src/lib/gate.ts`, directly below `unlock()`:

```ts
/** Reset for the "start over" control — she meets the gate again. */
export function lock(): void {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 2: Verify the project still typechecks**

Run: `npx tsc -b`
Expected: no output (clean).

- [ ] **Step 3: Checkpoint — suggested commit (Gabriel commits)**

Files: `src/lib/gate.ts`
Message: `Add lock() so the gate can be re-armed`

---

### Task 3: `StartOver` component, rendered in the finale

**Files:**
- Create: `src/components/StartOver.tsx`
- Modify: `src/components/Finale.tsx` (import block at top; closing div at lines 195-202)

- [ ] **Step 1: Create `src/components/StartOver.tsx`**

```tsx
import { useState } from 'react'
import { lock } from '../lib/gate'
import { clearFound } from '../lib/secrets'

/**
 * "Relive it from the beginning" — the visible reset at the end of the
 * finale. Two-step inline confirm (one stray tap must not wipe a 7/7
 * hunt), then both localStorage keys are cleared and the page reloads
 * on the bare pathname — stripping the query so the ?key owner bypass
 * in isUnlocked() can't silently re-unlock the gate.
 */
export default function StartOver() {
  const [confirming, setConfirming] = useState(false)

  const reset = () => {
    clearFound()
    lock()
    window.location.replace(window.location.pathname)
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-8 min-h-11 cursor-pointer font-hand text-lg text-ink-soft underline decoration-dotted underline-offset-4 hover:text-rose"
      >
        relive it from the beginning ↺
      </button>
    )
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <p className="w-full font-hand text-lg text-ink-soft">
        start over? the secrets reset too —
      </p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 cursor-pointer rounded-full bg-rose px-4 py-1.5 font-hand text-lg leading-none text-white shadow-sm"
      >
        yes, take me back
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="min-h-11 cursor-pointer rounded-full bg-cream/90 px-4 py-1.5 font-hand text-lg leading-none text-ink shadow-sm"
      >
        keep this
      </button>
    </div>
  )
}
```

(Button styles copied from the established pill idiom — EasterEggButton's
play button and the lightbox chrome: `rounded-full`, `font-hand text-lg
leading-none`, `min-h-11` tap targets, `shadow-sm`.)

- [ ] **Step 2: Render it in the finale's closing block**

In `src/components/Finale.tsx`, add the import below the existing ones:

```tsx
import StartOver from './StartOver'
```

Then inside the `closing` div, add `<StartOver />` after the counter, so
the block reads:

```tsx
<div ref={closing}>
  <h2 className="font-display text-2xl text-rose md:text-3xl">
    Happy 8th Anniversary
  </h2>
  <div className="mt-4">
    <Counter />
  </div>
  <StartOver />
</div>
```

No GSAP changes: the `closing` ref's existing reveal tween animates the
whole div, StartOver included.

- [ ] **Step 3: Verify gates**

Run: `npm test && npx tsc -b && npm run lint`
Expected: 9 tests pass, tsc silent, oxlint 0 warnings/errors.

- [ ] **Step 4: Checkpoint — suggested commit (Gabriel commits)**

Files: `src/components/StartOver.tsx`, `src/components/Finale.tsx`
Message: `Add "start over" reset at the end of the finale`

---

### Task 4: Browser verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server** via the Browser pane (`preview_start`, launch.json name for `vite`), navigate to `http://localhost:5173/?key=20180715` so the gate opens for testing.

- [ ] **Step 2: Seed hunt progress** — mark at least one secret found (click an egg, or `localStorage.setItem('eightyears:secrets', '["how-we-met:🎬"]')` + reload) and confirm the counter chip shows.

- [ ] **Step 3: Reach the control** — scroll to the end of the finale (or force ScrollTriggers complete, per the pane's hidden-tab rAF freeze) and confirm "relive it from the beginning ↺" renders under the day counter.

- [ ] **Step 4: Confirm flow** — tap the link → question + two buttons appear; tap **keep this** → back to the idle link, localStorage untouched.

- [ ] **Step 5: Reset flow** — tap the link, then **yes, take me back**. Expected: page reloads at `http://localhost:5173/` (no `?key`), the Gate renders, no counter chip. Verify both keys are gone: `localStorage.getItem('eightyears:unlocked')` and `localStorage.getItem('eightyears:secrets')` both `null`.

- [ ] **Step 6: Replay works** — unlock by typing the date at the gate (e.g. `july 15 2018`), confirm the world loads with 0 secrets found.

- [ ] **Step 7: Reduced-motion spot check** — with reduced motion emulated, confirm the control is visible in the static finale layout.

- [ ] **Step 8: Checkpoint — report to Gabriel** with the verification evidence and the three suggested commits from Tasks 1-3 (or one squashed commit: `Add "start over" reset — re-locks the gate and clears the hunt`).
