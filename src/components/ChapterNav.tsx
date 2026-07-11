import { ScrollTrigger } from '../lib/motion'
import type { Era } from '../content'

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  eras: Era[]
  /** Chapter currently on camera; 0 = before the first era. */
  active: number
}

/**
 * Fixed chapter pills (Pearl & Co. style): dots on mobile, dot + era
 * title on wider screens. Highlights the chapter on camera and
 * smooth-scrolls to an era's pin start on tap. Native smooth scroll
 * (not a GSAP tween) so jumps keep working when rAF is throttled.
 */
export default function ChapterNav({ eras, active }: Props) {
  const jump = (id: string) => {
    const st = ScrollTrigger.getById(id)
    const top = st
      ? st.start + 2
      : (document.getElementById(id)?.getBoundingClientRect().top ?? 0) +
        window.scrollY
    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  return (
    <nav
      aria-label="Chapters"
      className="fixed top-1/2 right-2 z-40 flex -translate-y-1/2 flex-col items-end gap-1.5 md:right-4"
    >
      {eras.map((era) => {
        const isActive = era.chapter === active
        return (
          <button
            key={era.id}
            type="button"
            onClick={() => jump(era.id)}
            aria-current={isActive ? 'true' : undefined}
            className={`group flex cursor-pointer items-center gap-2 rounded-full px-1.5 py-1 text-[11px] transition-colors md:px-2.5 ${
              isActive
                ? 'bg-blush-soft text-rose'
                : 'text-ink-soft hover:bg-blush-soft/60'
            }`}
          >
            <span className="hidden md:inline">{era.title.replace(/\.$/, '')}</span>
            <span
              className={`h-2 w-2 rounded-full transition-colors ${
                isActive ? 'bg-rose' : 'bg-ink-soft/40 group-hover:bg-rose/60'
              }`}
            />
          </button>
        )
      })}
    </nav>
  )
}
