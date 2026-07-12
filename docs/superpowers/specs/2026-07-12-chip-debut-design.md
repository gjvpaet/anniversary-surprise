# Chip Debut (Sound + Glow + Tooltip) — Design

**Date:** 2026-07-12
**Project:** anniversary-surprise (8th-anniversary scroll world, launches 2026-07-15)

## Goal

Make the secrets-counter chip's first appearance impossible to miss and
self-explanatory: when Jhen finds her first secret and the chip pops in
bottom-right, a short chime plays, the chip glows for a couple of seconds,
and a hand-written tooltip above it explains what it is. The tooltip stays —
across reloads too — until she closes it herself.

## Decisions (from brainstorming)

- **Sound trigger:** only on the chip's first appearance — the live
  `found.size` 0 → 1 transition. Later finds and the 7/7 vault morph stay
  silent (the eggs already have their own moment).
- **Tooltip life:** persists until she dismisses it once. Dismissal is
  remembered in localStorage; "start over" clears it so a replay shows the
  tooltip again.
- **Tooltip copy (fixed, truthful, doesn't spoil the vault):**
  `you found a secret! 7 are hidden around our world — find them all and something opens…`
- **Glow:** tied to the same live 0 → 1 event as the sound — a reload with a
  persisted secret mounts the chip quietly (no sound, no glow, tooltip still
  there if undismissed).

## Assets

- Copy `~/Downloads/sound5.wav` → `public/audio/secret-found.wav`
  (0.29 s mono 44.1 kHz WAV, 25 KB — ships as-is, no conversion; smaller
  than any polaroid and decodes instantly).

## Persistent state inventory (updated)

The start-over spec's "exactly two keys" inventory grows to three:

| Key | Module | Meaning |
|---|---|---|
| `eightyears:unlocked` | `src/lib/gate.ts` | date gate passed |
| `eightyears:secrets` | `src/lib/secrets.ts` | JSON array of found egg ids |
| `eightyears:hint` | `src/lib/hint.ts` (new) | counter tooltip dismissed |

Each key stays a private constant in its module; each module exports its own
reset, and `StartOver` calls all three.

## Components

### `src/lib/hint.ts` — new

Follows the secrets.ts storage pattern exactly (injectable `Storage`,
fault-tolerant try/catch, key private to the module):

```ts
const STORAGE_KEY = 'eightyears:hint'

/** Has she closed the counter tooltip? Storage failure ⇒ false
 *  (tooltip shows again — annoying at worst, never a crash). */
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
    // storage unavailable — dismissal lasts this visit only (component state)
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

Vitest coverage in `src/lib/hint.test.ts` (reusing the `fakeStorage` helper
pattern from secrets.test.ts).

### `src/components/SecretsCounter.tsx` — modified

Three additions, all local to this component:

1. **First-appearance detection.** A ref captures `found.size` at mount;
   an effect watches for the live 0 → 1 transition. On a reload where
   secrets are already persisted the ref starts ≥ 1, so nothing fires.
   A one-shot guard (`debutPlayed` ref) keeps dev StrictMode's
   double-invoked effects from firing the chime twice.
   Rules-of-hooks note: the component today returns `null` before the chip
   renders (`if (found.size === 0) return null`) — all new hooks must sit
   ABOVE that early return. The component stays mounted at 0 secrets, which
   is exactly what lets the ref start at 0 and the effect see the
   transition.

2. **Chime.** On the debut event:
   `new Audio('/audio/secret-found.wav').play().catch(() => {})`.
   The transition happens synchronously inside her tap on the egg, so
   autoplay policies allow it; if a browser blocks it anyway, the catch
   swallows it — the sound is garnish, never load-bearing. No ducking or
   pause of the song: a 0.3 s chime layered over it is fine.

3. **Glow + tooltip state.**
   - `glowing` state, set to true by the debut event and never unset: while
     true, the counting chip renders an `aria-hidden` overlay span
     (`chip-glow pointer-events-none absolute inset-0 rounded-full`) whose box-shadow the
     keyframe animates; the fixed iteration count (3) ends the animation by
     itself. No timer, no animationend listener. The span lives only in the
     counting `<p>` variant — the debut is always a 0 → 1 transition, so the
     7/7 vault button can never be the glowing chip.
   - `hintDismissed` state initialized lazily from `isHintDismissed()`.
     The tooltip renders whenever the chip renders and `!hintDismissed` —
     including after reloads and after the chip morphs into "open the
     vault" at 7/7. Its ✕ button sets the state and calls `dismissHint()`.

**Tooltip markup:** a bubble `fixed right-4 bottom-20 z-40 w-56` (clear of
the chip below it), white bg, `font-hand text-lg`, rounded, `shadow-md`,
`egg-pop` entrance (already reduced-motion-safe in index.css). Inside: the
copy plus a ✕ close button, `min-h-11 min-w-11` tap target,
`aria-label="got it"`. The bubble is plain informative content (a `<p>` +
button), no `role="tooltip"` gymnastics — it isn't hover-triggered.

### `src/index.css` — new keyframe

Appended after the `egg-ping` block, same idiom:

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

(0.9 s × 3 ≈ 2.7 s total. The class goes on an `aria-hidden`
`absolute inset-0 rounded-full` span INSIDE the chip — never on the chip
itself, or the animation's box-shadow would replace the chip's
`ring-2 ring-rose/40` + `shadow-md` (both box-shadow composites in
Tailwind v4) for the entire debut. Fading to
`color-mix(… 0%, transparent)` rather than the `transparent` keyword keeps
the rose hue through the fade instead of drifting toward black.
Reduced-motion users lose only the glow; the chime and tooltip still make
the debut noticeable.)

### `src/components/StartOver.tsx` — one-line change

`reset()` adds `clearHint()` alongside `clearFound()` and `lock()` inside
the existing `try` block, and the import list gains
`import { clearHint } from '../lib/hint'`. The doc comment's "both
localStorage keys" wording updates to cover all three.

## Data flow

```
tap first egg → markFound → found.size 0 → 1
  SecretsCounter effect sees live transition (mount ref was 0):
    → play /audio/secret-found.wav   (catch → silent)
    → add .chip-glow                 (3 pulses, ~2.7 s, self-terminating)
    → tooltip visible (was already: chip visible && !isHintDismissed())
she taps ✕ → dismissHint() → tooltip gone on every future visit
"start over" → clearHint() (+ existing resets) → replay debuts again
```

## Error handling

- Audio blocked/missing → `.catch(() => {})`, silent no-op.
- Storage blocked → `isHintDismissed()` returns false (tooltip shows,
  dismissal lasts the visit via component state); `dismissHint`/`clearHint`
  swallow, matching secrets.ts policy.
- StrictMode double-effect → one-shot ref guard on the debut event.

## Testing

- **vitest (`src/lib/hint.test.ts`):** not dismissed by default; dismissed
  after `dismissHint`; `clearHint` removes the key; all three never throw
  on a blocked storage.
- **Browser sweep:** fresh state → find first egg → chip appears with glow
  class + tooltip, network shows the wav requested (the pane's hidden tab
  may block actual playback — verify the request/element, not audibility)
  → ✕ dismisses → reload → chip yes, tooltip no → localStorage has
  `eightyears:hint` → start over → replay: gate → first egg → debut fires
  again. Reduced-motion: no glow animation, tooltip still present.
- **Gates:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run build`.

## Out of scope

- Chime on later finds or on the 7/7 vault morph (declined).
- Ducking/pausing the song for the chime.
- Web Audio API preloading (a plain `Audio` element is enough).
- Tooltip copy changes per state (same text even after the vault morph).
