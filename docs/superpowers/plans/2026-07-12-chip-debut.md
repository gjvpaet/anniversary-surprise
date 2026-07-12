# Chip Debut (Sound + Glow + Tooltip) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the secrets-counter chip first appears (first secret found), play a short chime, glow the chip for ~2.7 s, and show a dismissible tooltip above it that persists across visits until she closes it.

**Architecture:** A new `src/lib/hint.ts` storage module (private `eightyears:hint` key, injectable Storage, exports its own reset — same pattern as gate.ts/secrets.ts) remembers the tooltip dismissal. `SecretsCounter.tsx` detects the live 0 → 1 debut with a mount-time ref, fires the chime + glow once, and renders the tooltip whenever the chip is visible and undismissed. `StartOver` adds `clearHint()` so a replay debuts again.

**Tech Stack:** Vite 8 + React 19 + TypeScript + Tailwind v4; vitest for the storage logic.

**Spec:** `docs/superpowers/specs/2026-07-12-chip-debut-design.md`

## Project rules (override skill defaults)

- **Gabriel makes ALL git commits himself.** Never run `git commit`. Commit
  steps below are *checkpoints*: stop, list the files, suggest the message.
- `photos-raw/` must never be committed (untouched by this plan, but the
  rule stands for any `git add` suggestion).
- Truthfulness rule: the tooltip copy is fixed by the spec —
  `you found a secret! 7 are hidden around our world — find them all and something opens…`
  — no other new user-facing copy.
- Dev server via the Browser pane (`preview_start`), never Bash.

---

### Task 1: `hint.ts` storage module

**Files:**
- Create: `src/lib/hint.ts`
- Test: `src/lib/hint.test.ts` (new file)

- [ ] **Step 1: Write the failing tests**

Create `src/lib/hint.test.ts`. The `fakeStorage` helper is deliberately
duplicated from `src/lib/secrets.test.ts` (13 lines; keeps each test file
self-contained rather than coupling them through a shared helper):

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: `src/lib/hint.test.ts` FAILS (cannot resolve `./hint`); the 9
existing tests in `src/lib/secrets.test.ts` still pass.

- [ ] **Step 3: Implement `src/lib/hint.ts`**

```ts
/** Matches the gate/secrets `eightyears:*` key convention. */
const STORAGE_KEY = 'eightyears:hint'

/**
 * Has she closed the counter tooltip? Storage failure degrades to
 * false — the tooltip shows again, which is annoying at worst,
 * never a crash.
 */
export function isHintDismissed(storage: Storage = localStorage): boolean {
  try {
    return storage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function dismissHint(storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, '1')
  } catch {
    // storage unavailable — dismissal lasts this visit only
  }
}

/** Reset for the "start over" control — a replay shows the tooltip again. */
export function clearHint(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable — nothing persisted, so nothing to clear
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 15 tests pass (9 existing + 6 new).

- [ ] **Step 5: Checkpoint — suggested commit (Gabriel commits)**

Files: `src/lib/hint.ts`, `src/lib/hint.test.ts`
Message: `Add hint store for the counter tooltip dismissal`

---

### Task 2: Sound asset + glow keyframe

**Files:**
- Create: `public/audio/secret-found.wav` (copied from `~/Downloads/sound5.wav`)
- Modify: `src/index.css` (append after the `egg-ping` block, line 68)

- [ ] **Step 1: Copy the sound asset**

Run: `cp "/Users/gabpaet/Downloads/sound5.wav" public/audio/secret-found.wav`
Then verify: `ls -la public/audio/`
Expected: `secret-found.wav` (25,300 bytes) alongside `song.mp3`.

- [ ] **Step 2: Add the `chip-glow` keyframe**

Append to `src/index.css`, directly after the `egg-ping` reduced-motion
block (before the `body` rule), matching the file's existing idiom:

```css
/* Counter-chip debut — three soft rose pulses on a dedicated overlay
   span (animating the chip's own box-shadow would stomp its Tailwind
   ring + shadow, which are box-shadow underneath — same reason
   egg-ping animates a separate span). */
