# The Vault & the Day-One Video — design spec

**Date:** 2026-07-12 · **Launch deadline:** 2026-07-15 (hard)
**Approach:** A — full-screen overlay vault, unlocked by finding all easter eggs. Approved by Gabriel 2026-07-12.

## Overview

Two additions to the anniversary site, both built as fixed-position overlay UI
with **zero changes to the GSAP scroll engine, pinned sections, or existing
timelines** (that's the point of approach A — no layout surgery three days
before launch):

1. **Day-one video easter egg** — a second egg on the Chapter 1 island opens
   the July 15, 2018 video (`V_20180715_113655.mp4`) in a full-screen player.
2. **The vault** — a hidden bonus gallery of the ~15 unused photos, unlocked
   by finding all **7** easter eggs (6 existing + the new video egg), with a
   persistent "n / 7 secrets" counter chip.

## Goals / non-goals

**Goals:** turn the existing eggs into a treasure hunt with a real payoff; use
the unused photo pool; surface the day-one video; keep every addition
overlay-only and launch-safe.

**Non-goals:** no new scroll sections, no changes to era timelines or the
finale swirl, no fallback vault link after the letter (Gabriel's explicit
choice — if she misses an egg she doesn't see the vault; the counter chip is
the mitigation), no analytics, no sharing features.

## Data model (`src/content.ts`)

```ts
export interface EasterEgg {
  x: number
  y: number
  icon: string
  message: string
  /** Optional: path to a video the popover offers to play (new) */
  video?: string
}

export interface Content {
  // …existing fields…
  vault: {
    title: string        // e.g. "The outtakes"
    note: string         // one line, Gabriel's voice
    photos: Polaroid[]   // the unused pool, reusing the Polaroid shape
  }
}
```

- Chapter 1 (`how-we-met`) gets a second egg: `{ x, y, icon: '🎬',
  message: <one-liner>, video: '/video/day-one.mp4' }`. Coords chosen at
  implementation so it doesn't collide with the existing 🗺️ egg.
- Total secret count is **derived** (`eras.flatMap(e => e.easterEggs).length`),
  never hardcoded, so adding/removing an egg can't desync the counter.
- Egg identity for tracking: `` `${era.id}:${egg.icon}` `` — stable across
  reloads, no coords in the key. (Constraint: no two eggs on the same era may
  share an icon. Holds today; noted in code.)

## Secret tracking

New `src/secrets.tsx` — a `SecretsProvider` context + `useSecrets()` hook:

