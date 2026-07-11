import { useState } from 'react'
import { content } from './content'
import { isUnlocked } from './lib/gate'
import Gate from './components/Gate'
import Counter from './components/Counter'

/**
 * Day-1 scaffold: a plain vertical read-through of the whole journey,
 * rendered entirely from content.ts. Day 2 replaces this flow with the
 * GSAP ScrollTrigger camera (pins, flights, parallax) — the structure
 * and content wiring stay the same.
 */
export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked)

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} />

  return (
    <main>
      {/* 1 · Opening overlook */}
      <section className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
        <h1 className="font-display text-4xl text-ink md:text-5xl text-balance">
          Welcome, {content.herName} 🗺️
        </h1>
        <Counter />
        <p className="text-sm text-ink-soft">↓ scroll to begin our story ↓</p>
      </section>

      {/* 2 · Era islands */}
      {content.eras.map((era) => (
        <section
          key={era.id}
          id={era.id}
          className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center"
        >
          <img
            src={era.art.layers[era.art.layers.length - 1]}
            alt=""
            className="w-full max-w-md drop-shadow-xl"
          />
          <div>
            <p className="text-xs tracking-[0.2em] text-rose uppercase">
              Chapter {String(era.chapter).padStart(2, '0')} · {era.years}
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink text-balance">
              {era.title}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              {era.note}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {era.polaroids.map((p, i) => (
              <figure
                key={p.src}
                className={`bg-white p-2 pb-3 shadow-lg ${i % 2 === 0 ? '-rotate-3' : 'rotate-2'}`}
              >
                <img src={p.src} alt={p.caption} className="h-32 w-32 object-cover" />
                <figcaption className="mt-2 font-hand text-xs text-ink-soft">
                  {p.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      {/* 3 · The 9th island */}
      <section className="flex min-h-[60svh] flex-col items-center justify-center gap-4 bg-gradient-to-b from-cream to-lavender/30 px-6 text-center">
        <img src="/art/ninth.webp" alt="" className="w-full max-w-sm drop-shadow-xl" />
        <h2 className="font-display text-2xl text-ink">{content.ninthIsland.title}</h2>
        <p className="max-w-md text-sm text-ink-soft">{content.ninthIsland.note}</p>
      </section>

      {/* 4 · Finale: the letter */}
      <section className="flex min-h-svh flex-col items-center justify-center gap-8 bg-gradient-to-b from-cream to-blush-soft px-6 py-20 text-center">
        <div className="text-4xl" aria-hidden>
          💌
        </div>
        <div className="w-full max-w-md bg-[#fffdf5] p-8 text-left shadow-xl">
          <p className="font-display text-lg text-ink">{content.letter.greeting}</p>
          {content.letter.body.map((para) => (
            <p key={para.slice(0, 24)} className="mt-4 text-sm leading-relaxed text-ink">
              {para}
            </p>
          ))}
          <p className="mt-6 font-hand text-ink">{content.letter.signoff}</p>
        </div>
        <div>
          <h2 className="font-display text-3xl text-rose">Happy 8th Anniversary</h2>
          <div className="mt-6">
            <Counter />
          </div>
        </div>
      </section>
    </main>
  )
}
