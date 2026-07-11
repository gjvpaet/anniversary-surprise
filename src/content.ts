/**
 * ─────────────────────────────────────────────────────────────────
 *  EIGHT YEARS — the only file you need to edit.
 *
 *  Everything personal lives here: her name, the dates, the eras,
 *  the photos, the song, the easter eggs, the letter. The site
 *  renders entirely from this config.
 *
 *  Placeholder content below is believable but fake — replace it
 *  with the real thing before launch (owner checklist, PRD §11).
 * ─────────────────────────────────────────────────────────────────
 */

export interface Polaroid {
  /** Path under /public, e.g. "/photos/era1-01.webp" */
  src: string
  /** Handwritten-style caption under the photo */
  caption: string
  /** Freeform display date, e.g. "Jun 2018" */
  date: string
}

export interface EasterEgg {
  /** Normalized position within the island art, 0–1 from left */
  x: number
  /** Normalized position within the island art, 0–1 from top */
  y: number
  /** Emoji drawn as the tappable detail */
  icon: string
  /** The one-liner only she gets */
  message: string
}

export interface EraArt {
  /** Parallax layers, back to front. One layer is fine (P1 fallback). */
  layers: string[]
}

export interface Era {
  id: string
  chapter: number
  /** Short headline for the era, e.g. "Where it all began." */
  title: string
  /** Year range eyebrow, e.g. "2018–2019" */
  years: string
  /** Owner's 2-line note, in your own words */
  note: string
  art: EraArt
  polaroids: Polaroid[]
  easterEggs: EasterEgg[]
}

export interface Content {
  herName: string
  /** ISO date. Drives the day counter AND is the gate answer. */
  relationshipStart: string
  song: { title: string; artist: string; file: string }
  eras: Era[]
  ninthIsland: { title: string; note: string }
  letter: { greeting: string; body: string[]; signoff: string }
}

export const content: Content = {
  herName: 'My Love', // ← her name as it should appear
  relationshipStart: '2018-07-15', // ← the exact start date (gate answer + counter)

  song: {
    title: 'Our Song',
    artist: 'The Artist',
    file: '/audio/song.mp3', // ← drop the MP3 at public/audio/song.mp3
  },

  eras: [
    {
      id: 'how-we-met',
      chapter: 1,
      title: 'Where it all began.',
      years: '2018–2019',
      note: 'A campus, a coincidence, and one conversation that refused to end. Neither of us wanted to say goodbye first.',
      art: { layers: ['/art/era1.svg'] },
      polaroids: [
        { src: '/photos/placeholder-1.svg', caption: 'first photo ever', date: 'Jul 2018' },
        { src: '/photos/placeholder-2.svg', caption: 'that first coffee', date: 'Aug 2018' },
      ],
      easterEggs: [
        { x: 0.62, y: 0.41, icon: '🧋', message: 'Still your usual order. Some things never change.' },
      ],
    },
    {
      id: 'first-adventures',
      chapter: 2,
      title: 'The first adventures.',
      years: '2019–2020',
      note: 'Weekend trips on a student budget. We got lost more than once and it was never once a problem.',
      art: { layers: ['/art/era2.svg'] },
      polaroids: [
        { src: '/photos/placeholder-3.svg', caption: 'that one trip', date: 'Mar 2019' },
        { src: '/photos/placeholder-4.svg', caption: 'we survived the hike', date: 'Nov 2019' },
      ],
      easterEggs: [
        { x: 0.3, y: 0.55, icon: '🗺️', message: 'The map was upside down for an hour. You knew.' },
      ],
    },
    {
      id: 'the-hard-year',
      chapter: 3,
      title: 'The year we held on.',
      years: '2020–2021',
      note: 'Screens between us, and somehow closer than ever. We learned that distance is just geography.',
      art: { layers: ['/art/era3.svg'] },
      polaroids: [
        { src: '/photos/placeholder-5.svg', caption: 'video call #214', date: 'Jun 2020' },
        { src: '/photos/placeholder-6.svg', caption: 'finally, again', date: 'Apr 2021' },
      ],
      easterEggs: [
        { x: 0.7, y: 0.35, icon: '💻', message: 'You always fell asleep first. I never hung up.' },
      ],
    },
    {
      id: 'building-us',
      chapter: 4,
      title: 'Building something real.',
      years: '2021–2023',
      note: 'First apartment, mismatched furniture, a home. Every small thing we chose, we chose together.',
      art: { layers: ['/art/era4.svg'] },
      polaroids: [
        { src: '/photos/placeholder-7.svg', caption: 'moving day chaos', date: 'Sep 2021' },
        { src: '/photos/placeholder-8.svg', caption: 'our first table', date: 'Jan 2022' },
      ],
      easterEggs: [
        { x: 0.45, y: 0.6, icon: '🪴', message: 'The plant lived. Against all odds. Like us.' },
      ],
    },
    {
      id: 'the-world-together',
      chapter: 5,
      title: 'The world, together.',
      years: '2023–2025',
      note: 'Passports filling up, a list of places that keeps growing. My favorite view is still you looking at the view.',
      art: { layers: ['/art/era5.svg'] },
      polaroids: [
        { src: '/photos/placeholder-9.svg', caption: 'sunset no. 47', date: 'May 2024' },
        { src: '/photos/placeholder-10.svg', caption: 'you, mid-laugh', date: 'Oct 2024' },
      ],
      easterEggs: [
        { x: 0.55, y: 0.3, icon: '✈️', message: 'Window seat is yours. Forever. I accepted this.' },
      ],
    },
    {
      id: 'now',
      chapter: 6,
      title: 'Eight years of us.',
      years: '2025–today',
      note: 'Not the finish line — just the best view so far. Every day still feels like the good part.',
      art: { layers: ['/art/era6.svg'] },
      polaroids: [
        { src: '/photos/placeholder-11.svg', caption: 'last week', date: 'Jul 2026' },
        { src: '/photos/placeholder-12.svg', caption: 'us, always', date: 'Jul 2026' },
      ],
      easterEggs: [
        { x: 0.5, y: 0.45, icon: '💍', message: 'This island has room for more buildings…' },
      ],
    },
  ],

  ninthIsland: {
    title: 'Year 9 — under construction',
    note: 'Still drawing the blueprints. All of them have you in them.',
  },

  letter: {
    greeting: 'My dearest,',
    body: [
      'Eight years ago today, I had no idea that one ordinary moment was about to become the most important one of my life.',
      'Every island you just scrolled through, we built together. The easy years, the hard year, the ones that flew by too fast — I would live every single one of them again, exactly as they were, as long as they were with you.',
      'Here is to year nine, and to every island we have not built yet.',
    ],
    signoff: '— with all my love, always',
  },
}

/* ── Derived helpers ─────────────────────────────────────────── */

/** Whole days together, computed in the device's local timezone. */
export function daysTogether(now: Date = new Date()): number {
  const [y, m, d] = content.relationshipStart.split('-').map(Number)
  const start = new Date(y, m - 1, d) // local midnight of start date
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today.getTime() - start.getTime()) / 86_400_000)
}

/** Full years together (anniversary-aware). */
export function yearsTogether(now: Date = new Date()): number {
  const [y, m, d] = content.relationshipStart.split('-').map(Number)
  let years = now.getFullYear() - y
  const beforeAnniversary =
    now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)
  if (beforeAnniversary) years -= 1
  return years
}
