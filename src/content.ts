/**
 * ─────────────────────────────────────────────────────────────────
 *  EIGHT YEARS — the only file you need to edit.
 *
 *  Everything personal lives here: her name, the dates, the eras,
 *  the photos, the song, the easter eggs, the letter. The site
 *  renders entirely from this config.
 *
 *  Era stories, photos, captions, name, and song are all real.
 *  Still placeholder: the letter — replace before launch
 *  (owner checklist, PRD §11).
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
  /** Optional: a video this egg offers to play (fullscreen overlay) */
  video?: string
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
  /** Bonus gallery unlocked by finding every easter egg. */
  vault: { title: string; note: string; photos: Polaroid[] }
  letter: { greeting: string; body: string[]; signoff: string }
}

export const content: Content = {
  herName: 'Derv', // what he calls her — shown in the welcome greeting
  relationshipStart: '2018-07-15', // confirmed — gate answer + day counter

  song: {
    title: 'Weak',
    artist: 'Michael Pangilinan',
    file: '/audio/song.mp3',
  },

  eras: [
    {
      id: 'how-we-met',
      chapter: 1,
      title: 'Where it all began.',
      years: '2018',
      note: 'Dinner dates, a wall of travel posters, and a July 15 that changed everything. We stood in front of the whole world and promised to see it together.',
      art: { layers: ['/art/era1.webp'] },
      polaroids: [
        { src: '/photos/era1-01.webp', caption: 'day one', date: 'Jul 15, 2018' },
        { src: '/photos/era1-02.webp', caption: 'our first dinner date', date: 'Jun 2018' },
        { src: '/photos/era1-03.webp', caption: 'dreaming up our someday list', date: 'Jul 2018' },
        { src: '/photos/era1-04.webp', caption: 'under a sky of stars', date: 'Nov 2018' },
      ],
      easterEggs: [
        { x: 0.62, y: 0.41, icon: '🗺️', message: 'Tokyo. Dubai. London. We pointed at a wall of posters — someday, we\'ll see every one of them.' },
        { x: 0.35, y: 0.55, icon: '🎬', message: 'July 15, 2018. Twenty-one seconds of the actual day one.', video: '/video/day-one.mp4' },
      ],
    },
    {
      id: 'first-adventures',
      chapter: 2,
      title: 'The first adventures.',
      years: '2019',
      note: 'Our first anniversary over sushi, our first photos on real film, our first trip together. Bohol was proof: when we say we will go, we go.',
      art: { layers: ['/art/era2.webp'] },
      polaroids: [
        { src: '/photos/era2-01.webp', caption: 'laughing into the new year', date: 'Jan 1, 2019' },
        { src: '/photos/era2-02.webp', caption: 'anniversary no. 1', date: 'Jul 2019' },
        { src: '/photos/era2-03.webp', caption: 'our first instax', date: 'Oct 2019' },
        { src: '/photos/era2-04.webp', caption: 'Bohol, finally', date: 'Nov 2019' },
      ],
      easterEggs: [
        { x: 0.3, y: 0.55, icon: '🍣', message: 'Sushi on July 14, 2019. A one-day-early anniversary tradition was born.' },
      ],
    },
    {
      id: 'the-world-closed',
      chapter: 3,
      title: 'The year the world closed.',
      years: '2020–2021',
      note: 'So we built our own little world instead — sushi anniversaries at home, a food business from scratch, and a puppy named Bella.',
      art: { layers: ['/art/era3.webp'] },
      polaroids: [
        { src: '/photos/era3-01.webp', caption: 'we started a bakery??', date: 'Jul 2020' },
        { src: '/photos/era3-02.webp', caption: 'anniversary, home edition', date: 'Jul 2020' },
        { src: '/photos/era3-03.webp', caption: 'date night, pandemic style', date: 'May 2021' },
        { src: '/photos/era3-04.webp', caption: 'the world, reopening', date: 'Dec 2021' },
      ],
      easterEggs: [
        { x: 0.7, y: 0.35, icon: '🧁', message: "Amelia's, est. 2020. Mango graham, cheesy puto, and the best business partner I'll ever have." },
      ],
    },
    {
      id: 'finding-our-normal',
      chapter: 4,
      title: 'Finding our normal.',
      years: '2022–2023',
      note: 'Movie dates came back. So did donut runs, photo booths, and our mall Christmas tradition. The ordinary days quietly became my favorite ones.',
      art: { layers: ['/art/era4.webp'] },
      polaroids: [
        { src: '/photos/era4-01.webp', caption: 'donut judge us', date: 'Jul 2022' },
        { src: '/photos/era4-02.webp', caption: 'our mall Christmas tradition', date: 'Nov 2022' },
        { src: '/photos/era4-03.webp', caption: 'movie dates are back', date: 'Feb 2023' },
        { src: '/photos/era4-04.webp', caption: 'proof, in strips', date: 'Sep 2023' },
      ],
      easterEggs: [
        { x: 0.45, y: 0.6, icon: '🎅', message: 'Bella wore the santa suit better than either of us. No contest.' },
      ],
    },
    {
      id: 'out-in-the-world',
      chapter: 5,
      title: 'Out in the world.',
      years: '2024–2025',
      note: 'Lakes and kayaks, brunches with Bella, golden-hour walks in the park. The world opened back up — and it was exactly as big as we remembered promising each other.',
      art: { layers: ['/art/era5.webp'] },
      polaroids: [
        { src: '/photos/era5-01.webp', caption: 'we survived the lake', date: 'Mar 2024' },
        { src: '/photos/era5-02.webp', caption: 'brunch with the baby', date: 'May 2024' },
        { src: '/photos/era5-03.webp', caption: 'Sunday best', date: 'Jun 2024' },
        { src: '/photos/era5-04.webp', caption: 'golden hour, golden you', date: 'Sep 2025' },
      ],
      easterEggs: [
        { x: 0.55, y: 0.3, icon: '🛶', message: 'We survived the bamboo raft. Barely. Together. That counts as a metaphor.' },
      ],
    },
    {
      id: 'now',
      chapter: 6,
      title: 'Eight years of us.',
      years: '2025–today',
      note: 'We hiked to a summit and looked back at how far we have come. Eight years in, every day still feels like the good part.',
      art: { layers: ['/art/era6.webp'] },
      polaroids: [
        { src: '/photos/era6-01.webp', caption: 'the newest member', date: 'Mar 2026' },
        { src: '/photos/era6-02.webp', caption: 'still matching', date: 'Jun 2026' },
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

  vault: {
    title: 'The outtakes',
    note: 'Every photo that didn\'t fit on an island — yours now, because you looked closer.',
    // array order = display order = chronological (filenames are not sequential)
    photos: [
      { src: '/photos/vault-16.webp', caption: 'the friend who introduced us', date: 'May 2018' },
      { src: '/photos/vault-17.webp', caption: 'the audition phase', date: 'Jun 2018' },
      { src: '/photos/vault-18.webp', caption: 'practically official', date: 'Jun 2018' },
      { src: '/photos/vault-19.webp', caption: 'close, even then', date: 'Jun 2018' },
      { src: '/photos/vault-20.webp', caption: 'midnight runs, pre-us', date: 'Jun 2018' },
      { src: '/photos/vault-21.webp', caption: 'still just friends, allegedly', date: 'Jun 2018' },
      { src: '/photos/vault-01.webp', caption: 'day one, the quiet take', date: 'Jul 15, 2018' },
      { src: '/photos/vault-02.webp', caption: 'day one, one more', date: 'Jul 15, 2018' },
      { src: '/photos/vault-03.webp', caption: 'the wall where it started', date: 'Jul 2018' },
      { src: '/photos/vault-22.webp', caption: 'puppy pile', date: 'Jul 2018' },
      { src: '/photos/vault-23.webp', caption: 'lunch date, week three', date: 'Aug 2018' },
      { src: '/photos/vault-24.webp', caption: 'ice cream, plus a kiss', date: 'Aug 2018' },
      { src: '/photos/vault-25.webp', caption: 'faces we make in private', date: 'Sep 2018' },
      { src: '/photos/vault-26.webp', caption: 'booth hugs', date: 'Sep 2018' },
      { src: '/photos/vault-04.webp', caption: 'a whole road to ourselves', date: 'Nov 2018' },
      { src: '/photos/vault-27.webp', caption: 'under the fairy lights', date: 'Nov 2018' },
      { src: '/photos/vault-28.webp', caption: 'concert glow', date: 'Dec 2018' },
      { src: '/photos/vault-29.webp', caption: 'caught mid-conversation', date: 'Dec 2018' },
      { src: '/photos/vault-05.webp', caption: 'a kiss on the cheek', date: 'Jan 2019' },
      { src: '/photos/vault-06.webp', caption: 'a night under the lights', date: 'Jan 2019' },
      { src: '/photos/vault-30.webp', caption: 'the full birthday treatment', date: 'Jan 13, 2019' },
      { src: '/photos/vault-31.webp', caption: 'too many of me', date: 'Apr 2019' },
      { src: '/photos/vault-32.webp', caption: 'that smile', date: 'Apr 2019' },
      { src: '/photos/vault-33.webp', caption: 'park day', date: 'May 2019' },
      { src: '/photos/vault-34.webp', caption: 'the sushi tradition, est. 2019', date: 'Jul 14, 2019' },
      { src: '/photos/vault-07.webp', caption: 'the Chocolate Hills behind us', date: 'Nov 2019' },
      { src: '/photos/vault-08.webp', caption: 'round frames, Bohol sun', date: 'Nov 2019' },
      { src: '/photos/vault-35.webp', caption: 'windblown at the hills', date: 'Nov 2019' },
      { src: '/photos/vault-36.webp', caption: 'spelunking, sort of', date: 'Nov 2019' },
      { src: '/photos/vault-37.webp', caption: 'cleaned up nice', date: 'Nov 2019' },
      { src: '/photos/vault-38.webp', caption: 'life vests, big grins', date: 'Nov 2019' },
      { src: '/photos/vault-39.webp', caption: '2020, four minutes in', date: 'Jan 1, 2020' },
      { src: '/photos/vault-09.webp', caption: "Amelia's fan mail", date: 'Jul 2020' },
      { src: '/photos/vault-10.webp', caption: "new year's feast, party of three", date: 'Jan 1, 2021' },
      { src: '/photos/vault-11.webp', caption: 'ramen date, pandemic edition', date: 'Feb 2021' },
      { src: '/photos/vault-40.webp', caption: 'the three of us', date: 'Apr 2021' },
      { src: '/photos/vault-12.webp', caption: "Bella's other human", date: 'May 2021' },
      { src: '/photos/vault-41.webp', caption: 'glitchy but together', date: 'Oct 2021' },
      { src: '/photos/vault-42.webp', caption: 'the laugh take', date: 'Nov 2021' },
      { src: '/photos/vault-43.webp', caption: 'sea breeze, party of three', date: 'Jun 2022' },
      { src: '/photos/vault-44.webp', caption: 'katsu kind of day', date: 'Oct 2022' },
      { src: '/photos/vault-45.webp', caption: 'golden hour, indoor edition', date: 'Dec 2022' },
      { src: '/photos/vault-46.webp', caption: '3D glasses, two dorks', date: 'Dec 2022' },
      { src: '/photos/vault-47.webp', caption: 'media noche, party of three', date: 'Dec 31, 2022' },
      { src: '/photos/vault-48.webp', caption: 'floor cuddles with Bella', date: 'Apr 2023' },
      { src: '/photos/vault-13.webp', caption: 'crewmates', date: 'Oct 2023' },
      { src: '/photos/vault-49.webp', caption: 'prism dome date night', date: 'Oct 2023' },
      { src: '/photos/vault-50.webp', caption: 'cheek to cheek', date: 'Dec 2023' },
      { src: '/photos/vault-51.webp', caption: 'under the glowing tree', date: 'Jan 13, 2024' },
      { src: '/photos/vault-14.webp', caption: 'tempura for two', date: 'Apr 2024' },
      { src: '/photos/vault-52.webp', caption: 'movie night, plus one', date: 'Dec 2024' },
      { src: '/photos/vault-15.webp', caption: 'the whole crew, plus Bella', date: 'Jun 2025' },
    ],
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
