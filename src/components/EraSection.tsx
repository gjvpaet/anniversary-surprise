import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/motion'
import type { Era } from '../content'
import EasterEggButton from './EasterEggButton'

/** Final resting tilt for each polaroid in the fan, by index. */
const ROTATIONS = [-6, 5, -4, 7]

interface Props {
  era: Era
  /** Reports which chapter the camera is on, for the fixed nav. */
  onActive: (chapter: number) => void
  /** Opens the lightbox on this era's polaroid at the given index. */
  onOpenPolaroid: (era: Era, index: number) => void
}

/**
 * One pinned era scene. The scroll position scrubs a deterministic
 * timeline: the island flies in (scale + rise), the chapter header and
 * note fade up, the polaroids fan out one by one, the scene holds,
 * then the whole stage drifts up and away as the camera leaves.
 *
 * Default (un-animated) styles are the fully-visible end state, so
 * reduced-motion users get a complete static page — the PRD's
 * crossfade-only fallback.
 */
export default function EraSection({ era, onActive, onOpenPolaroid }: Props) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const island = useRef<HTMLDivElement>(null)
  const float = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLDivElement>(null)
  const note = useRef<HTMLParagraphElement>(null)
  const fan = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(section)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const polaroids = fan.current ? Array.from(fan.current.children) : []

      // Approach flight: while the section scrolls up into view (before
      // the pin), the island rides in — scaling up as the camera
      // "descends". Keeping it visible here is what makes the handoff
      // between eras continuous instead of a blank gap.
      gsap.fromTo(
        island.current,
        { scale: 0.55, yPercent: 26 },
        {
          scale: 1,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        },
      )

      // Pinned scene: text and polaroids choreographed by scroll.
      const tl = gsap.timeline({
        scrollTrigger: {
          id: era.id, // ChapterNav jumps to this trigger's start
          trigger: section.current,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          onToggle: (self) => {
            if (self.isActive) onActive(era.chapter)
          },
        },
      })

      tl.fromTo(
        header.current,
        { y: 36, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5 },
      )
        .fromTo(
          note.current,
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45 },
          '-=0.2',
        )
        .fromTo(
          polaroids,
          { y: 70, autoAlpha: 0, scale: 0.85, rotation: 0 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            rotation: (i: number) => ROTATIONS[i % ROTATIONS.length],
            duration: 0.5,
            stagger: 0.16,
            ease: 'back.out(1.4)',
          },
          '-=0.1',
        )
        .to({}, { duration: 0.7 }) // hold the finished scene
        .to(stage.current, {
          yPercent: -10,
          autoAlpha: 0,
          scale: 0.96,
          duration: 0.7,
          ease: 'power1.in',
        })

      // gentle idle bob, desynced per era so islands don't move in unison
      gsap.to(float.current, {
        y: -9,
        duration: 2.4 + era.chapter * 0.25,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    })

    // Reduced motion: no pin, no scrub — just track position for the nav.
    mm.add('(prefers-reduced-motion: reduce)', () => {
      ScrollTrigger.create({
        id: era.id,
        trigger: section.current,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) onActive(era.chapter)
        },
      })
    })

    return () => mm.revert()
  }, [era.id, era.chapter, onActive])

  return (
    <section ref={section} id={era.id} className="relative h-svh overflow-hidden">
      <div
        ref={stage}
        className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-5 px-10 text-center md:px-6"
      >
        <div ref={island} className="w-full">
          <div ref={float}>
            {/* shrink-wraps the art so the eggs' % coords track it */}
            <div className="relative mx-auto w-fit max-w-full">
              <img
                src={era.art.layers[era.art.layers.length - 1]}
                alt=""
                loading={era.chapter === 1 ? 'eager' : 'lazy'}
                decoding="async"
                className="max-h-[38svh] w-auto max-w-full drop-shadow-xl"
              />
              {era.easterEggs.map((egg) => (
                <EasterEggButton key={egg.icon} egg={egg} />
              ))}
            </div>
          </div>
        </div>

        <div ref={header}>
          <p className="text-xs tracking-[0.2em] text-rose uppercase">
            Chapter {String(era.chapter).padStart(2, '0')} · {era.years}
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl text-balance">
            {era.title}
          </h2>
        </div>

        <p ref={note} className="max-w-md text-sm leading-relaxed text-ink-soft">
          {era.note}
        </p>

        <div ref={fan} className="flex items-center justify-center">
          {era.polaroids.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => onOpenPolaroid(era, i)}
              aria-label={`Enlarge photo: ${p.caption}`}
              className="relative -ml-5 cursor-pointer bg-white p-2 pb-3 shadow-lg transition-transform duration-200 first:ml-0 hover:z-10 hover:scale-105 motion-reduce:transition-none"
              style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)` }}
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                decoding="async"
                className="h-24 w-24 object-cover md:h-32 md:w-32"
              />
              <span className="mt-1 block font-hand text-sm leading-tight text-ink-soft md:text-base">
                {p.caption}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