@keyframes chip-glow {
  0% {
    box-shadow: 0 0 4px 2px color-mix(in srgb, var(--color-rose) 55%, transparent);
  }
  70%,
  100% {
    box-shadow: 0 0 12px 10px color-mix(in srgb, var(--color-rose) 0%, transparent);
  }
}
.chip-glow {
  animation: chip-glow 0.9s ease-out 3;
}
@media (prefers-reduced-motion: reduce) {
  .chip-glow {
    animation: none;
  }
}
```

(0.9 s × 3 iterations ≈ 2.7 s total; the fixed iteration count ends the
animation by itself, so the span can stay mounted forever with no timer.
The class MUST go on a dedicated `absolute inset-0 rounded-full` span
inside the chip (Task 3 does this), never on the chip itself: Tailwind
v4's `ring-2` and `shadow-md` are both box-shadow composites, and a
running animation's box-shadow overrides them — glowing the chip directly
would strip its rose ring for the whole debut. `color-mix` keeps the
rose token single-sourced, and fading to `color-mix(… 0%, transparent)`
keeps the hue rose through the fade instead of drifting toward black.)

- [ ] **Step 3: Verify gates**

Run: `npm run build`
Expected: clean build (CSS is picked up; no Tailwind conflicts).

- [ ] **Step 4: Checkpoint — suggested commit (Gabriel commits)**

Files: `public/audio/secret-found.wav`, `src/index.css`
Message: `Add secret-found chime asset and chip-glow keyframe`

---

### Task 3: Debut wiring in `SecretsCounter`

**Files:**
- Modify: `src/components/SecretsCounter.tsx` (full rewrite below — currently 43 lines)

- [ ] **Step 1: Replace `src/components/SecretsCounter.tsx` with:**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useSecrets } from '../SecretsContext'
import { dismissHint, isHintDismissed } from '../lib/hint'

interface Props {
  onOpenVault: () => void
}

/**
 * The hunt's scoreboard — fixed bottom-right, mirroring the audio
 * button bottom-left. Hidden until the first egg is found (before
 * that it would spoil the surprise; the pulsing halos invite the
 * first tap). Once every secret is open it becomes the vault key.
 *
 * The chip's debut — the live first find, not a reload with persisted
 * progress — gets a chime and a short glow so it can't slip in
 * unnoticed, plus a tooltip above it that explains the counter and
 * stays (across visits) until she closes it.
 */
export default function SecretsCounter({ onOpenVault }: Props) {
  const { found, total, allFound } = useSecrets()
  // > 0 at mount means persisted progress from an earlier visit — the
  // chip is old news, so no chime and no glow (and the browser would
  // block the autoplay anyway, with no user gesture in the stack)
  const sizeAtMount = useRef(found.size)
  const debutFired = useRef(false)
  const [glowing, setGlowing] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(isHintDismissed)

  useEffect(() => {
    if (found.size === 0 || sizeAtMount.current > 0 || debutFired.current) return
    // one-shot guard: StrictMode double-invokes effects in dev
    debutFired.current = true
    // fires inside her tap on the egg, so autoplay policies allow it;
    // if blocked anyway, the chime is garnish — fail silently
    new Audio('/audio/secret-found.wav').play().catch(() => {})
    // never unset: the keyframe's fixed iteration count (3) ends the
    // animation on its own
    setGlowing(true)
  }, [found.size])

  if (found.size === 0) return null

  const closeHint = () => {
    setHintDismissed(true)
    dismissHint()
  }

  const hint = !hintDismissed && (
    <div className="egg-pop fixed right-4 bottom-20 z-40 flex w-56 items-start rounded-2xl bg-white/95 p-3 pr-0 shadow-md">
      <p className="font-hand text-lg leading-snug text-ink">
        you found a secret! 7 are hidden around our world — find them all
        and something opens…
      </p>
      <button
        type="button"
        onClick={closeHint}
        aria-label="got it"
        className="-mt-3 flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center text-ink-soft hover:text-rose"
      >
        ✕
      </button>
    </div>
  )

  if (!allFound) {
    return (
      <>
        {hint}
        <p
          role="status"
          className="fixed right-4 bottom-4 z-40 rounded-full bg-white/95 px-4 py-2.5 font-hand text-lg leading-none text-ink shadow-md ring-2 ring-rose/40"
        >
          {glowing && (
            <span
              aria-hidden
              className="chip-glow pointer-events-none absolute inset-0 rounded-full"
            />
          )}
          {found.size} / {total} secrets
        </p>
      </>
    )
  }

  return (
    <>
      {hint}
      <button
        type="button"
        onClick={onOpenVault}
        aria-label="Open the vault of extra photos"
        className="fixed right-4 bottom-4 z-40 flex cursor-pointer items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 font-hand text-lg leading-none text-rose shadow-md ring-2 ring-rose/40"
      >
        <span aria-hidden className="relative flex h-4 w-4 items-center justify-center">
          <span className="egg-ping absolute inset-0 rounded-full bg-rose/50" />
          🔓
        </span>
        open the vault
      </button>
    </>
  )
}
```

Notes for the implementer:
- All hooks sit ABOVE the `if (found.size === 0) return null` early return —
  rules of hooks. The component is mounted (returning null) at 0 secrets,
  which is what lets `sizeAtMount` start at 0 and the effect see the live
  0 → 1 transition.
- `useState(isHintDismissed)` passes the function as a lazy initializer;
  React calls it with no args, so the default `localStorage` applies.
- The tooltip (`hint`) renders in BOTH chip states — it survives the 7/7
  morph into "open the vault" until dismissed.
