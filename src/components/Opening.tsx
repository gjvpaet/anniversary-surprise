import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/motion'
import { content } from '../content'
import Counter from './Counter'

/**
 * The overlook: the whole world seen tiny from above, her name, the
 * live counter. Scrolling away zooms the camera "down" into the world
 * (the opening scales up and fades as era 1 flies in beneath it).
 */
export default function Opening() {
  const section = useRef<HTMLElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const arc = useRef<HTMLDivElement>(null)
  const cue = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(section)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to(inner.current, {
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
        scale: 1.12,
        autoAlpha: 0,
        ease: 'none',
      })

      if (arc.current) {
        gsap.to(Array.from(arc.current.children), {
          y: -6,
          duration: 2.2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: { each: 0.35, from: 'center' },
        })
      }

      gsap.to(cue.current, {
        y: 6,
        duration: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    })

    return () => mm.revert()
  }, [])

  return (
    <section ref={section} className="relative h-svh overflow-hidden">
      <div
        ref={inner}
        className="flex h-full flex-col items-center justify-center gap-8 px-10 text-center md:px-6"
      >
        {/* the whole world, tiny, from above (also prefetches every island) */}
        <div ref={arc} className="flex items-end justify-center" aria-hidden>
          {content.eras.map((era, i) => (
            <img
              key={era.id}
              src={era.art.layers[era.art.layers.length - 1]}
              alt=""
              className="w-14 drop-shadow md:w-20"
              style={{ marginTop: `${Math.abs(i - 2.5) * 10}px` }}
            />
          ))}
        </div>

        <h1 className="font-display text-4xl text-ink md:text-5xl text-balance">
          Welcome, {content.herName} 🗺️
        </h1>
        <Counter />
        <p ref={cue} className="text-sm text-ink-soft">
          ↓ scroll to begin our story ↓
        </p>
      </div>
    </section>
  )
}
