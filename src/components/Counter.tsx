import { useEffect, useState } from 'react'
import { daysTogether, yearsTogether } from '../content'

/** Live "days together" counter — re-checks at each local midnight. */
export default function Counter() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const untilMidnight = tomorrow.getTime() - now.getTime() + 1000
    const id = window.setTimeout(() => setNow(new Date()), untilMidnight)
    return () => window.clearTimeout(id)
  }, [now])

  const stats = [
    { value: daysTogether(now).toLocaleString(), label: 'days' },
    { value: String(yearsTogether(now)), label: 'years' },
    { value: '∞', label: 'to go' },
  ]

  return (
    <div className="flex items-start justify-center gap-8">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div className="font-display text-3xl text-ink tabular-nums md:text-4xl">
            {s.value}
          </div>
          <div className="mt-1 text-xs tracking-widest text-ink-soft uppercase">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}