- State: `found: Set<string>`, `markFound(id)`, `total` (derived), `allFound`.
- Persisted to `localStorage` key `eightyears:secrets` (JSON array — matches
  the gate's existing `eightyears:unlocked` convention). Wrapped in
  try/catch: if storage is unavailable (private mode), fall back to in-memory
  state — the hunt still works within the visit, it just resets on reload.
- `EasterEggButton` calls `markFound(id)` on first open of its popover.
- Provider wraps the app in `App.tsx`; no other component tree changes.

## Counter chip (`src/components/SecretsCounter.tsx`)

- Fixed bottom-right, 44px min target, styled as a sibling of the audio
  button (bottom-left) — same white/95 pill + rose ring language.
- **Hidden until the first egg is found** (pre-hunt it's noise and a spoiler;
  the pulsing egg halos already invite the first tap). After that: "1 / 7
  secrets" in Caveat.
- When `allFound`: chip morphs into a "🔓 open the vault" button with the
  existing `.egg-ping` halo treatment. Stays available for the rest of the
  visit and on return visits (localStorage).
- Reduced motion: no ping/pulse, chip appears without animation.
- z-index sits with the audio player's layer, below lightbox/vault overlays.

## Vault overlay (`src/components/VaultOverlay.tsx`)

Modeled directly on `Lightbox.tsx`: app-level modal, `html` overflow scroll
lock, ESC / tap-outside / X to close, CSS-transition entrance via the same
setTimeout pattern (not rAF — pane-verified approach).

- Cream full-screen layer; header: `content.vault.title` (Fraunces) +
  `content.vault.note` (Caveat).
- Photos as scattered polaroids: white frame + caption + date (reuse the
  polaroid styling from EraSection), each rotated by a **deterministic
  index-based angle** (e.g. `[(i * 7) % 11 - 5]deg` — no `Math.random`, keeps
  renders stable), laid out in a responsive CSS grid, scrollable vertically.
- Tapping a photo opens it in the **existing Lightbox** component above the
  vault (vault photos form their own lightbox deck).
- Component mounts only when opened → its images (`loading="lazy"`) are never
  fetched during normal browsing. Initial-load perf budget untouched.
- Reduced motion: no entrance transition, no scatter rotation (0deg grid).

## Day-one video

**Asset pipeline:** `ffmpeg` re-encode of `photos-raw/photos/V_20180715_113655.mp4`
(1080p, 21s, 11.9MB, h264) → `public/video/day-one.mp4`: 720p, `-crf 26`,
`-movflags +faststart`, audio kept (AAC 96k). Target ≤3MB. Gabriel eyeballs
the re-encode before it ships (same review rule as photo captions).

**Playback (`src/components/VideoOverlay.tsx`):** the 🎬 egg's popover shows
the message plus a "▶ press play" button. Tapping it opens a full-screen
overlay with native `<video controls playsInline preload="none">` — native
controls, no custom player. Close via X / ESC / tap-outside (same modal
conventions as Lightbox/Vault).

**Song coordination:** opening the video dispatches
`window.dispatchEvent(new CustomEvent('pause-song'))`; closing dispatches
`resume-song` **only if the song was playing when the video opened**.
`AudioPlayer` adds listeners for both. No shared state, no context — one
event pair.

## The vault photo pool (~15 unused raws)

Used↔raw mapping is confirmed at implementation by visually comparing raws
against the 22 shipped WebPs (dates below are from filenames; the shortlist
doc `docs/photo-shortlist.md` describes the scenes). Expected pool:

| Raw file | Date | Scene (from shortlist) |
|---|---|---|
| P_20180715_114222 / 114233 | Jul 15 2018 | day-one cuddle-selfie outtakes (×2) |
| P_20180722 (unused one of two) | Jul 22 2018 | travel-wall mural variant |
| LRM_EXPORT…20181125 | Nov 25 2018 | empty road, overcast |
| IMG_20190125 / 20190127 | Jan 2019 | white-wall photoshoot (×2) |
| IMG_20191108 (unused two of three) | Nov 2019 | Bohol extras (×2) |
| IMG_2020071x (unused one of two) | Jul 2020 | Amelia's / lockdown extra |
| IMG_20210101 | Jan 1 2021 | NYE at home |
| IMG_20210227 | Feb 27 2021 | first photo after the lockdown gap |
| IMG_20210522 (unused one of two) | May 2021 | night-market extra |
| IMG_20231008 | Oct 8 2023 | scene identified from the photo at implementation |
| IMG_20240413 | Apr 13 2024 | restaurant date |
| IMG_20250617 | Jun 17 2025 | Fely J's restaurant |

Conversion: same pipeline as the shipped photos (WebP, ≤400KB each, matching
quality settings). Captions drafted by Claude from dates/scenes; **every
caption reviewed by Gabriel before launch** (truthfulness rule — no invented
memories).

## Testing & verification

- `tsc` typecheck clean.
- Browser pane (DOM/computed-style verification; pixel screenshots
  unreliable when the pane renderer sleeps): egg open → counter appears and
  increments; localStorage round-trip after reload; all-found → vault button;
  vault opens, scroll-locks, photos present, Lightbox-on-top works; ESC
  closes in the right order (lightbox first, then vault); video overlay
  mounts with `preload="none"`; pause-song/resume-song events fire.
- Reduced-motion audit of counter, vault, video overlay.
- Perf re-check: initial-load transfer unchanged (vault images unmounted,
  video preload none); largest new image ≤400KB.
- Real-device iPhone Safari pass (Gabriel) now also covers: egg hunt,
  counter tap target, vault scrolling, video playback with `playsInline`.

## Open items (owner: Gabriel)

1. **era6-01 caption** — "the newest member" (Mar 2026): the photo is the
   white-cat selfies, and it's not your cat. Needs the true caption.
2. **Vault captions + title/note** — review Claude's drafts before launch.
3. **Video re-encode approval** — eyeball quality before it ships.
4. **The letter** — still the only placeholder in `content.ts`.
5. All git commits (Gabriel handles git; `photos-raw/` must never be
   committed — video ships only as the re-encoded `public/video/day-one.mp4`).

## Cut order if time runs short

The two features are independent: the vault can ship without the video egg
(6 eggs unlock it), and the video egg can ship without the vault (it's just
egg #7, no counter). The counter and the vault ship together or not at all —
a counter with no payoff is worse than no counter. If time runs short, cut
the vault+counter first, then the video egg, and never touch what already
works.
