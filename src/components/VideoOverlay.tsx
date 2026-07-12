import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  onClose: () => void
}

/**
 * Fullscreen player for an easter egg's video. Native controls only.
 * Pauses "our song" while open (AudioPlayer listens for the events)
 * and hands playback back on close.
 */
export default function VideoOverlay({ src, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const [entered, setEntered] = useState(false)

  // NOTE: the pause-song/resume-song dispatches live in App (keyed on its
  // video state), NOT here — a mount effect gets double-invoked by dev
  // StrictMode, which interleaves a stray resume between two pauses and
  // breaks the AudioPlayer's "was it playing?" flag.
  useEffect(() => {
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    closeButton.current?.focus()
    // timer, not rAF: rAF is suspended in background tabs
    const timer = window.setTimeout(() => setEntered(true), 20)
    return () => {
      document.documentElement.style.overflow = previous
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video: day one"
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/85 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* portrait phone video — cap by height, keep native controls.
          poster + intrinsic size keep the box portrait before metadata
          loads (preload=none means nothing loads until she presses play) */}
      <video
        src={src}
        poster={`${src.replace(/\.mp4$/, '')}-poster.webp`}
        width={540}
        height={960}
        controls
        playsInline
        preload="none"
        onClick={(e) => e.stopPropagation()}
        className="h-auto max-h-[80svh] w-auto max-w-[92vw]"
      />
      <button
        ref={closeButton}
        type="button"
        aria-label="Close video"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-lg text-ink shadow-md"
      >
        ✕
      </button>
    </div>
  )
}
