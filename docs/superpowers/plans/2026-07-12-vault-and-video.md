# Secrets Vault + Day-One Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 7 easter eggs into a treasure hunt that unlocks a hidden outtakes gallery, and surface the July 15 2018 day-one video as the 7th egg.

**Architecture:** All new UI is fixed-position overlay (modeled on the existing `Lightbox.tsx` modal conventions) — zero changes to GSAP timelines, pins, or scroll layout. Secret-found state lives in a React context persisted to localStorage; pure persistence/derivation logic is split into `src/lib/secrets.ts` so it's unit-testable without React.

**Tech Stack:** Vite 8 + React 19 + TS + Tailwind v4 (existing). New devDependency: `vitest` (pure-logic tests only). `ffmpeg` (already on the machine — used for probing) for the video re-encode; `cwebp` or `sips` for photo conversion, matching the existing photo pipeline.

**Spec:** `docs/superpowers/specs/2026-07-12-vault-and-video-design.md`

**PROJECT RULES (override skill defaults):**
- **Gabriel makes all git commits himself.** Commit steps below produce a *suggested message and file list* — never run `git commit`. Pause at each commit checkpoint so he can commit.
- `photos-raw/` must NEVER be committed or referenced by shipped code. Only converted assets under `public/` ship.
- Browser-pane verification is DOM/computed-style based (renderer often sleeps; screenshots unreliable). Click in one `javascript_tool` eval, read state in the NEXT eval.
- Dev server: `preview_start` with name `anniversary-surprise` (working-dir root `.claude/launch.json`), owner URL `http://localhost:5173/?key=20180715`.

---

### Task 1: Vitest + pure secrets logic (`src/lib/secrets.ts`)

**Files:**
- Modify: `package.json` (add vitest + test script)
- Create: `src/lib/secrets.ts`
- Test: `src/lib/secrets.test.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest` (in `~/Documents/Personal/anniversary-surprise`)
Then add to `package.json` scripts: `"test": "vitest run"`

- [ ] **Step 2: Write the failing tests**

Create `src/lib/secrets.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/secrets.test.ts`
Expected: FAIL — `Cannot find module './secrets'` (or equivalent resolve error).

- [ ] **Step 4: Implement `src/lib/secrets.ts`**

```ts
import type { Era } from '../content'

/** Matches the gate's `eightyears:unlocked` key convention. */
const STORAGE_KEY = 'eightyears:secrets'

/**
 * Stable identity for an egg across reloads. Coords are deliberately
 * excluded so nudging an egg's position doesn't reset her progress.
 * Constraint: no two eggs on the same era may share an icon.
 */
export function eggId(eraId: string, icon: string): string {
  return `${eraId}:${icon}`
}

/** Derived, never hardcoded — adding an egg can't desync the counter. */
export function totalSecrets(eras: Pick<Era, 'easterEggs'>[]): number {
  return eras.reduce((n, era) => n + era.easterEggs.length, 0)
}

/**
 * Storage access is fully fault-tolerant: private mode or corrupt data
 * degrades to an empty set (in-memory hunt, resets on reload) rather
 * than crashing the site on launch day.
 */
export function loadFound(storage: Storage = localStorage): Set<string> {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? new Set(parsed.filter((v): v is string => typeof v === 'string'))
      : new Set()
  } catch {
    return new Set()
  }
}

export function saveFound(found: Set<string>, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...found]))
  } catch {
    // storage unavailable — the hunt still works within this visit
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/secrets.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Typecheck**

Run: `npx tsc -b`
Expected: clean. (If `vitest` globals complain: tests import from `vitest` explicitly, no tsconfig change needed. If `tsc -b` picks up the test file and errors on `vitest` types, add `"types": ["vitest/globals"]` is NOT needed — explicit imports suffice; instead exclude nothing and confirm the resolve works.)

- [ ] **Step 7: Commit checkpoint (Gabriel commits)**

Files: `package.json`, `package-lock.json`, `src/lib/secrets.ts`, `src/lib/secrets.test.ts`
Suggested message: `Add secret-tracking store with vitest coverage`

---

### Task 2: SecretsProvider context, wired into App

**Files:**
- Create: `src/SecretsContext.tsx`
- Modify: `src/main.tsx` (wrap `<App />`)

- [ ] **Step 1: Create `src/SecretsContext.tsx`**

```tsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { content } from './content'
import { eggId, loadFound, saveFound, totalSecrets } from './lib/secrets'

