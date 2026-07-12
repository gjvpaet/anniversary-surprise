import confetti from 'canvas-confetti'

/**
 * Theme tokens resolved at runtime — a canvas can't read CSS
 * variables. Falls back to the shipped hex if a token is missing so
 * the burst never renders colorless.
 */
const themeColor = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

/**
 * The 7/7 moment: one big celebratory burst — a wide center shot,
 * then two angled side shots — that rains down and settles in ~4 s.
 * SecretsCounter owns the trigger (live seventh find only).
 *
 * canvas-confetti draws on its own fixed, full-screen,
 * pointer-events-none canvas (z-index 100, above the Lightbox's
 * z-50), so nothing blocks her tap on "open the vault".
 * disableForReducedMotion skips every particle; the yay sound still
 * marks the moment. No cream in the palette — it's the page
 * background, cream confetti would vanish.
 */
export function celebrate(): void {
  const colors = [
    themeColor('--color-rose', '#c26a85'),
    themeColor('--color-blush', '#e8b4c4'),
    themeColor('--color-sky', '#b8d4e8'),
    themeColor('--color-lavender', '#cfc0e8'),
    themeColor('--color-sage', '#a8c096'),
  ]
  const shot = (particleCount: number, opts: confetti.Options) => {
    confetti({ disableForReducedMotion: true, particleCount, colors, ...opts })
  }
  shot(160, { spread: 100, startVelocity: 55, origin: { x: 0.5, y: 0.7 } })
  setTimeout(() => shot(60, { angle: 60, spread: 70, origin: { x: 0, y: 0.8 } }), 300)
  setTimeout(() => shot(60, { angle: 120, spread: 70, origin: { x: 1, y: 0.8 } }), 600)
}
