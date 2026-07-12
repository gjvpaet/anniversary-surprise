import { content } from '../content'

const STORAGE_KEY = 'eightyears:unlocked'

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

interface Ymd {
  y: number
  m: number
  d: number
}

function target(): Ymd {
  const [y, m, d] = content.relationshipStart.split('-').map(Number)
  return { y, m, d }
}

/**
 * Parse a human-typed date, tolerantly. Returns every plausible
 * reading (e.g. 02/06/2018 is both Feb 6 and Jun 2) — the gate
 * accepts the input if ANY reading matches the real date.
 */
function readings(raw: string): Ymd[] {
  const input = raw.trim().toLowerCase().replace(/(\d+)(st|nd|rd|th)/g, '$1')
  const out: Ymd[] = []

  // "june 2, 2018" / "2 june 2018" / "june 2 2018"
  const monthIdx = MONTHS.findIndex(
    (name) => input.includes(name) || input.includes(name.slice(0, 3)),
  )
  if (monthIdx !== -1) {
    const nums = input.match(/\d+/g)?.map(Number) ?? []
    const year = nums.find((n) => n > 1900)
    const day = nums.find((n) => n >= 1 && n <= 31 && n !== year)
    if (year && day) out.push({ y: year, m: monthIdx + 1, d: day })
  }

  // numeric: 15/07/2018, 07-15-2018, 2018.07.15, 15 07 2018
  const nums = input.match(/\d+/g)?.map(Number) ?? []
  if (nums.length === 3) {
    const [a, b, c] = nums
    if (a > 1900) out.push({ y: a, m: b, d: c }) // YYYY M D
    if (c > 1900) {
      out.push({ y: c, m: b, d: a }) // D M YYYY
      out.push({ y: c, m: a, d: b }) // M D YYYY
    }
  }

  return out
}

export function checkGateAnswer(raw: string): boolean {
  const t = target()
  return readings(raw).some((r) => r.y === t.y && r.m === t.m && r.d === t.d)
}

export function isUnlocked(): boolean {
  if (localStorage.getItem(STORAGE_KEY) === '1') return true
  // Owner bypass for testing: ?key=YYYYMMDD (start date, digits only)
  const key = new URLSearchParams(window.location.search).get('key')
  if (key && key === content.relationshipStart.replaceAll('-', '')) {
    unlock()
    return true
  }
  return false
}

export function unlock(): void {
  localStorage.setItem(STORAGE_KEY, '1')
}

/**
 * Reset for the "start over" control — she meets the gate again.
 * Callers must reload WITHOUT the ?key param, or the bypass in
 * isUnlocked() silently re-unlocks on the next visit.
 */
export function lock(): void {
  localStorage.removeItem(STORAGE_KEY)
}
