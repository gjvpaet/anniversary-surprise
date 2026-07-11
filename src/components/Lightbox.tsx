import { useEffect, useRef, useState } from 'react'
import type { Polaroid } from '../content'

interface Props {
  /** All polaroids of the era being browsed (swipe stays within it). */
  polaroids: Polaroid[]
  index: number
  onNavigate: (index: number) => void
  onClose: () => void
}

/**
 * Fullscreen polaroid viewer. Opens from a tap on a fan photo:
 * enlarged shot with its caption and date, ←/→ keys or swipe to move
 * within the era, ESC or tapping outside to close. Page scroll is
 * locked while open so ScrollTrigger's pinned world stays put.
 */
export default function Lightbox({ polaroids, index, onNavigate, onClose }: Props) {
  const photo = polaroids[index]
  const closeButton = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)
  const [entered, setEntered] = useState(false)

  const prev = () => onNavigate((index - 1 + polaroids.length) % polaroids.length)
  const next = () => onNavigate((index + 1) % polaroids.length)

  useEffect(() => {
    // lock the page behind the modal; restore on close
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    closeButton.current?.focus()
    // timer, not rAF: rAF is suspended in background tabs and the
    // modal would never fade in
    const timer = window.setTimeout(() => setEntered(true), 20)
    return () => {
      document.documentElement.style.overflow = previous
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!photo) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo: ${photo.caption}`}
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        touchStartX.current = null
        if (Math.abs(dx) < 40) return
        if (dx > 0) prev()
        else next()
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* the big polaroid — clicks inside shouldn't close */}
      <figure
        onClick={(e) => e.stopPropagation()}
        className={`max-w-[88vw] bg-white p-3 pb-4 shadow-2xl transition-transform duration-300 motion-reduce:transition-none md:max-w-md ${
          entered ? 'scale-100 rotate-1' : 'scale-90 rotate-3'
        }`}
      >
        <img
          src={photo.src}
          alt={photo.caption}
          className="max-h-[62svh] w-full object-contain"
        />
        <figcaption className="mt-3 flex items-baseline justify-between gap-4">
          <span className="font-hand text-xl text-ink md:text-2xl">{photo.caption}</span>
          <span className="shrink-0 text-xs tracking-widest text-ink-soft uppercase">
            {photo.date}
          </span>
        </figcaption>
      </figure>

      {/* controls — 44px+ targets, above the backdrop click layer */}
      <button
        ref={closeButton}
        type="button"
        aria-label="Close photo"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-lg text-ink shadow-md"
      >
        ✕
      </button>

      {polaroids.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            className="absolute left-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-ink shadow-md md:left-5"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="absolute right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-ink shadow-md md:right-5"
          >
            →
          </button>
          <p className="absolute bottom-4 text-xs tracking-widest text-cream/90">
            {index + 1} / {polaroids.length}
          </p>
        </>
      )}
    </div>
  )
}
