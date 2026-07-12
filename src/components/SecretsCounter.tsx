import { useEffect, useRef, useState } from 'react'
import { useSecrets } from '../SecretsContext'
import { celebrate } from '../lib/celebrate'
import { dismissHint, isHintDismissed } from '../lib/hint'
import { playEffect } from '../lib/sfx'

interface Props {
  onOpenVault: () => void
}

/**
 * The hunt's scoreboard — fixed bottom-right, mirroring the audio
 * button bottom-left. Hidden until the first egg is found (before
 * that it would spoil the surprise; the pulsing halos invite the
 * first tap). Once every secret is open it becomes the vault key.
 *
 * The chip's debut — the live first find, not a reload with persisted
 * progress — gets a chime and a short glow so it can't slip in
 * unnoticed, plus a tooltip above it that explains the counter and
 * stays (across visits) until she closes it. The live SEVENTH find is
 * the finale: confetti and a cheer (both one-shot, never on a reload
 * already at 7/7) as the chip morphs into the vault key.
 */
export default function SecretsCounter({ onOpenVault }: Props) {
  const { found, total, allFound } = useSecrets()
  // > 0 at mount means persisted progress from an earlier visit — the
  // chip is old news, so no chime and no glow (and the browser would
  // block the autoplay anyway, with no user gesture in the stack)
  const sizeAtMount = useRef(found.size)
  const debutFired = useRef(false)
  const completionFired = useRef(false)
  const [glowing, setGlowing] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(isHintDismissed)

  useEffect(() => {
    if (found.size === 0 || sizeAtMount.current > 0 || debutFired.current) return
    // one-shot guard: StrictMode double-invokes effects in dev
    debutFired.current = true
    // fires inside her tap on the egg, so autoplay policies allow it;
    // playEffect ducks the song under the chime and fails silently
    playEffect('/audio/secret-found.wav')
    // never unset: the keyframe's fixed iteration count (3) ends the
    // animation on its own
    setGlowing(true)
  }, [found.size])

  useEffect(() => {
    // the live 7th find only — a visit that already STARTS at 7/7
    // mounts quiet, same rule as the debut above. sizeAtMount does
    // double duty: 5/7-persisted-then-finished-live still celebrates.
    if (!allFound || sizeAtMount.current >= total || completionFired.current) return
    completionFired.current = true
    playEffect('/audio/all-found.mp3')
    celebrate()
  }, [allFound, total])

  if (found.size === 0) return null

  const closeHint = () => {
    setHintDismissed(true)
    dismissHint()
  }

  const hint = !hintDismissed && (
    <div className="egg-pop fixed right-4 bottom-20 z-40 flex w-56 items-start rounded-2xl bg-white/95 p-3 pr-0 shadow-md">
      <p className="font-hand text-lg leading-snug text-ink">
        you found a secret! 7 are hidden around our world — find them all
        and something opens…
      </p>
      <button
        type="button"
        onClick={closeHint}
        aria-label="got it"
        className="-mt-3 flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center text-ink-soft hover:text-rose"
      >
        ✕
      </button>
    </div>
  )

  if (!allFound) {
    return (
      <>
        {hint}
        <p
          role="status"
          className="fixed right-4 bottom-4 z-40 rounded-full bg-white/95 px-4 py-2.5 font-hand text-lg leading-none text-ink shadow-md ring-2 ring-rose/40"
        >
          {glowing && (
            <span
              aria-hidden
              className="chip-glow pointer-events-none absolute inset-0 rounded-full"
            />
          )}
          {found.size} / {total} secrets
        </p>
      </>
    )
  }

  return (
    <>
      {hint}
      <button
        type="button"
        onClick={onOpenVault}
        aria-label="Open the vault of extra photos"
        className="fixed right-4 bottom-4 z-40 flex cursor-pointer items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 font-hand text-lg leading-none text-rose shadow-md ring-2 ring-rose/40"
      >
        <span aria-hidden className="relative flex h-4 w-4 items-center justify-center">
          <span className="egg-ping absolute inset-0 rounded-full bg-rose/50" />
          🔓
        </span>
        open the vault
      </button>
    </>
  )
}
