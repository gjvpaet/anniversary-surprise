# Island art — Midjourney prompts (grounded in the real story)

Rewritten after the Google Photos scan (Jul 11, 2026). Every island now depicts
your actual era — the diner dates, the Bohol trip, the lockdown bakery, the
summit hike — rendered as cute miniature dioramas, not literal photos.

## Workflow

1. Generate **era 1 first**. Re-roll until the style feels right.
2. Use that accepted image as a **style reference (`--sref <image URL>`)** on
   every other island so the whole world stays consistent.
3. Upscale, export at ≥ 2048px, convert to WebP ≤ 400 KB each, drop into
   `public/art/` as `era1.webp` … `era6.webp`, `ninth.webp`, then change the
   `.svg` paths in `src/content.ts` to `.webp`.
4. Keep the focal point in the **center third** — phones crop the sides
   (test target 390×844).

## Prompt structure (order matters!)

Midjourney requires parameters LAST. Build every prompt as:

```
<base style>, <scene line> --ar 4:3
```

`--ar` must be typed with two plain hyphens (`--`), not a long dash — word
processors sometimes auto-convert `--` into `–`, which throws
"Aspect ratio should be of the format width:height".

## Base style prompt (start every island with this)

> Cute miniature isometric diorama island floating on a soft cream background,
> 3D render style, soft pastel color palette, rounded toy-like forms, warm
> gentle afternoon light, subtle ambient occlusion shadows, clay and felt
> textures, whimsical and cozy, high detail, clean composition, single island
> centered, no people, no text

## Scene lines (add after the base, then end with ` --ar 4:3`)

**era1 — Where it all began (2018–2019)**
> a tiny cozy diner corner with two cups of milk tea on a table for two, a wall
> of miniature vintage travel posters (Tokyo, Dubai, London), a glowing archway
> of star-shaped fairy lights, a small empty road with a dashed center line
> winding across the island at dusk

*(the first dates at the diner, the travel-mural date that foreshadowed everything,
the star-arch photoshoot, the empty-road portraits)*

**era2 — The first adventures (2019–2020)**
> a lush tropical island with a cluster of round chocolate-brown grassy hills,
> a tiny wooden river boat cruising a winding jungle river, a small sushi
> platter picnic set out on a deck, polaroid photographs strung on a line
> between two palm trees

*(Bohol: Chocolate Hills + the Loboc river cruise, the Genki Sushi first-anniversary
dinner, the polaroid prints from Oct 2019)*

**era3 — The year the world closed (2020–2021)**
> a single cozy little house glowing warmly from inside, an electric piano
> keyboard visible through the open window, a tiny pastel bakery stand out
> front with trays of yellow desserts and a small red-and-white sign, a
> delivery scooter with a paper bag parcel, a fluffy white puppy sitting on
> the porch step

*(the lockdown keyboard duet, Amelia's — your mango graham & cheesy puto delivery
business, the riders, and Bella the puppy; the world got small, the house got warm)*

**era4 — Finding our normal (2022–2023)**
> a pastel city-corner island: a miniature cinema with a glowing marquee, a
> donut shop with a giant donut sign on the roof, a tiny photo booth with a
> strip of photos hanging out of it, a festive corner with a red bench, a
> decorated Christmas tree, and a small white dog wearing a santa hat

*(the movie dates coming back, Randy's Donuts, the photo-booth strips, the mall
Christmas bench, and Bella in her santa suit at the gift exchange)*

**era5 — Out in the world (2024–2025)**
> a turquoise lake island with a small bamboo raft and two colorful kayaks at
> a wooden dock, a lakeside brunch cafe table set for two with a fluffy white
> dog beside it, a golden-hour park path with glowing lampposts and trees

*(the kayak day on the lake, the matching-shirts brunch with Bella, the
golden-hour park walks)*

**era6 — Eight years of us (2025–today)**
> a mountain summit island at golden hour, a winding hiking trail leading to
> the peak with two tiny backpacks resting at the top, the summit overlooking
> a valley of tiny distant islands below, a cozy garden porch on the hillside
> with a white cat and a white dog dozing under string lights

*(the summit selfie with the valley behind you — looking back at every island
you've built, with the whole little family at home)*

**ninth — Year 9, under construction**
> a half-built island with wooden scaffolding, a tiny pastel crane, rolled
> blueprint scrolls, dotted chalk outlines of unfinished buildings, a string
> of warm fairy lights extending from the finished edge into the open space,
> slightly translucent sketch-like style on the unbuilt half

*(the future: still drawing the blueprints, all of them with her in them)*

## Optional parallax layers (P1 — skip if time runs short)

For each island, either generate bg/mid/fg as separate images with plain
backgrounds, or mask the single image into 2–3 layers in any editor. Name them
`era1-bg.webp`, `era1-mid.webp`, `era1-fg.webp` and list all three (back to
front) in the era's `art.layers` array. A single layer per island is a fully
supported fallback.

## Recurring motif (optional but recommended)

Bella (the white dog) can appear on every island from era 3 onward — puppy on
the porch (era 3), santa hat (era 4), beside the cafe table (era 5), dozing
with the cat (era 6). She becomes a visual thread her owner will spot on the
second scroll — and pairs with the easter-egg system in `content.ts`.
