# Vault Photo Expansion (15 → 52 outtakes) — Design

**Date:** 2026-07-13
**Project:** anniversary-surprise (8th-anniversary scroll world, launches 2026-07-15)

## Goal

Add all 37 photos from `~/Downloads/gandj-photos/` to the unlockable vault
gallery, growing it from 15 to 52 outtakes. Pure content addition: the
vault grid and Lightbox already scale (lazy-loaded thumbnails, array-driven
navigation), so **no component changes**.

## Decisions (from brainstorming)

- **Scope: all 37 photos.** Near-duplicate bursts (e.g. three shots from
  the evening of Jun 14 2018, two from Apr 18 2019) stay — the vault is
  "every photo that didn't fit on an island," so abundance is on-theme.
  The phone screenshot from Oct 2021 is included too.
- **The video `V_20180811_193426.mp4` is skipped entirely.** The vault is
  a photo gallery and the day-one video already owns the hidden-video
  moment. Adding a second video player two days before launch is a scope
  change, deliberately not taken. The file simply stays in Downloads.
- **Captions: Claude drafts, Gabriel reviews.** Same flow as the original
  15. Nothing ships until he approves the full caption list (truthfulness
  rule: all user-facing copy is his call).
- **Ordering: one chronology.** The `vault.photos` array becomes all 52
  entries sorted by date, new interleaved with old. Rejected: appending
  the new 37 after the existing 15 (a second 2018 starting after Jun 2025
  reads as a bug). Rejected: year-grouping / "load more" UI (YAGNI —
  `loading="lazy"` already handles the weight).

## Source material

37 jpgs in `~/Downloads/gandj-photos/` (read in place — `photos-raw/` is
not touched). Dates come from filenames:

- `IMG_YYYYMMDD_*` / `P_YYYYMMDD_*` → shoot date.
- `FB_IMG_1545023186786.jpg` → epoch 1545023186 = **Dec 17, 2018**.
- `Screenshot_20211011-*.jpg` → **Oct 11, 2021**.

Six photos predate day one (Jul 15, 2018): `P_20180515_*`, three
`P_20180614_*`, two `P_20180617_*`. They're included deliberately; their
captions own it ("before we were us"-flavored — final wording subject to
Gabriel's review like everything else).

**No EXIF orientation tags exist on any file** (same as the previous
batch), so some images may be stored sideways. Every converted image gets
a visual inspection; wrong ones are rotated manually.

## Conversion

Match the existing 15 (`vault-01..15.webp`, 1600 px longest edge,
~80–260 KB each):

- Resize so the longest edge is 1600 px (never upscale — eight source
  files are already under 1600 px on their longest edge; those convert
  at native size).
- Encode with `cwebp -q 78`; if any output exceeds the project's 400 KB
  image cap, re-encode that file at a lower quality until it fits.
- Name `public/photos/vault-16.webp` … `vault-52.webp`, numbered
  chronologically **within the new set** (the existing 15 keep their
  names; display order comes from the array, not the filename).
- Total added weight ≈ 5–6 MB in `public/photos/` — fetched only when
  the vault opens, so initial page load is unchanged.

## Rotation + caption + duplicate pass

Every converted webp is looked at (Read as image), in one pass per photo:

1. **Rotation check** — sideways images get rotated and re-encoded.
2. **Duplicate check** — any photo that's already on an island or in the
   vault (candidate: a Nov 2019 Bohol shot vs. vault-07/08) is **flagged
   in the review list, not silently dropped or duplicated** — Gabriel
   decides keep/drop.
3. **Caption draft** — short, lowercase, handwritten voice matching the
   existing vault ("a kiss on the cheek", "crewmates"), grounded only in
   what's visibly in the photo plus the filename date. No invented
   specifics (places, events, names) that the photo doesn't show — those
   are offered as questions in the review list instead.
   Date field format matches existing entries: `'Nov 2019'` normally,
   `'Jul 15, 2018'`-style full dates for signature days.

## content.ts

`vault.photos` grows to 52 entries, sorted by date ascending (stable:
same-day photos keep filename order). A one-line comment above the array
notes that array order = display order = chronological. `vault.title` and
`vault.note` are unchanged. **No other file changes.**

## Review gate

Before the work is called done, Gabriel gets the full review list: for
each new photo — filename, date, drafted caption, and any duplicate flags
or uncertain guesses. He approves or rewords; edits land in `content.ts`;
only then is the feature complete. (He also makes every commit himself,
as always.)

## Error handling

- A source file that fails to convert → reported, not skipped silently.
- Caption uncertainty → surfaced as a question in the review list, never
  guessed confidently.
- Oversized output → re-encoded at lower quality (see Conversion).

## Testing

- **Gates:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run build`
  (content.ts is data — the existing 20 tests still pass untouched).
- **Browser sweep:** unlock the vault → 52 thumbnails render; Lightbox
  arrows walk the full 52; ESC layering still works; initial page load
  fetches **zero** `/photos/vault-*` bytes; largest new file ≤ 400 KB;
  no console errors.
- **dist check:** `npm run build` output contains all 52 vault webps.

## Out of scope

- The Aug 2018 video (stays in Downloads, untouched).
- Any component, layout, or pagination change (VaultOverlay, Lightbox).
- Renaming or re-encoding the existing vault-01..15.
- Touching `photos-raw/`, secrets logic, localStorage, or the celebration.
