# Vault Photo Expansion (15 → 52) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all 37 photos from `~/Downloads/gandj-photos/` to the unlockable vault gallery as `vault-16..52.webp`, captioned and sorted into one chronology with the existing 15.

**Architecture:** Pure content addition. Convert the jpgs to webp matching the existing vault recipe, visually inspect every converted image (rotation / duplicates / caption drafting), then rewrite the `vault.photos` array in `src/content.ts` to 52 chronologically-ordered entries. No component changes — the grid lazy-loads and the Lightbox is array-driven.

**Tech Stack:** `sips` + `cwebp` (already installed at `/opt/homebrew/bin/cwebp`) for conversion; TypeScript data edit only; vitest/tsc/oxlint/vite gates unchanged.

**Spec:** `docs/superpowers/specs/2026-07-13-vault-photo-expansion-design.md`

---

## PROJECT RULES (apply to every task)

1. **Never run `git add` / `git commit` / `git push`.** Gabriel makes every commit himself. For git *reads* use `GIT_CONFIG_GLOBAL=/dev/null` (his global config has a broken `gpg.format`).
2. **Never touch `photos-raw/`.** Source photos are read in place from `~/Downloads/gandj-photos/`.
3. **All user-facing copy is subject to Gabriel's review** — captions drafted here are proposals until he approves them (Task 5 gate).
4. **Dev server only via the Browser pane** (`preview_start` with launch config `anniversary-dev`), never Bash.
5. **Gates before done:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run build` — all from the project root `~/Documents/Personal/anniversary-surprise`.
6. Do not modify the video `V_20180811_193426.mp4`, the existing `vault-01..15.webp`, `VaultOverlay.tsx`, `Lightbox.tsx`, or anything outside the files each task names.

---

## Filename → vault number mapping (chronological within the new set)

This table is authoritative. Dates come from filenames (`FB_IMG` epoch 1545023186 = Dec 17 2018; the screenshot's filename = Oct 11 2021).

| # | Source file | Date |
|----|-------------------------------|--------------|
| 16 | P_20180515_174311_1_BF_p.jpg | May 15, 2018 |
| 17 | P_20180614_233815_1_BF_p.jpg | Jun 14, 2018 |
| 18 | P_20180614_233907_1_BF_p.jpg | Jun 14, 2018 |
| 19 | P_20180614_233929_1_BF_p.jpg | Jun 14, 2018 |
| 20 | P_20180617_005003_1_BF_p.jpg | Jun 17, 2018 |
| 21 | P_20180617_184548_1_BF_p.jpg | Jun 17, 2018 |
| 22 | P_20180729_211123_1_BF_p.jpg | Jul 29, 2018 |
| 23 | P_20180804_130018.jpg | Aug 4, 2018 |
| 24 | P_20180804_144911_1_BF_p.jpg | Aug 4, 2018 |
| 25 | P_20180916_200939_1_BF_p.jpg | Sep 16, 2018 |
| 26 | P_20180928_214045.jpg | Sep 28, 2018 |
| 27 | IMG_20181112_222316.jpg | Nov 12, 2018 |
| 28 | IMG_20181207_201346.jpg | Dec 7, 2018 |
| 29 | FB_IMG_1545023186786.jpg | Dec 17, 2018 |
| 30 | IMG_20190113_234641_756.jpg | Jan 13, 2019 |
| 31 | IMG_20190418_170255_681.jpg | Apr 18, 2019 |
| 32 | IMG_20190418_170259_451.jpg | Apr 18, 2019 |
| 33 | IMG_20190526_213127_750.jpg | May 26, 2019 |
| 34 | IMG_20190714_173556.jpg | Jul 14, 2019 |
| 35 | IMG_20191108_110749.jpg | Nov 8, 2019 |
| 36 | IMG_20191108_153055.jpg | Nov 8, 2019 |
| 37 | IMG_20191109_153446.jpg | Nov 9, 2019 |
| 38 | IMG_20191130_190120_928.jpg | Nov 30, 2019 |
| 39 | IMG_20200101_000417.jpg | Jan 1, 2020 |
| 40 | IMG_20210418_151848.jpg | Apr 18, 2021 |
| 41 | Screenshot_20211011-103936__01.jpg | Oct 11, 2021 |
| 42 | IMG_20211107_184115.jpg | Nov 7, 2021 |
| 43 | IMG_20220605_204125_826.jpg | Jun 5, 2022 |
| 44 | IMG_20221008_182128.jpg | Oct 8, 2022 |
| 45 | IMG_20221204_144026.jpg | Dec 4, 2022 |
| 46 | IMG_20221204_172434.jpg | Dec 4, 2022 |
| 47 | IMG_20221231_205501.jpg | Dec 31, 2022 |
| 48 | IMG_20230409_141435.jpg | Apr 9, 2023 |
| 49 | IMG_20231031_182432.jpg | Oct 31, 2023 |
| 50 | IMG_20231225_142714.jpg | Dec 25, 2023 |
| 51 | IMG_20240113_214711.jpg | Jan 13, 2024 |
| 52 | IMG_20241229_024456_383.jpg | Dec 29, 2024 |

## Merged display order for `content.ts` (all 52)

Rule applied: sort by date ascending; existing month-precision entries (e.g. `'Nov 2018'`) come **before** day-dated new entries of the same month; same-day entries keep filename-time order. Result (authoritative):

```
16, 17, 18, 19, 20, 21,          ← May–Jun 2018 (before day one)
01, 02, 03,                      ← Jul 15 + Jul 2018 (existing)
22, 23, 24, 25, 26,              ← Jul 29–Sep 2018
04, 27, 28, 29,                  ← Nov–Dec 2018
05, 06, 30,                      ← Jan 2019
31, 32, 33, 34,                  ← Apr–Jul 2019
07, 08, 35, 36, 37, 38,          ← Nov 2019
39,                              ← Jan 1 2020
09,                              ← Jul 2020
10, 11,                          ← Jan–Feb 2021
40,                              ← Apr 2021
12,                              ← May 2021
41, 42,                          ← Oct–Nov 2021
43, 44, 45, 46, 47,              ← 2022
48, 13, 49, 50,                  ← 2023
51, 14,                          ← Jan–Apr 2024
52,                              ← Dec 2024
15                               ← Jun 2025
```

(15 existing + 37 new = 52 entries.)

---

### Task 1: Convert the 37 jpgs to webp

**Files:**
- Create: `public/photos/vault-16.webp` … `public/photos/vault-52.webp` (37 files)
- Read-only source: `~/Downloads/gandj-photos/*.jpg`

- [ ] **Step 1: Write the conversion script to the scratchpad and run it**

The script encodes the authoritative mapping table above. Longest edge caps at 1600 px, never upscales (8 sources are already smaller), quality 78 to match `vault-01..15`.

```bash
#!/bin/bash
set -euo pipefail
SRC="$HOME/Downloads/gandj-photos"
DST="$HOME/Documents/Personal/anniversary-surprise/public/photos"
TMP="$(mktemp -d)"

# "NN|source-filename" pairs — the plan's mapping table, verbatim
PAIRS='
16|P_20180515_174311_1_BF_p.jpg
17|P_20180614_233815_1_BF_p.jpg
18|P_20180614_233907_1_BF_p.jpg
19|P_20180614_233929_1_BF_p.jpg
20|P_20180617_005003_1_BF_p.jpg
21|P_20180617_184548_1_BF_p.jpg
22|P_20180729_211123_1_BF_p.jpg
23|P_20180804_130018.jpg
24|P_20180804_144911_1_BF_p.jpg
25|P_20180916_200939_1_BF_p.jpg
26|P_20180928_214045.jpg
27|IMG_20181112_222316.jpg
28|IMG_20181207_201346.jpg
29|FB_IMG_1545023186786.jpg
30|IMG_20190113_234641_756.jpg
31|IMG_20190418_170255_681.jpg
32|IMG_20190418_170259_451.jpg
33|IMG_20190526_213127_750.jpg
34|IMG_20190714_173556.jpg
35|IMG_20191108_110749.jpg
36|IMG_20191108_153055.jpg
37|IMG_20191109_153446.jpg
38|IMG_20191130_190120_928.jpg
39|IMG_20200101_000417.jpg
40|IMG_20210418_151848.jpg
41|Screenshot_20211011-103936__01.jpg
42|IMG_20211107_184115.jpg
43|IMG_20220605_204125_826.jpg
44|IMG_20221008_182128.jpg
45|IMG_20221204_144026.jpg
46|IMG_20221204_172434.jpg
47|IMG_20221231_205501.jpg
48|IMG_20230409_141435.jpg
49|IMG_20231031_182432.jpg
50|IMG_20231225_142714.jpg
51|IMG_20240113_214711.jpg
52|IMG_20241229_024456_383.jpg
'

echo "$PAIRS" | while IFS='|' read -r NN F; do
  [ -z "$NN" ] && continue
  IN="$SRC/$F"
  MID="$TMP/$NN.jpg"
  W=$(sips -g pixelWidth  "$IN" | awk '/pixelWidth/{print $2}')
  H=$(sips -g pixelHeight "$IN" | awk '/pixelHeight/{print $2}')
  LONG=$(( W > H ? W : H ))
  if [ "$LONG" -gt 1600 ]; then
    sips --resampleHeightWidthMax 1600 "$IN" --out "$MID" >/dev/null
  else
    cp "$IN" "$MID"   # never upscale
  fi
  cwebp -quiet -q 78 "$MID" -o "$DST/vault-$NN.webp"
  echo "vault-$NN.webp <- $F (${W}x${H})"
done
rm -rf "$TMP"
```

Save as `<scratchpad>/convert-vault.sh`, `chmod +x`, run. Expected: 37 lines of `vault-NN.webp <- …`, no errors. If any single file fails, report it — do not skip silently.

- [ ] **Step 2: Verify count, sizes, and dimensions**

```bash
cd ~/Documents/Personal/anniversary-surprise
ls public/photos/vault-*.webp | wc -l                    # expect 52
for f in public/photos/vault-{16..52}.webp; do
  s=$(stat -f%z "$f"); [ "$s" -gt 409600 ] && echo "OVER 400KB: $f ($s)"
done; echo "size check done"
sips -g pixelWidth -g pixelHeight public/photos/vault-16.webp public/photos/vault-52.webp
```

Expected: 52 files; no `OVER 400KB` lines (if one appears, re-encode just that file at `-q 70`, then `-q 60` if still over); spot-checked dims have longest edge ≤ 1600.

- [ ] **Step 3: Report DONE** with the 37-line conversion log and total added bytes (`du -ch public/photos/vault-{16..52}.webp | tail -1`).

**Suggested commit (Gabriel runs it):** none yet — assets commit together with content.ts after the caption review gate.

---

### Task 2: Visual pass — rotation, duplicates, caption worksheet

**Files:**
- Create: `docs/superpowers/plans/2026-07-13-vault-captions-worksheet.md`
- Possibly re-create: any sideways `public/photos/vault-NN.webp` (rotate + re-encode)
- Read-only: `public/photos/vault-01..15.webp`, `public/photos/era*.webp`, `src/content.ts`

This task needs vision: use the Read tool on each image file. It produces the worksheet that Task 3 consumes and Task 5 shows Gabriel.

- [ ] **Step 1: Read all 37 new webps** (`public/photos/vault-16.webp` … `vault-52.webp`), plus the 15 existing vault webps and the 22 `era*.webp` files for duplicate comparison.

- [ ] **Step 2: Fix rotation.** For each image whose content is visibly sideways or upside down (faces/horizon rotated — none of the sources carry EXIF orientation), rotate the *source* and re-encode that one file, e.g. for vault-23 needing 90° clockwise:

```bash
TMP=$(mktemp -d)
sips --rotate 90 ~/Downloads/gandj-photos/P_20180804_130018.jpg --out "$TMP/r.jpg" >/dev/null
W=$(sips -g pixelWidth "$TMP/r.jpg" | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$TMP/r.jpg" | awk '/pixelHeight/{print $2}')
LONG=$(( W > H ? W : H ))
if [ "$LONG" -gt 1600 ]; then sips --resampleHeightWidthMax 1600 "$TMP/r.jpg" --out "$TMP/r2.jpg" >/dev/null; else cp "$TMP/r.jpg" "$TMP/r2.jpg"; fi
cwebp -quiet -q 78 "$TMP/r2.jpg" -o ~/Documents/Personal/anniversary-surprise/public/photos/vault-23.webp
rm -rf "$TMP"
```

(`sips --rotate` writes to `--out`; the original in Downloads is never modified in place — verify with `ls -la` that the source's mtime is unchanged.)
Re-Read each fixed webp to confirm it is now upright.

- [ ] **Step 3: Write the worksheet** at `docs/superpowers/plans/2026-07-13-vault-captions-worksheet.md`, one row per new photo, exactly this format:

```markdown
# Vault caption worksheet — Gabriel reviews before ship

| vault # | Source file | Date field | Draft caption | Flags / questions |
|---------|-------------|------------|---------------|-------------------|
| 16 | P_20180515_174311_1_BF_p.jpg | 'May 2018' | <draft> | before day one |
| ... all 37 rows ... |
```

Caption rules (from the spec):
- Short, lowercase, handwritten voice matching the existing 15 ("a kiss on the cheek", "crewmates", "tempura for two").
- Grounded ONLY in what is visible in the photo + the date. Never invent places, events, or names. If a caption would need a guess ("looks like a graduation?"), write a neutral caption and put the guess in the Flags column as a question for Gabriel.
- The six before-day-one photos (16–21) get captions that own it (e.g. riffs on "before we were us") — final wording is Gabriel's call.
- Date field format: `'MMM YYYY'` (e.g. `'Nov 2019'`) normally; full `'MMM D, YYYY'` only for signature days (Jan 1, Dec 25, Dec 31 are fine as full dates if the photo is clearly that occasion).
- Duplicate check: if a new photo shows the same shot as any existing island/vault photo (candidate: vault-37, Nov 9 2019 Bohol, vs vault-07/08), note `possible duplicate of <file>` in Flags. Do not drop anything.

- [ ] **Step 4: Report DONE** with: number of rotations fixed (and which), duplicate flags found, and the worksheet path.

---

### Task 3: content.ts — the 52-entry chronological array

**Files:**
- Modify: `src/content.ts:187-207` (the `vault` object only)
- Read: `docs/superpowers/plans/2026-07-13-vault-captions-worksheet.md`

- [ ] **Step 1: Rewrite `vault.photos`.** Keep `title` and `note` unchanged. Replace the 15-entry array with all 52 entries in the plan's **Merged display order** (see top of plan). Existing 15 entries are copied verbatim (same src/caption/date). New entries take caption + date from the worksheet. Add the ordering comment. Shape:

```ts
  vault: {
    title: 'The outtakes',
    note: 'Every photo that didn\'t fit on an island — yours now, because you looked closer.',
    // array order = display order = chronological (filenames are not sequential)
    photos: [
      { src: '/photos/vault-16.webp', caption: '<from worksheet>', date: 'May 2018' },
      { src: '/photos/vault-17.webp', caption: '<from worksheet>', date: 'Jun 2018' },
      // … per the Merged display order: 18, 19, 20, 21, then existing 01, 02, 03, then 22 …
      { src: '/photos/vault-15.webp', caption: 'the whole crew, plus Bella', date: 'Jun 2025' },
    ],
  },
```

Every `caption` is the worksheet's exact draft text (they ship only after Gabriel's Task 5 review; his edits land as a follow-up edit to this same array). Escape any apostrophes (`\'`) — the file uses single-quoted strings.

- [ ] **Step 2: Verify entry count and order**

```bash
cd ~/Documents/Personal/anniversary-surprise
grep -c "photos/vault-" src/content.ts        # expect 52
grep -o "vault-[0-9]*" src/content.ts | head -8
```

Expected: 52; first entries read `vault-16, vault-17, vault-18, vault-19, vault-20, vault-21, vault-01, vault-02`.

- [ ] **Step 3: Run the gates**

```bash
npm test && npx tsc -b && npm run lint && npm run build
```

Expected: 20/20 tests pass, tsc silent, lint clean, build succeeds; `ls dist/photos/vault-*.webp | wc -l` prints 52.

- [ ] **Step 4: Report DONE** with gate output summary.

**Suggested commit (Gabriel runs it, after Task 5 approval):** `Grow the vault to 52 outtakes`

---

### Task 4: Browser verification sweep

**Files:** none modified. Dev server via Browser pane launch config `anniversary-dev` (never Bash).

- [ ] **Step 1:** Start/reuse the preview. If storage is fresh, unlock the gate (type `july 15 2018`, tap "Come in"). Set `localStorage['eightyears:secrets']` to all 7 egg ids via the console if hunting all eggs manually is impractical, then reload — the counter chip should read "open the vault". (Egg ids: read them from `src/content.ts` `eggs` entries at sweep time.)
- [ ] **Step 2:** Open the vault. Verify: 52 thumbnails render (count `button` elements in the grid via `read_page` or `javascript_tool`); captions render under each; no broken-image icons (assert `document.querySelectorAll('img')` all have `naturalWidth > 0` once scrolled through — lazy loading means scroll the overlay to the bottom first).
- [ ] **Step 3:** Lightbox: open the first photo (vault-16), arrow through at least the first 8 (order must be 16→17→18→19→20→21→01→02), ESC closes lightbox then vault.
- [ ] **Step 4:** Perf: reload with the vault closed; `read_network_requests` shows **zero** `/photos/vault-` fetches before the vault opens.
- [ ] **Step 5:** No console errors (`read_console_messages` onlyErrors).
- [ ] **Step 6:** Report DONE with evidence (counts, order proof, network proof).

---

### Task 5: Caption review gate (controller + Gabriel — not a subagent task)

- [ ] **Step 1:** Present the worksheet to Gabriel in chat: all 37 rows (vault #, date, draft caption, flags/questions), plus any duplicate flags and rotation notes.
- [ ] **Step 2:** Apply his edits to `src/content.ts` (and re-run `npx tsc -b` + `npm test` after edits).
- [ ] **Step 3:** Only after his approval, suggest the commit: `Grow the vault to 52 outtakes` (37 webps + content.ts + spec + plan + worksheet).

---

## Self-review notes

- Spec coverage: conversion recipe → T1; rotation/duplicate/caption pass → T2; content.ts chronology → T3; testing section → T3 gates + T4 sweep; review gate → T5; error handling (failed conversion reported, oversize re-encode, uncertain captions as questions) → embedded in T1/T2.
- The merged display order and mapping table were computed from filename dates at plan time; T2/T3 must not re-derive them.
- No TDD tasks: this is a data/content change; the existing 20-test suite plus build gates are the regression net (content.ts is type-checked data).
