import { useEffect, useRef, useState } from 'react'
import { content } from '../content'

/**
 * "Our song" — a persistent fixed control, bottom-left (the chapter
 * nav owns the right edge). The song starts itself the moment the
 * world appears (deliberately superseding the PRD §7 no-autoplay
 * rule): after a live gate unlock her "Come in" tap is the gesture
 * that authorizes playback; on a return visit, where the browser
 * usually blocks the attempt, her first tap or keypress starts it.
 * The ♪ button remains the manual pause/play control and the song
 * loops for the whole scroll.
 *
 * Sound effects (lib/sfx.ts) duck the song via a Web Audio gain
 * node — duck-song dips it to 20%, unduck-song swells it back.
 * iPhone Safari ignores HTMLMediaElement.volume, so the gain graph
 * is the only ducking that works on her actual device.
 */
export default function AudioPlayer() {
  const audio = useRef<HTMLAudioElement>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const gain = useRef<GainNode | null>(null)
  const [playing, setPlaying] = useState(false)
  const [everPlayed, setEverPlayed] = useState(false)
  // set when a video interrupts the song, so it only resumes if it was playing
  const resumeAfterVideo = useRef(false)

  // Route the element through AudioContext → gain → speakers so
  // effects can duck it. One-shot: createMediaElementSource is only
  // legal once per element. Once routed, sound reaches the speakers
  // ONLY through the graph — a suspended context would silence the
  // song, so every play path (and the safety-net tap listener below)
  // resumes it.
  const ensureGraph = () => {
    const el = audio.current
    if (!el || gain.current) return
    try {
      const ctx = new AudioContext()
      const source = ctx.createMediaElementSource(el)
      const g = ctx.createGain()
      source.connect(g)
      g.connect(ctx.destination)
      audioCtx.current = ctx
      gain.current = g
    } catch {
      // Web Audio unavailable — the song simply plays unducked
    }
  }

  const play = () => {
    const el = audio.current
    if (!el) return Promise.resolve()
    return el.play().then(() => {
      ensureGraph()
      audioCtx.current?.resume().catch(() => {})
      setPlaying(true)
      setEverPlayed(true)
    })
  }

  // Autoplay: try as soon as the player mounts — the world just
  // appeared. Blocked (typical on a return visit, where unlock came
  // from localStorage with no gesture) → retry once on her first
  // tap or keypress.
  useEffect(() => {
    const retry = () => {
      remove()
      play().catch(() => setPlaying(false))
    }
    const remove = () => {
      window.removeEventListener('pointerdown', retry)
      window.removeEventListener('keydown', retry)
    }
    play().catch((err: unknown) => {
      // pause() during the pending play() rejects with AbortError —
      // an intentional stop, not an autoplay block; don't arm the retry
      if (err instanceof DOMException && err.name === 'AbortError') return
      window.addEventListener('pointerdown', retry)
      window.addEventListener('keydown', retry)
    })
    return remove
  }, [])

  // Safety net: if the context ends up suspended anyway (iOS gesture
  // strictness, tab backgrounding), any tap heals it. resume() on a
  // running context is a free no-op.
  useEffect(() => {
    const resume = () => {
      audioCtx.current?.resume().catch(() => {})
    }
    window.addEventListener('pointerdown', resume)
    return () => window.removeEventListener('pointerdown', resume)
  }, [])

  useEffect(() => {
    const onPause = () => {
      const el = audio.current
      if (!el || el.paused) return
      resumeAfterVideo.current = true
      el.pause()
      setPlaying(false)
    }
    const onResume = () => {
      if (!resumeAfterVideo.current) return
      resumeAfterVideo.current = false
      play().catch(() => setPlaying(false))
    }
    window.addEventListener('pause-song', onPause)
    window.addEventListener('resume-song', onResume)
    return () => {
      window.removeEventListener('pause-song', onPause)
      window.removeEventListener('resume-song', onResume)
    }
  }, [])

  // Effects ask the song to make room: dip fast, swell back gently.
  useEffect(() => {
    const ramp = (target: number, seconds: number) => {
      const g = gain.current
      if (!g) return
      const t = g.context.currentTime
      // read BEFORE cancel: cancelling an in-flight ramp reverts the
      // param to the prior anchor, not the audible mid-ramp value
      const current = g.gain.value
      g.gain.cancelScheduledValues(t)
      g.gain.setValueAtTime(current, t)
      g.gain.linearRampToValueAtTime(target, t + seconds)
    }
    const onDuck = () => ramp(0.2, 0.15)
    const onUnduck = () => ramp(1, 0.6)
    window.addEventListener('duck-song', onDuck)
    window.addEventListener('unduck-song', onUnduck)
    return () => {
      window.removeEventListener('duck-song', onDuck)
      window.removeEventListener('unduck-song', onUnduck)
    }
  }, [])

  const toggle = () => {
    const el = audio.current
    if (!el) return
    if (el.paused) {
      // browsers may still reject (e.g. interrupted) — keep state honest
      play().catch(() => setPlaying(false))
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
