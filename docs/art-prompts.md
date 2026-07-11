# Island art — generation prompts

Generate one image per island (Midjourney, DALL·E, or any image model). Use the
**base style prompt verbatim** on every island so the whole world stays consistent,
then append the scene line. Export at ≥ 2048px, convert to WebP ≤ 400 KB, and drop
into `public/art/` as `era1.webp` … `era6.webp`, `ninth.webp` (then update the
paths in `src/content.ts` from `.svg` to `.webp`).

Compose with the focal point in the **center third** — phones crop the sides
(test target 390×844).

## Base style prompt (use on every island)

> Cute miniature isometric diorama island floating on a soft cream background,
> 3D render style, soft pastel color palette, rounded toy-like forms, warm
> gentle afternoon light, subtle ambient occlusion shadows, clay and felt
> textures, whimsical and cozy, high detail, clean composition, single island
> centered, no text, no people's faces

## Scene lines (append one per generation)

1. **era1 — Where it all began (2018–2019):** a small pastel school campus with a
   tiny café corner, two bicycles leaning together, a bubble-tea stand, cherry
   blossom tree
2. **era2 — The first adventures (2019–2020):** a miniature mountain trail with a
   tiny tent, backpacks, a winding path with a signpost, tiny car parked at the base
3. **era3 — The year we held on (2020–2021):** two cozy little houses on opposite
   ends of the island connected by a string of fairy lights, a laptop glowing in
   each window, a mailbox with letters
4. **era4 — Building something real (2021–2023):** a charming small apartment
   building with moving boxes, a sofa on the lawn, potted plants, warm lit windows
5. **era5 — The world, together (2023–2025):** a tiny airport island with a pastel
   plane, suitcases, landmarks in miniature (torii gate, lighthouse), a camera on
   a tripod
6. **era6 — Eight years of us (2025–today):** a cozy home island with a garden,
   a porch swing for two, string lights, a small dog/cat, flower beds in bloom
7. **ninth — Year 9, under construction:** a half-built island with scaffolding, a
   tiny crane, blueprint scrolls, dotted outline of unfinished buildings, a
   "coming soon" vibe — slightly translucent/sketchy on the unbuilt half

## Optional parallax layers (P1 — skip if time runs short)

For each island, either generate bg/mid/fg as separate images with plain
backgrounds, or mask the single image into 2–3 layers in any editor. Name them
`era1-bg.webp`, `era1-mid.webp`, `era1-fg.webp` and list all three (back to
front) in the era's `art.layers` array. A single layer per island is a fully
supported fallback.
