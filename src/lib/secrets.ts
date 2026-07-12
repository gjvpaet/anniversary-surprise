import type { Era } from '../content'

/** Matches the gate's `eightyears:unlocked` key convention. */
const STORAGE_KEY = 'eightyears:secrets'

/**
 * Stable identity for an egg across reloads. Coords are deliberately
 * excluded so nudging an egg's position doesn't reset her progress.
 * Constraint: no two eggs on the same era may share an icon.
 */
export function eggId(eraId: string, icon: string): string {
  return `${eraId}:${icon}`
}

/** Derived, never hardcoded — adding an egg can't desync the counter. */
export function totalSecrets(eras: Pick<Era, 'easterEggs'>[]): number {
  return eras.reduce((n, era) => n + era.easterEggs.length, 0)
}

/**
 * Storage access is fully fault-tolerant: private mode or corrupt data
 * degrades to an empty set (in-memory hunt, resets on reload) rather
 * than crashing the site on launch day.
 */
export function loadFound(storage: Storage = localStorage): Set<string> {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? new Set(parsed.filter((v): v is string => typeof v === 'string'))
      : new Set()
  } catch {
    return new Set()
  }
}

export function saveFound(found: Set<string>, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...found]))
  } catch {
    // storage unavailable — the hunt still works within this visit
  }
}
