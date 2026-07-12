# Completion Celebration (Confetti + Yay + Song Autoplay + Ducking) — Design

**Date:** 2026-07-12
**Project:** anniversary-surprise (8th-anniversary scroll world, launches 2026-07-15)

## Goal

Three things, all in service of the moment Jhen finishes the hunt:

1. When she finds the **7th secret live**, a full-screen confetti burst fires
   and a children's "yay!" cheer plays.
2. **"Our song" starts by itself** — she should never have to find the ♪
   button. (This deliberately overrides the old PRD §7 "no autoplay"
   decision; the gate gives us the user gesture that makes it reliable.)
3. While any sound effect plays, the song **ducks** (volume dips) so the
   effect is clearly audible over it, then swells back.

## Decisions (from brainstorming)

- **Song start:** immediately when the AudioPlayer mounts — which is the
  moment the world appears. After a live gate unlock, her "Come in" tap is
  the authorizing gesture, so playback is allowed. One uniform code path
  for fresh unlocks and return visits.
- **Return visits (persisted unlock, no gesture):** try anyway; if the
  browser blocks it, a one-time `pointerdown`/`keydown` listener starts the
  song on her first interaction, then removes itself. If that fails too,
  the ♪ button still works as today.
- **Confetti:** one big celebratory burst (a few staggered shots over
  ~1.5 s, particles settle in ~4 s), fired only on the **live** 7th find —
  same "live transition" rule as the counter's debut chime. A reload
  already at 7/7 stays quiet. Not persisted; "start over" needs no change
  (a replay celebrates again for free because nothing new is stored).
- **Confetti engine:** `canvas-confetti` (new runtime dependency, ~5 KB
  gzip, zero sub-dependencies, self-cleaning full-screen canvas,
  `disableForReducedMotion` built in) + `@types/canvas-confetti` devDep.
  Rejected: hand-rolled canvas physics (~150 untested lines), DOM/CSS
  confetti (janky at realistic particle counts).
- **Ducking mechanism:** Web Audio gain node wrapped around the song's
  `<audio>` element. Rejected: tweening `HTMLMediaElement.volume` — iPhone
  Safari **ignores** the volume property (Apple reserves volume for the
  hardware buttons), and her device is an iPhone, so the simple approach
  would silently do nothing exactly where it matters.

## Assets

- Copy `~/Downloads/Children Yay Sound Effect (HD).mp3` →
  `public/audio/all-found.mp3` as-is (6.7 s stereo 44.1 kHz, 162 KB —
  fetched only at the celebration moment, never on initial load).

## Persistent state

**No new localStorage keys.** The three-key inventory
(`eightyears:unlocked`, `eightyears:secrets`, `eightyears:hint`) is
unchanged; `StartOver` is untouched.

## Components

### `src/lib/sfx.ts` — new

The single way sound effects play. Owns the duck/unduck contract:

