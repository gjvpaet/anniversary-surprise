import { useEffect, useRef, useState } from 'react'
import { content } from '../content'

/**
 * "Our song" — a persistent fixed control, bottom-left (the chapter
 * nav owns the right edge). Playback is strictly user-initiated (no
 * autoplay, PRD §7) and loops for the whole scroll. The label invites
 * the first tap, then collapses to just the button.
 */
export default function AudioPlayer() {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [everPlayed, setEverPlayed] = useState(false)
  // set when a video interrupts the song, so it only resumes if it was playing
  const resumeAfterVideo = useRef(false)

  useEffect(() => {
    const onPause = () => {
      const el = audio.current
      if (!el || el.paused) return
      resumeAfterVideo.current = true
      el.pause()
      setPlaying(false)
    }
    const onResume = () => {
      const el = audio.current
      if (!el || !resumeAfterVideo.current) return
      resumeAfterVideo.current = false
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    }
    window.addEventListener('pause-song', onPause)
    window.addEventListener('resume-song', onResume)
    return () => {
      window.removeEventListener('pause-song', onPause)
      window.removeEventListener('resume-song', onResume)
    }
  }, [])

  const toggle = () => {
    const el = audio.current
    if (!el) return
    if (el.paused) {
      // browsers may still reject (e.g. interrupted) — keep state honest
      el.play()
        .then(() => {
          setPlaying(true)
          setEverPlayed(true)
        })
        .catch(() => setPlaying(false))
    } else {
      el.pause()
      setPlaying(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2.5">
      <audio ref={audio} src={content.song.file} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Pause our song' : 'Play our song'}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-blush-soft text-lg text-rose shadow-md transition-transform hover:scale-105 motion-reduce:transition-none"
      >
        {playing ? '❚❚' : '♪'}
      </button>
      <div
        className={`rounded-full bg-cream/90 px-3 py-1.5 text-xs text-ink-soft shadow-sm transition-opacity duration-500 motion-reduce:transition-none ${
          everPlayed && !playing ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden={everPlayed && !playing}
      >
        {playing ? (
          <span className="text-rose">
            {content.song.title} — {content.song.artist}
          </span>
        ) : (
          'our song 🎵'
        )}
      </div>
    </div>
  )
}
