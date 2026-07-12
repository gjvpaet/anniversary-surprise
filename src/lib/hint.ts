/** Matches the gate/secrets `eightyears:*` key convention. */
const STORAGE_KEY = 'eightyears:hint'

/**
 * Has she closed the counter tooltip? Storage failure degrades to
 * false — the tooltip shows again, which is annoying at worst,
 * never a crash.
 */
export function isHintDismissed(storage: Storage = localStorage): boolean {
  try {
    return storage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function dismissHint(storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, '1')
  } catch {
    // storage unavailable — dismissal lasts this visit only
  }
}

/** Reset for the "start over" control — a replay shows the tooltip again. */
export function clearHint(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable — nothing persisted, so nothing to clear
  }
}
