import { useEffect, useRef, useState } from 'react'
import type { EasterEgg } from '../content'

interface Props {
  egg: EasterEgg
}

/**
 * A tiny tappable detail hidden on the island art (PRD §6): positioned
 * by normalized coords within the artwork, a soft pulsing halo invites
 * the tap, and the bubble holds the one-liner only she gets. Tapping
 * anywhere else (or ESC) closes it.
 */
export default function EasterEggButton({ egg }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div
      ref={root}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${open ? 'z-20' : 'z-10'}`}
      style={{ left: `${egg.x * 100}%`, top: `${egg.y * 100}%` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Hide this little secret' : 'A little secret — tap me'}
        className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
      >
        {/* soft halo inviting the tap */}
        <span
          aria-hidden
          className="absolute inset-1.5 animate-pulse rounded-full bg-cream/70 shadow-sm motion-reduce:animate-none"
        />
        <span className="relative text-xl drop-shadow-sm">{egg.icon}</span>
      </button>

      {open && (
        <div
          role="status"
          className="egg-pop absolute bottom-full left-1/2 mb-1 w-52 -translate-x-1/2 rounded-xl bg-white/95 p-3 text-center shadow-xl"
        >
          <p className="font-hand text-lg leading-snug text-ink">{egg.message}</p>
          {/* bubble tail */}
          <span
            aria-hidden
            className="absolute top-full left-1/2 block h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[7px] border-x-transparent border-t-white/95"
          />
        </div>
      )}
    </div>
  )
}
