/**
 * Generates placeholder island art + polaroid photos so the build is
 * never blocked on final assets (PRD §5). Re-run any time:
 *
 *   node scripts/make-placeholder-art.mjs
 *
 * Final art replaces these files at the same paths (as .webp — update
 * content.ts extensions when swapping).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// One palette + motif set per island, tracking the era's mood
const islands = [
  { file: 'era1.svg', ground: ['#9db87a', '#7a9a5c'], soil: '#8a6f4d', sky: '#fdf3e3', motifs: ['🏫', '🧋', '🌳'], label: 'how we met' },
  { file: 'era2.svg', ground: ['#b8c98a', '#8fae66'], soil: '#93764f', sky: '#e8f2fa', motifs: ['⛰️', '🎒', '🗺️'], label: 'first adventures' },
  { file: 'era3.svg', ground: ['#a9b8c8', '#7f93aa'], soil: '#6f6a7d', sky: '#eceef7', motifs: ['🏠', '💻', '📮'], label: 'the year we held on' },
  { file: 'era4.svg', ground: ['#c9b88a', '#a99460'], soil: '#8a6f4d', sky: '#fbeede', motifs: ['🛋️', '🪴', '🔑'], label: 'building something real' },
  { file: 'era5.svg', ground: ['#8ac9b8', '#5fa892'], soil: '#7d8a6f', sky: '#e3f4fd', motifs: ['✈️', '📷', '🌅'], label: 'the world together' },
  { file: 'era6.svg', ground: ['#c98aa9', '#a85f82'], soil: '#8a5f6f', sky: '#fdeef3', motifs: ['🏡', '💐', '🐾'], label: 'eight years of us' },
  { file: 'ninth.svg', ground: ['#cfc0e8', '#a893cf'], soil: '#8a7a9d', sky: '#f3eefb', motifs: ['🏗️', '🧱', '📐'], label: 'year 9 — under construction', dashed: true },
]

function islandSvg({ ground, soil, sky, motifs, label, dashed }) {
  const outline = dashed
    ? 'stroke="#7a6a9a" stroke-width="4" stroke-dasharray="14 10" fill-opacity="0.55"'
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" font-family="system-ui">
  <rect width="800" height="520" fill="${sky}"/>
  <ellipse cx="180" cy="90" rx="60" ry="22" fill="#ffffff" opacity="0.8"/>
  <ellipse cx="600" cy="130" rx="80" ry="26" fill="#ffffff" opacity="0.7"/>
  <ellipse cx="400" cy="400" rx="270" ry="88" fill="${soil}" opacity="0.85"/>
  <ellipse cx="400" cy="368" rx="280" ry="100" fill="${ground[1]}" ${outline}/>
  <ellipse cx="400" cy="352" rx="252" ry="84" fill="${ground[0]}" ${outline}/>
  <text x="270" y="330" font-size="72">${motifs[0]}</text>
  <text x="440" y="360" font-size="52">${motifs[1]}</text>
  <text x="540" y="310" font-size="44">${motifs[2]}</text>
  <text x="400" y="490" font-size="20" text-anchor="middle" fill="#7a6a5e">placeholder · ${label}</text>
</svg>
`
}

const photoTints = [
  ['#f0c078', '#d88a5c'], ['#a8c8e8', '#7898c8'], ['#b8d9a0', '#84b06a'],
  ['#e8b4c4', '#c26a85'], ['#cfc0e8', '#9a82c9'], ['#f2d49b', '#cfa050'],
  ['#9fd8cf', '#5fa89b'], ['#e8c0b4', '#c2856a'], ['#c0d0e8', '#8098c0'],
  ['#e8d5b5', '#c0a070'], ['#d0b8d8', '#a279b3'], ['#f0b8b0', '#d07868'],
]

function photoSvg([from, to], n) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" font-family="system-ui">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <text x="200" y="215" font-size="90" text-anchor="middle">📷</text>
  <text x="200" y="330" font-size="24" text-anchor="middle" fill="#ffffff" opacity="0.9">real photo ${n} goes here</text>
</svg>
`
}

mkdirSync(join(root, 'public/art'), { recursive: true })
mkdirSync(join(root, 'public/photos'), { recursive: true })
mkdirSync(join(root, 'public/audio'), { recursive: true })

for (const island of islands) {
  writeFileSync(join(root, 'public/art', island.file), islandSvg(island))
}
photoTints.forEach((tint, i) => {
  writeFileSync(join(root, 'public/photos', `placeholder-${i + 1}.svg`), photoSvg(tint, i + 1))
})

console.log(`wrote ${islands.length} islands → public/art, ${photoTints.length} photos → public/photos`)
