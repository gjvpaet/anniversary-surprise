import { useState } from 'react'
import { checkGateAnswer, unlock } from '../lib/gate'

const NUDGES = [
  'Hmm… not quite. Think back to the very beginning.',
  'Close your eyes. What day did everything change?',
  'It’s written on my heart — and hopefully your calendar.',
  'One more try. I know you know this one.',
]

interface GateProps {
  onUnlock: () => void
}

export default function Gate({ onUnlock }: GateProps) {
  const [value, setValue] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [leaving, setLeaving] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (checkGateAnswer(value)) {
      unlock()
      setLeaving(true)
      window.setTimeout(onUnlock, 700) // let the fade finish
    } else {
      setAttempts((n) => n + 1)
      setValue('')
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-cream to-blush-soft px-6 text-center transition-opacity duration-700 ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <div className="text-3xl" aria-hidden>
        🔐
      </div>
      <h1 className="font-display text-2xl text-ink md:text-3xl text-balance">
        This is for one person only.
      </h1>
      <p className="text-sm text-ink-soft">Enter the date we met to come in.</p>
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col items-center gap-3">
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="the day it all started…"
          aria-label="The date we met"
          className="w-full rounded-full border border-blush bg-white/80 px-5 py-3 text-center text-ink shadow-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/30"
        />
        <button
          type="submit"
          className="rounded-full bg-rose px-8 py-2.5 text-sm font-medium text-white shadow transition hover:brightness-105 active:scale-95"
        >
          Come in
        </button>
      </form>
      <p
        className="min-h-5 text-sm text-rose transition-opacity"
        aria-live="polite"
      >
        {attempts > 0 && NUDGES[Math.min(attempts - 1, NUDGES.length - 1)]}
      </p>
    </div>
  )
}