```ts
/**
 * Play a one-shot sound effect, ducking "our song" underneath it.
 * The AudioPlayer listens for duck-song / unduck-song; if the song
 * isn't playing (or Web Audio is unavailable) the events are no-ops.
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

Every terminal path — `ended`, a mid-playback `error` (without the error
listener the song would stick at 20% until the next effect), or a rejected
`play()` (blocked OR failed load; rejection + error is the realistic
failed-load pair) — funnels through the once-guarded unduck, so exactly
one unduck fires per call. Effects don't overlap in practice (the chime is
first-find-only, the yay is 7th-find-only), so plain duck/unduck events
need no nesting counter — accepted simplification, noted here so a future
third effect knows to revisit it.

### `src/components/AudioPlayer.tsx` — modified

Three additions; the ♪ toggle, the label, and the video pause/resume
events stay exactly as they are.

1. **Autoplay on mount.** A mount effect calls `el.play()`. Success →
   `setPlaying(true)`, `setEverPlayed(true)`. Rejection → arm one-time
   `pointerdown` + `keydown` window listeners that retry once (whichever
   fires first; a redundant second `play()` on an already-playing element
   resolves harmlessly). Effect cleanup removes both listeners. Dev
   StrictMode double-invokes the mount effect — the second `play()` on a
   playing element just resolves; no guard needed.
   The component's doc comment updates: playback now starts itself off the
   gate gesture (overriding PRD §7), button remains as manual control.

2. **Web Audio graph (lazy).** On every successful play (autoplay, retry,
   toggle, resume-after-video), call an idempotent `ensureGraph()`:

   ```ts
   // refs: ctx: AudioContext | null, gain: GainNode | null
   const ensureGraph = () => {
     const el = audio.current
     if (!el || gain.current) return
     try {
       const ctx = new AudioContext()
       const source = ctx.createMediaElementSource(el) // legal once per element
       const g = ctx.createGain()
       source.connect(g).connect(ctx.destination)
       ctxRef.current = ctx
       gain.current = g
     } catch {
       // Web Audio unavailable — song plays unducked, nothing else breaks
     }
   }
   ```

   Once a media element is routed through a graph its sound only reaches
   the speakers via the graph, so every play path also calls
   `ctxRef.current?.resume()` (iOS suspends contexts aggressively;
   `resume()` on a running context is a no-op). As a safety net a
   component-lifetime `pointerdown` listener also resumes a suspended
   context — if iOS's stricter gesture rules ever leave the graph
   suspended (which would silence the routed song), her next tap heals it.

3. **Duck listeners**, registered alongside the existing
   `pause-song`/`resume-song` pair:

   ```ts
   const ramp = (target: number, seconds: number) => {
     const g = gain.current
     if (!g) return
     const t = g.context.currentTime
     g.gain.cancelScheduledValues(t)
     g.gain.setValueAtTime(g.gain.value, t)
     g.gain.linearRampToValueAtTime(target, t + seconds)
   }
   // 'duck-song'   → ramp(0.2, 0.15)  — dip to 20% in 150 ms
   // 'unduck-song' → ramp(1, 0.6)     — swell back over 600 ms
   ```

### `src/lib/celebrate.ts` — new

One exported `celebrate()`: a few staggered `canvas-confetti` shots
(e.g. a wide center burst, then two angled side bursts ~300 ms and
~600 ms later via `setTimeout`) with `disableForReducedMotion: true` on
every shot. Colors come from the theme at runtime so the palette stays
single-sourced (canvas can't read CSS variables):

```ts
const themeColor = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
// palette: --color-rose, --color-blush, --color-sky, --color-lavender, --color-sage
// (not --color-cream — it's the page background; cream confetti would vanish)
```

canvas-confetti's own canvas is fixed, full-screen, `pointer-events: none`,
z-index above everything (default 100 > Lightbox's z-50) — confetti falls
over the world without ever blocking her tap on "open the vault".

### `src/components/SecretsCounter.tsx` — modified

1. **Chime switches to the ducking path:** the debut effect's
   `new Audio('/audio/secret-found.wav').play().catch(() => {})` becomes
   `playEffect('/audio/secret-found.wav')`.

2. **Completion effect**, mirroring the debut pattern one level up:

   ```ts
   const completionFired = useRef(false)
   useEffect(() => {
     // live 7th find only: a reload already at 7/7 mounts quiet
     // >= not ===: matches allFound's defensive semantics, so stale
     // storage overcounting past total can't celebrate on every reload
     if (!allFound || sizeAtMount.current >= total || completionFired.current) return
     completionFired.current = true
     playEffect('/audio/all-found.mp3')
     celebrate()
   }, [allFound, total])
   ```

   `sizeAtMount` (already there for the debut) does double duty: a visit
   that *starts* at 7/7 never celebrates; a visit that starts at 5/7 and
   finishes live does. Hooks stay above the `found.size === 0` early
   return, as before.

## Data flow

```
gate "Come in" tap → world mounts → AudioPlayer mount effect → song plays
  (blocked on a return visit → first pointerdown/keydown retries once)

tap 7th egg → markFound → allFound flips true (live)
  SecretsCounter completion effect (one-shot, live-only):
    → playEffect('/audio/all-found.mp3')
        → 'duck-song' → gain 1 → 0.2 in 150 ms
        → yay plays (6.7 s) over the quiet song
        → 'ended' → 'unduck-song' → gain 0.2 → 1 in 600 ms
    → celebrate() → confetti burst, self-cleans in ~4 s
  chip morphs to "open the vault" (existing behavior, unchanged)
```

## Error handling

- Song autoplay blocked twice (mount + first gesture) → button still works;
  no error surfaces.
- Effect audio blocked or 404 → `play()` rejects → unduck fires → silence,
  no stuck-quiet song, no crash. Effects are garnish, never load-bearing.
- Web Audio unavailable / `createMediaElementSource` throws → caught; song
  plays at full volume, duck events no-op.
- Reduced motion → `disableForReducedMotion` skips all particles; the yay
  and the vault morph still mark the moment.
- StrictMode double-effects → one-shot ref (completion), idempotent
  `ensureGraph`, harmless double `play()` (autoplay).

## Testing

- **vitest (`src/lib/sfx.test.ts`):** duck fires before `play()`; unduck
  fires on `ended`; unduck fires when `play()` rejects; exactly one unduck
  per call. The suite runs in vitest's default node environment (no DOM
  package installed) — Node ships `EventTarget` and `CustomEvent` natively,
  so the tests `vi.stubGlobal('window', new EventTarget())` and stub
  `Audio` with a fake exposing `play`/`addEventListener`. No new
  devDependency.
- **Browser sweep:** fresh state → gate tap → song starts on its own →
  find eggs 1–6 (chime ducks the song — gain node value assertable) → 7th
  egg → confetti canvas appears + yay requested + gain dips to 0.2 and
  recovers to 1 → "open the vault" tappable during confetti → reload at
  7/7 → no confetti, no yay, song resumes on first tap → reduced-motion →
  no particles, audio intact. (The pane's hidden tab can't prove
  audibility — verify requests, gain values, and canvas presence.)
- **Gates:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run build`.
- **Real-iPhone checklist grows:** song starts after "Come in"; ducking
  audibly works (the whole reason for Web Audio); celebration audible.

## Out of scope

- Ducking during the day-one video (the song already fully pauses).
- Confetti on opening the vault or on later visits (live 7th find only).
- Trimming or normalizing the yay clip (ships as-is, like the chime).
- A nesting counter for overlapping effects (only two effects exist and
  they can't overlap).
- Any change to StartOver or the localStorage inventory.
