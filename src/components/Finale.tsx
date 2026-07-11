import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/motion'
import { content } from '../content'
import Counter from './Counter'

/**
 * The 9th island and the letter. Day-2 skeleton: gentle entrance
 * reveals on scroll. Day 3 adds the polaroid swirl into the envelope
 * and the sealed-letter interaction.
 */
export default function Finale() {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(root)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      for (const el of gsap.utils.toArray<HTMLElement>('[data-reveal]', root.current)) {
        gsap.fromTo(
          el,
          { y: 40, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          },
        )
      }
    })

    return () => mm.revert()
  }, [])

  return (
    <div ref={root}>
      {/* The 9th island */}
      <section className="flex min-h-[70svh] flex-col items-center justify-center gap-4 bg-gradient-to-b from-cream to-lavender/30 px-6 py-16 text-center">
        <img
          src="/art/ninth.webp"
          alt=""
          loading="lazy"
          decoding="async"
          data-reveal
          className="w-full max-w-sm drop-shadow-xl"
        />
        <div data-reveal>
          <h2 className="font-display text-2xl text-ink">{content.ninthIsland.title}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            {content.ninthIsland.note}
          </p>
        </div>
      </section>

      {/* Finale: the letter */}
      <section className="flex min-h-svh flex-col items-center justify-center gap-8 bg-gradient-to-b from-cream to-blush-soft px-6 py-20 text-center">
        <div data-reveal className="text-4xl" aria-hidden>
          💌
        </div>
        <div data-reveal className="w-full max-w-md bg-[#fffdf5] p-8 text-left shadow-xl">
          <p className="font-display text-lg text-ink">{content.letter.greeting}</p>
          {content.letter.body.map((para) => (
            <p key={para.slice(0, 24)} className="mt-4 text-sm leading-relaxed text-ink">
              {para}
            </p>
          ))}
          <p className="mt-6 font-hand text-ink">{content.letter.signoff}</p>
        </div>
        <div data-reveal>
          <h2 className="font-display text-3xl text-rose">Happy 8th Anniversary</h2>
          <div className="mt-6">
            <Counter />
          </div>
        </div>
      </section>
    </div>
  )
}