interface Secrets {
  found: Set<string>
  total: number
  allFound: boolean
  markFound: (eraId: string, icon: string) => void
}

const SecretsContext = createContext<Secrets | null>(null)

/** Tracks which easter eggs she has opened; persists across visits. */
export function SecretsProvider({ children }: { children: ReactNode }) {
  const [found, setFound] = useState<Set<string>>(loadFound)

  const markFound = useCallback((eraId: string, icon: string) => {
    setFound((prev) => {
      const id = eggId(eraId, icon)
      if (prev.has(id)) return prev
      const next = new Set(prev).add(id)
      saveFound(next)
      return next
    })
  }, [])

  const value = useMemo<Secrets>(() => {
    const total = totalSecrets(content.eras)
    return { found, total, allFound: found.size >= total, markFound }
  }, [found, markFound])

  return <SecretsContext.Provider value={value}>{children}</SecretsContext.Provider>
}

export function useSecrets(): Secrets {
  const ctx = useContext(SecretsContext)
  if (!ctx) throw new Error('useSecrets must be used within SecretsProvider')
  return ctx
}
```

- [ ] **Step 2: Wrap the app in `src/main.tsx`**

Current file renders `<App />` inside `StrictMode`. Change to:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SecretsProvider } from './SecretsContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecretsProvider>
      <App />
    </SecretsProvider>
  </StrictMode>,
)
```

