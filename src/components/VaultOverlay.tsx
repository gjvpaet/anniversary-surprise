import { useEffect, useRef, useState } from 'react'
import { content } from '../content'

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  /** True while a Lightbox is stacked on top — suspends this ESC handler. */
  suspended: boolean
  onOpenPhoto: (index: number) => void
  onClose: () => void
}

/**
 * The treasure-hunt payoff: a fullscreen gallery of the outtakes,
 * unlocked by finding every easter egg. Same modal conventions as
 * Lightbox (scroll lock, ESC, entrance via timer — rAF is suspended
 * in background tabs). Sits below the Lightbox that opens on top.
 */
export default function VaultOverlay({ suspended, onOpenPhoto, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    closeButton.current?.focus()
    const timer = window.setTimeout(() => setEntered(true), 20)
    return () => {
      document.documentElement.style.overflow = previous
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (suspended) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [suspended, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content.vault.title}
      className={`fixed inset-0 z-45 overflow-y-auto bg-cream transition-opacity duration-300 motion-reduce:transition-none ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <p className="text-xs tracking-[0.2em] text-rose uppercase">Secret unlocked</p>
        <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">
          {content.vault.title}
        </h2>
        <p className="mx-auto mt-2 max-w-md font-hand text-xl text-ink-soft">
          {content.vault.note}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {content.vault.photos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => onOpenPhoto(i)}
              aria-label={`Enlarge photo: ${p.caption}`}
              className="cursor-pointer bg-white p-2 pb-3 shadow-lg transition-transform duration-200 hover:z-10 hover:scale-105 motion-reduce:transition-none"
              // deterministic scatter tilt; straight grid under reduced motion
              style={
                prefersReducedMotion()
                  ? undefined
                  : { transform: `rotate(${((i * 7) % 11) - 5}deg)` }
              }
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
              <span className="mt-1 block font-hand text-sm leading-tight text-ink-soft">
                {p.caption}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        ref={closeButton}
        type="button"
        aria-label="Close the vault"
        onClick={onClose}
        className="fixed top-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-blush-soft text-lg text-ink shadow-md"
      >
        ✕
      </button>
    </div>
  )
}