- `bottom-20` (80 px) clears the `bottom-4` chip (~41 px tall) by ~23 px.
- The glow is an `aria-hidden` overlay span, NOT a class on the chip:
  Tailwind's `ring-2` + `shadow-md` are box-shadow composites, and a
  running animation's box-shadow would override them, stripping the rose
  ring for the whole debut. The chip is `position: fixed`, so the
  `absolute inset-0` span needs no extra positioning context. It lives
  only in the counting `<p>` — the debut is always a 0 → 1 transition, so
  the 7/7 vault button can never be the glowing chip.
- The existing chip markup/classes are otherwise unchanged — only the
  fragment wrapper, `{hint}`, and the conditional glow span are new.

- [ ] **Step 2: Verify gates**

Run: `npm test && npx tsc -b && npm run lint`
Expected: 15 tests pass, tsc silent, oxlint 0 warnings/errors.

- [ ] **Step 3: Checkpoint — suggested commit (Gabriel commits)**

Files: `src/components/SecretsCounter.tsx`
Message: `Chime, glow and tooltip when the secrets counter debuts`

---

### Task 4: `StartOver` also clears the tooltip dismissal

**Files:**
- Modify: `src/components/StartOver.tsx` (import block; `reset` at lines 22-29; doc comment lines 5-11)

- [ ] **Step 1: Add the import**

Below `import { clearFound } from '../lib/secrets'`:

```tsx
import { clearHint } from '../lib/hint'
```

- [ ] **Step 2: Clear the hint in `reset()`**

```tsx
  const reset = () => {
    try {
      clearFound()
      lock()
      clearHint()
    } finally {
      window.location.replace(window.location.pathname)
    }
  }
```

- [ ] **Step 3: Update the component doc comment**

The comment says "both localStorage keys are cleared" — there are three
now. Replace that sentence so the comment reads:

```tsx
/**
 * "Relive it from the beginning" — the visible reset at the end of the
 * finale. Two-step inline confirm (one stray tap must not wipe a 7/7
 * hunt), then every localStorage key (gate, secrets, counter tooltip)
 * is cleared and the page reloads on the bare pathname — stripping the
 * query so the ?key owner bypass in isUnlocked() can't silently
 * re-unlock the gate.
 */
```

- [ ] **Step 4: Verify gates**

Run: `npx tsc -b && npm run lint`
Expected: both clean.

- [ ] **Step 5: Checkpoint — suggested commit (Gabriel commits)**

Files: `src/components/StartOver.tsx`
Message: `Start over resets the counter tooltip too`

---

### Task 5: Browser verification sweep

**Files:** none (verification only)

Pane gotchas that apply here: the hidden tab freezes rAF and may not
actually play audio — verify the debut via DOM state and the network
request for the wav, not audibility. After `resize_window`, reload before
measuring (svh/layout go stale).

- [ ] **Step 1: Start the dev server** via the Browser pane
(`preview_start`, launch.json name for vite). Clear state first:
`localStorage.clear()` via `javascript_tool`, then navigate to
`http://localhost:5173/?key=20180715` so the gate opens.

- [ ] **Step 2: Debut fires on the live first find** — click an easter-egg
badge on an island (the pulsing halo), then its play/reveal control if the
egg opens a bubble. Confirm:
- chip appears bottom-right with class `chip-glow`
  (`document.querySelector('.chip-glow')` non-null),
- `read_network_requests` shows a request for `/audio/secret-found.wav`,
- tooltip bubble is visible above the chip with the spec copy and a ✕.

- [ ] **Step 3: Tooltip dismissal persists** — click ✕. Tooltip unmounts;
`localStorage.getItem('eightyears:hint')` is `'1'`. Reload: chip renders
(no glow class, no wav request — persisted mount is quiet), tooltip absent.

- [ ] **Step 4: Undismissed tooltip survives reload** — run
`localStorage.removeItem('eightyears:hint')`, reload: tooltip is back
(chip still quiet — no glow, no chime), because dismissal was never made.

- [ ] **Step 5: Start over replays the debut** — scroll to the finale end
(or force ScrollTriggers complete), tap "relive it from the beginning ↺" →
"yes, take me back". Confirm all THREE keys are null (`eightyears:unlocked`,
`eightyears:secrets`, `eightyears:hint`) and the gate shows. Re-unlock
via `?key=20180715`, find an egg again: chime request + glow + tooltip all
fire again.

- [ ] **Step 6: Reduced-motion spot check** — with reduced motion emulated,
find the first egg (from clean state): no glow animation
(`getComputedStyle(chip).animationName` is `none`), but the tooltip still
appears and the wav is still requested.

- [ ] **Step 7: Mobile layout** — resize to 375×812, reload, re-seed one
secret live: tooltip and chip fit inside the viewport (no horizontal
overflow; tooltip right edge ≤ viewport).

- [ ] **Step 8: Checkpoint — report to Gabriel** with the verification
evidence and the four suggested commits from Tasks 1-4 (or one squashed
commit: `Give the secrets counter a debut — chime, glow and a tooltip`).
