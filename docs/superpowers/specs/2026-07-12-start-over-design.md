# Start Over (Reset Everything) — Design

**Date:** 2026-07-12
**Project:** anniversary-surprise (8th-anniversary scroll world, launches 2026-07-15)

## Goal

A visible "start over" control that lets Jhen replay the whole experience from
scratch: it re-locks the date gate and erases the secrets-hunt progress, so a
replay begins at the gate with all 7 easter eggs undiscovered.

## Decisions (from brainstorming)

- **Audience/trigger:** a visible in-UI control for Jhen (not a hidden URL param).
- **Scope:** resets *everything* — both the gate unlock and the found secrets.
  Re-entering the date on replay is part of the ritual, not friction.
- **Placement:** end of the finale, under the day counter in the closing block.
  She only meets it after finishing the story; it cannot interrupt a first run.
- **Mechanism:** clear localStorage, then full page reload with the query
  string stripped. The reload resets all runtime state for free (scroll to
  top, GSAP re-init, song stops, counter chip gone). Stripping the query is
  required: `isUnlocked()` has an owner bypass (`?key=YYYYMMDD`) that would
  silently re-unlock the gate on reload if the param survived.
- **Confirmation:** a two-step inline confirm. One stray tap must not wipe a
  7/7 hunt. No `window.confirm()` — a native dialog would break the mood.

## Persistent state inventory

All persistence is exactly two localStorage keys:

| Key | Module | Meaning |
|---|---|---|
| `eightyears:unlocked` | `src/lib/gate.ts` | date gate passed |
| `eightyears:secrets` | `src/lib/secrets.ts` | JSON array of found egg ids |

Both keys are private constants in their modules and stay that way — each
module exports its own reset function.

## Components

### `src/lib/gate.ts` — add `lock()`

```ts
export function lock(): void {
  localStorage.removeItem(STORAGE_KEY)
}
```

Matches the module's existing style (direct `localStorage`, no injection).

### `src/lib/secrets.ts` — add `clearFound()`

```ts
export function clearFound(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // private-mode / blocked storage: nothing to clear
  }
}
```

Matches the module's existing style (injectable storage, try/catch). Gets a
vitest case in `src/lib/secrets.test.ts`.

### `src/components/StartOver.tsx` — new

Self-contained component, no props, no context. Two states:

- **Idle:** a quiet hand-written (`font-hand`) link:
  `relive it from the beginning ↺`
- **Confirming** (after one tap): the link swaps inline for a one-line
  question — `start over? the secrets reset too —` — with two buttons at
  44px min tap height:
  - **yes, take me back** → `clearFound(); lock();
    window.location.replace(window.location.pathname)`
  - **keep this** → back to idle

Styling follows the finale's closing block (small, `text-ink-soft` /
`text-rose` accents, `cursor-pointer`, `min-h-11` targets). No animation of
its own, so `prefers-reduced-motion` needs no special handling.

### `src/components/Finale.tsx` — one-line change

Render `<StartOver />` inside the existing `closing` div, below `<Counter />`.
It inherits the closing block's scroll reveal; no GSAP changes.

## Data flow

```
tap link → confirming state → tap "yes, take me back"
  → clearFound()  (removes eightyears:secrets)
  → lock()        (removes eightyears:unlocked)
  → window.location.replace(window.location.pathname)
      (reload, query string stripped → ?key bypass cannot re-unlock)
→ fresh visit: Gate renders, no counter chip, 0/7 secrets
```

## Error handling

- Storage failures in `clearFound` are swallowed (same policy as
  `loadFound`/`saveFound`); `lock()` uses `removeItem`, which does not throw
  on missing keys. Worst case the reload still happens and the app behaves
  per whatever state actually persisted.
- Tapping "yes" when nothing was found/unlocked is harmless: `removeItem` on
  absent keys is a no-op and the reload just re-shows the gate.

## Testing

- **vitest:** `clearFound` removes the key; `clearFound` swallows a throwing
  storage.
- **Browser sweep:** unlock via gate → find ≥1 secret (chip shows) → scroll
  to finale → tap link → confirm prompt appears → "keep this" returns to
  idle → tap again → "yes, take me back" → page reloads on the bare path,
  Gate is shown, no counter chip; re-unlock and confirm secrets are 0/7.
  Also verify from `/?key=20180715` that the reload lands on `/` (param
  stripped) with the gate locked.
- **Gates:** `npm test`, `tsc`, oxlint, build — all clean.

## Out of scope

- Hidden owner/dev reset URL param (declined — the visible control covers it).
- Resetting anything beyond the two keys (there is no other persistent state).
- Soft in-app reset without reload (rejected: touches five subsystems for no
  user-visible gain).