(Adjust to match the actual current `main.tsx` — only the wrapper is new.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b` — Expected: clean.

- [ ] **Step 4: Commit checkpoint (Gabriel commits)**

Files: `src/SecretsContext.tsx`, `src/main.tsx`
Suggested message: `Provide secrets context app-wide`

---

### Task 3: Eggs report themselves found

**Files:**
- Modify: `src/components/EasterEggButton.tsx` (new `eraId` prop + markFound)
- Modify: `src/components/EraSection.tsx:155-157` (pass `eraId`)

- [ ] **Step 1: Extend EasterEggButton**

In `src/components/EasterEggButton.tsx`, change the props interface and the open handler:

```tsx
import { useSecrets } from '../SecretsContext'

interface Props {
  egg: EasterEgg
  /** Owning era's id — half of the egg's stable identity. */
  eraId: string
}

export default function EasterEggButton({ egg, eraId }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { markFound } = useSecrets()

  const toggle = () => {
    setOpen((o) => {
      if (!o) markFound(eraId, egg.icon)
      return !o
    })
  }
  // …button onClick={toggle} replaces onClick={() => setOpen((o) => !o)}
```

Everything else in the component stays as-is.

**StrictMode note:** the updater passed to `setOpen` must stay pure — calling `markFound` inside it is a side effect React may run twice. Implement instead as:

```tsx
  const toggle = () => {
    if (!open) markFound(eraId, egg.icon)
    setOpen(!open)
  }
```

- [ ] **Step 2: Pass eraId from EraSection**

`src/components/EraSection.tsx`, in the eggs map:

```tsx
{era.easterEggs.map((egg) => (
  <EasterEggButton key={egg.icon} egg={egg} eraId={era.id} />
))}
```

- [ ] **Step 3: Typecheck + browser verify**

Run: `npx tsc -b` — clean.
Browser pane (two-eval pattern): eval 1 — `document.querySelector('[aria-label="A little secret — tap me"]').click()`; eval 2 — `localStorage.getItem('eightyears:secrets')` contains `"how-we-met:🗺️"`.

- [ ] **Step 4: Commit checkpoint (Gabriel commits)**

Files: `src/components/EasterEggButton.tsx`, `src/components/EraSection.tsx`
Suggested message: `Mark easter eggs found when opened`

---

### Task 4: Secrets counter chip

**Files:**
- Create: `src/components/SecretsCounter.tsx`
- Modify: `src/App.tsx` (render chip; add `vaultOpen` state used in Task 6)

- [ ] **Step 1: Create `src/components/SecretsCounter.tsx`**

```tsx
import { useSecrets } from '../SecretsContext'

interface Props {
  onOpenVault: () => void
}

/**
 * The hunt's scoreboard — fixed bottom-right, mirroring the audio
 * button bottom-left. Hidden until the first egg is found (before
 * that it would spoil the surprise; the pulsing halos invite the
 * first tap). Once every secret is open it becomes the vault key.
 */
export default function SecretsCounter({ onOpenVault }: Props) {
  const { found, total, allFound } = useSecrets()

  if (found.size === 0) return null

  if (!allFound) {
    return (
      <p
        role="status"
        className="fixed right-4 bottom-4 z-40 rounded-full bg-white/95 px-4 py-2.5 font-hand text-lg leading-none text-ink shadow-md ring-2 ring-rose/40"
      >
        {found.size} / {total} secrets
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpenVault}
      aria-label="Open the vault of extra photos"
      className="fixed right-4 bottom-4 z-40 flex cursor-pointer items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 font-hand text-lg leading-none text-rose shadow-md ring-2 ring-rose/40"
    >
      <span aria-hidden className="relative flex h-4 w-4 items-center justify-center">
        <span aria-hidden className="egg-ping absolute inset-0 rounded-full bg-rose/50" />
        🔓
      </span>
      open the vault
    </button>
  )
}
```

- [ ] **Step 2: Render in App**

`src/App.tsx` — add state + chip (vault overlay itself lands in Task 6):

```tsx
const [vaultOpen, setVaultOpen] = useState(false)
// …inside <main>, next to <AudioPlayer />:
<SecretsCounter onOpenVault={() => setVaultOpen(true)} />
```

- [ ] **Step 3: Typecheck + browser verify**

`npx tsc -b` clean. Browser pane: with a cleared `localStorage`, no chip in DOM; after clicking one egg (two-eval pattern), `document.querySelector('[role="status"]')?.textContent` is `"1 / 7 secrets"` (7 arrives with Task 7's video egg — until then expect `"1 / 6 secrets"`). Seed all ids into localStorage + reload → the vault button exists.

- [ ] **Step 4: Commit checkpoint (Gabriel commits)**

Files: `src/components/SecretsCounter.tsx`, `src/App.tsx`
Suggested message: `Add secrets counter that becomes the vault key`

---

### Task 5: Vault content — identify, convert, and caption the outtakes

**Files:**
- Create: `public/photos/vault-*.webp` (~15 files)
- Modify: `src/content.ts` (add `vault` to `Content` interface + data)

- [ ] **Step 1: Identify the unused raws**

Compare `photos-raw/photos/` against the 22 shipped photos. Filename dates give the era; for ambiguous groups (3× Bohol `IMG_20191108_*`, 2× day-one `P_20180715_1142*`, 2× `IMG_20210522_*`, 2× July-2020, 2× `P_20180722_*`), **Read the raw images and the shipped webp side by side** to confirm which one shipped. Expected pool (~15, from the spec): 2 day-one variants, 1 travel-wall variant, Nov 25 2018 road, 2 white-wall Jan 2019, 2 Bohol extras, 1 Jul 2020 extra, NYE 2021, Feb 27 2021, 1 May 2021 extra, Oct 8 2023, Apr 13 2024, Jun 17 2025.

- [ ] **Step 2: Convert to WebP**

Use the available encoder (check `which cwebp` first; fall back to `sips` + `cwebp`, or `ffmpeg -i in.jpg -vf scale=1200:-2 out.webp`):

Run for each raw (bash loop over the confirmed list):
```bash
cwebp -q 82 -resize 1200 0 "photos-raw/photos/<raw>" -o "public/photos/vault-NN.webp"
```
Number `vault-01` … `vault-15` in chronological order. Verify: every output < 400KB (`ls -la public/photos/vault-*`); spot-check one visually with Read.

- [ ] **Step 3: Draft captions**

Read each converted image and draft a Caveat-voice caption + display date (e.g. `'the other day-one shot'`, `'Jul 15, 2018'`). **Truthfulness rule: describe only what is visibly in the photo — no invented memories.** Flag all captions for Gabriel's review in the task summary.

- [ ] **Step 4: Add `vault` to content.ts**

Interface addition (after `ninthIsland` in `Content`):

```ts
export interface Content {
  // …existing…
  vault: { title: string; note: string; photos: Polaroid[] }
}
```

Data (after `ninthIsland`, before `letter`):

```ts
vault: {
  title: 'The outtakes',
  note: 'Every photo that didn\'t fit on an island — found because you looked closer.',
  photos: [
    { src: '/photos/vault-01.webp', caption: '<drafted>', date: '<drafted>' },
    // …one entry per converted photo, chronological…
  ],
},
```

- [ ] **Step 5: Typecheck**

`npx tsc -b` — clean (the interface addition forces the data to exist).

- [ ] **Step 6: Commit checkpoint (Gabriel commits)**

Files: `public/photos/vault-*.webp`, `src/content.ts`
Suggested message: `Add vault outtake photos and captions`
**Reminder to Gabriel: review every caption before launch.**

---

### Task 6: Vault overlay

**Files:**
- Create: `src/components/VaultOverlay.tsx`
- Modify: `src/App.tsx` (render overlay; generalize lightbox state)

- [ ] **Step 1: Generalize App's lightbox state**

The lightbox must serve both era decks and the vault deck. In `src/App.tsx`, replace the era-shaped state:

```tsx
const [lightbox, setLightbox] = useState<{ polaroids: Polaroid[]; index: number } | null>(null)
```

Update the era wiring: `onOpenPolaroid={(e, index) => setLightbox({ polaroids: e.polaroids, index })}`, and the render:

```tsx
{lightbox && (
  <Lightbox
    polaroids={lightbox.polaroids}
    index={lightbox.index}
    onNavigate={(index) => setLightbox({ polaroids: lightbox.polaroids, index })}
    onClose={() => setLightbox(null)}
  />
)}
```

(`Lightbox.tsx` itself needs no changes — it already takes `polaroids`.) Import `Polaroid` type from `./content`.

- [ ] **Step 2: Create `src/components/VaultOverlay.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { content } from '../content'

interface Props {
  /** True while a Lightbox is stacked on top — suspends ESC/interaction. */
  suspended: boolean
  onOpenPhoto: (index: number) => void
  onClose: () => void
}

/**
 * The treasure-hunt payoff: a fullscreen gallery of the outtakes,
 * unlocked by finding every easter egg. Same modal conventions as
 * Lightbox (scroll lock, ESC, entrance via timer — rAF is suspended
 * in background tabs). Sits at z-45, below the Lightbox that opens
 * on top of it.
 */
export default function VaultOverlay({ suspended, onOpenPhoto, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    closeButton.current?.focus()
    const timer = window.setTimeout(() => setEntered(true), 20)
    return () => {
      document.documentElement.style.overflow = previous
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (suspended) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [suspended, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content.vault.title}
      className={`fixed inset-0 z-45 overflow-y-auto bg-cream transition-opacity duration-300 motion-reduce:transition-none ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <p className="text-xs tracking-[0.2em] text-rose uppercase">
          Secret unlocked
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">
          {content.vault.title}
        </h2>
        <p className="mx-auto mt-2 max-w-md font-hand text-xl text-ink-soft">
          {content.vault.note}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {content.vault.photos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => onOpenPhoto(i)}
              aria-label={`Enlarge photo: ${p.caption}`}
              className="cursor-pointer bg-white p-2 pb-3 shadow-lg transition-transform duration-200 hover:z-10 hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
              style={{ transform: `rotate(${((i * 7) % 11) - 5}deg)` }}
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
              <span className="mt-1 block font-hand text-sm leading-tight text-ink-soft">
                {p.caption}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        ref={closeButton}
        type="button"
        aria-label="Close the vault"
        onClick={onClose}
        className="fixed top-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-blush-soft text-lg text-ink shadow-md"
      >
        ✕
      </button>
    </div>
  )
}
```

**Note on `motion-reduce:transform-none`:** the scatter rotation is inline style, which wins over the class — so ALSO gate the inline style: `style={prefersReducedMotion() ? undefined : { transform: … }}` using the existing helper in `src/lib/motion.ts` (check its exact export name before using; if none exists, `matchMedia('(prefers-reduced-motion: reduce)').matches` inline).

- [ ] **Step 3: Render in App**

```tsx
{vaultOpen && (
  <VaultOverlay
    suspended={lightbox !== null}
    onOpenPhoto={(index) => setLightbox({ polaroids: content.vault.photos, index })}
    onClose={() => setVaultOpen(false)}
  />
)}
```

Render order in JSX: vault BEFORE the lightbox block so the lightbox (z-50) stacks above the vault (z-45).

- [ ] **Step 4: Typecheck + browser verify**

`npx tsc -b` clean. Browser pane sequence (separate evals):
1. Seed all egg ids into `localStorage` (`eightyears:secrets`), reload.
2. Click the vault button → dialog present, `document.documentElement.style.overflow === 'hidden'`, photo count matches content.
3. Click a photo → Lightbox present ABOVE vault (both dialogs in DOM).
4. Send Escape → lightbox gone, vault still open. Escape again → vault gone, overflow restored.

- [ ] **Step 5: Commit checkpoint (Gabriel commits)**

Files: `src/components/VaultOverlay.tsx`, `src/App.tsx`
Suggested message: `Add the unlockable vault gallery`

---

### Task 7: Day-one video — asset, 7th egg, player, song coordination

**Files:**
- Create: `public/video/day-one.mp4`
- Create: `src/components/VideoOverlay.tsx`
- Modify: `src/content.ts` (EasterEgg.video field + 🎬 egg)
- Modify: `src/components/EasterEggButton.tsx` (play button in popover)
- Modify: `src/components/EraSection.tsx`, `src/App.tsx` (thread `onPlayVideo`)
- Modify: `src/components/AudioPlayer.tsx` (pause/resume events)

- [ ] **Step 1: Re-encode the video**

```bash
mkdir -p public/video
ffmpeg -i "photos-raw/photos/V_20180715_113655.mp4" \
  -vf "scale=1280:-2" -c:v libx264 -crf 26 -preset slow \
  -movflags +faststart -c:a aac -b:a 96k \
  public/video/day-one.mp4
ls -la public/video/day-one.mp4
```
Expected: ≤3MB. If over, bump `-crf 28`. **Show Gabriel a frame** (extract with `ffmpeg -ss 5 -i public/video/day-one.mp4 -frames:v 1 <scratchpad>/frame.jpg` and Read it) and get his OK on quality.

- [ ] **Step 2: content.ts — video field + 7th egg**

```ts
export interface EasterEgg {
  x: number
  y: number
  icon: string
  message: string
  /** Optional: a video this egg offers to play (fullscreen overlay). */
  video?: string
}
```

Add to era 1's `easterEggs` (coords clear of the 🗺️ egg at 0.62/0.41 — verify against the art in the browser and nudge if overlapping):

```ts
{ x: 0.35, y: 0.55, icon: '🎬', video: '/video/day-one.mp4', message: 'July 15, 2018. Twenty-one seconds of the actual day one. Press play.' },
```

- [ ] **Step 3: Create `src/components/VideoOverlay.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  onClose: () => void
}

/**
 * Fullscreen player for an easter egg's video. Native controls only.
 * Pauses "our song" while open (AudioPlayer listens for the events)
 * and hands playback back on close.
 */
export default function VideoOverlay({ src, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    closeButton.current?.focus()
    window.dispatchEvent(new CustomEvent('pause-song'))
    const timer = window.setTimeout(() => setEntered(true), 20)
    return () => {
      document.documentElement.style.overflow = previous
      window.clearTimeout(timer)
      window.dispatchEvent(new CustomEvent('resume-song'))
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video: day one"
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/85 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <video
        src={src}
        controls
        playsInline
        preload="none"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80svh] w-full max-w-3xl px-4"
      />
      <button
        ref={closeButton}
        type="button"
        aria-label="Close video"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-lg text-ink shadow-md"
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Play button in the egg popover**

`EasterEggButton.tsx` — new prop `onPlayVideo: (src: string) => void`; inside the popover, after the message `<p>`:

```tsx
{egg.video && (
  <button
    type="button"
    onClick={() => onPlayVideo(egg.video!)}
    className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-rose px-4 py-1.5 font-hand text-lg leading-none text-white shadow-sm"
  >
    ▶ press play
  </button>
)}
```

Thread the prop: `App.tsx` gains `const [video, setVideo] = useState<string | null>(null)`; `EraSection` gains `onPlayVideo` in Props and passes it through to each `EasterEggButton`; App renders:

```tsx
{video && <VideoOverlay src={video} onClose={() => setVideo(null)} />}
```

- [ ] **Step 5: AudioPlayer listens for pause/resume**

Add to `AudioPlayer.tsx` (alongside existing state; note it currently has no useEffect — add the import):

```tsx
// resumeAfterVideo: only resume if the song was actually playing
// when the video interrupted it.
const resumeAfterVideo = useRef(false)

useEffect(() => {
  const onPause = () => {
    const el = audio.current
    if (!el || el.paused) return
    resumeAfterVideo.current = true
    el.pause()
    setPlaying(false)
  }
  const onResume = () => {
    const el = audio.current
    if (!el || !resumeAfterVideo.current) return
    resumeAfterVideo.current = false
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }
  window.addEventListener('pause-song', onPause)
  window.addEventListener('resume-song', onResume)
  return () => {
    window.removeEventListener('pause-song', onPause)
    window.removeEventListener('resume-song', onResume)
  }
}, [])
```

- [ ] **Step 6: Typecheck + browser verify**

`npx tsc -b` clean. Browser pane (separate evals): open 🎬 popover → "press play" button present; click it → video dialog in DOM with `preload="none"` and no network fetch of the mp4 yet (`read_network_requests` filter `day-one`); counter now says `n / 7`; ESC closes; with the song playing first, opening the video pauses it (`aria-pressed` false) and closing resumes it.

- [ ] **Step 7: Commit checkpoint (Gabriel commits)**

Files: `public/video/day-one.mp4`, `src/components/VideoOverlay.tsx`, `src/components/EasterEggButton.tsx`, `src/components/EraSection.tsx`, `src/components/AudioPlayer.tsx`, `src/content.ts`
Suggested message: `Add the day-one video as the seventh secret`

---

### Task 8: Full verification pass

**Files:** none (verification only; fix regressions in place)

- [ ] **Step 1: Unit tests + typecheck + lint + build**

```bash
npx vitest run && npx tsc -b && npm run lint && npm run build
```
Expected: all clean. Check `dist/` output: initial JS bundle stays ~112KB gzip (vault/video components are small; no new deps shipped).

- [ ] **Step 2: Fresh-visitor flow (browser pane, cleared localStorage)**

No counter chip on load → open each of the 7 eggs (two-eval pattern per egg; JS-scroll between eras) → chip counts up → at 7/7 the vault button appears → vault opens with all photos → photo → Lightbox above vault → ESC → ESC → vault closes.

- [ ] **Step 3: Persistence + reduced-motion + perf**

Reload mid-hunt → count survives. Emulate reduced motion (`resize_window` colorScheme won't do it — use CSS media emulation via devtools protocol if available, else verify classes: `.egg-ping` opacity 0 rule, vault rotation gated, counter renders static). Perf: initial page load fetches no `vault-*.webp` and no `day-one.mp4` (`read_network_requests`).

- [ ] **Step 4: Update project memory + hand Gabriel the summary**

Append vault/video completion state to the `anniversary-surprise-project` memory file. Summary for Gabriel must list: all vault captions for review, the video-quality frame, the era6-01 caption still outstanding, iPhone Safari checklist now including hunt/vault/video.

---

## Self-review notes

- **Spec coverage:** data model → T5+T7; tracking → T1–T3; counter → T4; vault → T5–T6; video → T7; testing → per-task + T8; open items → T8 step 4 summary. Cut order preserved: T7 is independent of T4–T6; if time runs out mid-plan, tasks 1–4 without 5–6 must NOT ship a counter with no vault — revert the chip render (one line in App) before launch.
- **Type consistency:** `eggId(eraId, icon)` / `markFound(eraId, icon)` / `totalSecrets(eras)` consistent across T1–T4; `Polaroid`-shaped lightbox state consistent across T6 wiring.
- **No placeholders:** captions/coords marked `<drafted>` are produced by executing the step (Read the photos, verify against art) — not deferred work.
