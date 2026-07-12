import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/motion'
import { content } from '../content'
import Counter from './Counter'

/**
 * Starting scatter for the swirl photos (one per era), as fractions of
 * the viewport from center, plus a starting tilt. Deterministic so the
 * scrubbed swirl replays identically in both directions.
 */
const SCATTER = [
  { x: -0.38, y: -0.3, r: -24 },
  { x: 0.4, y: -0.16, r: 18 },
  { x: -0.42, y: 0.12, r: -12 },
  { x: 0.36, y: 0.28, r: 28 },
  { x: -0.26, y: 0.36, r: 14 },
  { x: 0.3, y: -0.38, r: -18 },
]

/**
 * The 9th island, then the finale: the letter section pins and the
 * scroll scrubs one polaroid from every era swirling into the
 * envelope — eight years folding into one letter — before the card
 * and the closing rise up. Reduced motion (and the default CSS) is
 * the plain static layout: envelope, letter, counter, no duplicates.
 */
export default function Finale() {
  const root = useRef<HTMLDivElement>(null)
  const ninthFloat = useRef<HTMLDivElement>(null)
  const letterSection = useRef<HTMLElement>(null)
  const swirl = useRef<HTMLDivElement>(null)
  const envelope = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const closing = useRef<HTMLDivElement>(null)

  // one memory per era rides into the envelope
  const swirlPhotos = content.eras.map((era) => era.polaroids[0])

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(root)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // ninth-island entrance reveals (unpinned)
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

      // ninth island idle bob, same rhythm as the era islands
      gsap.to(ninthFloat.current, {
        y: -9,
        duration: 2.7,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })

      // ── the letter: pin + swirl ─────────────────────────────
      const photos = swirl.current ? Array.from(swirl.current.children) : []

      // where the photos land: the envelope's center, measured relative
      // to the section's center (scroll-invariant delta)
      const sRect = letterSection.current!.getBoundingClientRect()
      const eRect = envelope.current!.getBoundingClientRect()
      const targetX = eRect.left + eRect.width / 2 - (sRect.left + sRect.width / 2)
      const targetY = eRect.top + eRect.height / 2 - (sRect.top + sRect.height / 2)

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'letter',
          trigger: letterSection.current,
          start: 'top top',
          end: '+=220%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      })

      photos.forEach((photo, i) => {
        const s = SCATTER[i % SCATTER.length]
        tl.fromTo(
          photo,
          {
            x: s.x * window.innerWidth,
            y: s.y * window.innerHeight,
            rotation: s.r,
            scale: 0.9,
            autoAlpha: 1,
          },
          {
            x: targetX,
            y: targetY,
            rotation: i % 2 ? 150 : -150,
            scale: 0.12,
            autoAlpha: 0,
            duration: 1,
            ease: 'power1.inOut',
          },
          i * 0.18,
        )
      })

      tl.to(envelope.current, { scale: 1.3, rotation: -8, duration: 0.18, ease: 'power2.out' }, '>-0.15')
        .to(envelope.current, { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2)' })
        .fromTo(card.current, { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 })
        .fromTo(
          closing.current,
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5 },
          '-=0.2',
        )
        .to({}, { duration: 0.4 }) // rest on the finished finale
    })

    return () => mm.revert()
  }, [])

  return (
    <div ref={root}>
      {/* The 9th island */}
      <section className="flex min-h-[70svh] flex-col items-center justify-center gap-4 bg-gradient-to-b from-cream to-lavender/30 px-6 py-16 text-center">
        {/* reveal (y+opacity) and bob (y) on separate wrappers so the
            tweens never fight over the same transform */}
        <div data-reveal>
          <div ref={ninthFloat}>
            <img
              src="/art/ninth.webp"
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full max-w-sm drop-shadow-xl"
            />
          </div>
        </div>
        <div data-reveal>
          <p className="text-xs tracking-[0.2em] text-rose uppercase">
            Chapter 07 · to be continued…
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            {content.ninthIsland.title}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            {content.ninthIsland.note}
          </p>
        </div>
      </section>

      {/* Finale: every era swirls into the letter */}
      <section
        ref={letterSection}
        className="relative h-svh overflow-hidden bg-gradient-to-b from-cream to-blush-soft"
      >
        {/* decorative swirl duplicates — hidden unless the scrub drives them */}
        <div ref={swirl} aria-hidden className="pointer-events-none absolute inset-0">
          {swirlPhotos.map((p) => (
            <div
              key={p.src}
              className="absolute top-1/2 left-1/2 -ml-12 -mt-14 w-24 bg-white p-1.5 pb-4 opacity-0 shadow-lg"
            >
              <img src={p.src} alt="" loading="lazy" decoding="async" className="h-20 w-full object-cover" />
            </div>
          ))}
        </div>

        <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
          <div ref={envelope} className="text-5xl" aria-hidden>
            💌
          </div>
          <div
            ref={card}
            className="max-h-[55svh] w-full overflow-y-auto bg-[#fffdf5] p-6 text-left shadow-xl md:p-8"
          >
            <p className="font-display text-lg text-ink">{content.letter.greeting}</p>
            {content.letter.body.map((para) => (
              <p key={para.slice(0, 24)} className="mt-4 text-sm leading-relaxed text-ink">
                {para}
              </p>
            ))}
            <p className="mt-6 font-hand text-xl text-ink">{content.letter.signoff}</p>
          </div>
          <div ref={closing}>
            <h2 className="font-display text-2xl text-rose md:text-3xl">
              Happy 8th Anniversary
            </h2>
            <div className="mt-4">
              <Counter />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
