import { useEffect, useRef, useState } from 'react'
import { lock } from '../lib/gate'
import { clearFound } from '../lib/secrets'
import { clearHint } from '../lib/hint'

/**
 * "Relive it from the beginning" — the visible reset at the end of the
 * finale. Two-step inline confirm (one stray tap must not wipe a 7/7
 * hunt), then every localStorage key (gate, secrets, counter tooltip)
 * is cleared and the page reloads on the bare pathname — stripping the
 * query so the ?key owner bypass in isUnlocked() can't silently
 * re-unlock the gate.
 */
export default function StartOver() {
  const [confirming, setConfirming] = useState(false)
  const keepButton = useRef<HTMLButtonElement>(null)

  // the idle button unmounts when confirming appears — land focus on
  // the safe choice instead of letting it drop to <body>
  useEffect(() => {
    if (confirming) keepButton.current?.focus()
  }, [confirming])

  const reset = () => {
    try {
      clearFound()
      lock()
      clearHint()
    } finally {
      window.location.replace(window.location.pathname)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-8 min-h-11 cursor-pointer font-hand text-lg text-ink-soft underline decoration-dotted underline-offset-4 hover:text-rose"
      >
        relive it from the beginning ↺
      </button>
    )
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <p className="font-hand text-lg text-ink-soft">
        start over? the secrets reset too —
      </p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 cursor-pointer rounded-full bg-rose px-4 py-1.5 font-hand text-lg leading-none text-white shadow-sm"
      >
        yes, take me back
      </button>
      <button
        ref={keepButton}
        type="button"
        onClick={() => setConfirming(false)}
        className="min-h-11 cursor-pointer rounded-full bg-cream/90 px-4 py-1.5 font-hand text-lg leading-none text-ink shadow-sm"
      >
        keep this
      </button>
    </div>
  )
}
