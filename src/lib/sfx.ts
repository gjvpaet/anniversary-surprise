/**
 * Play a one-shot sound effect, ducking "our song" underneath it so
 * the effect is clearly audible. The AudioPlayer answers duck-song /
 * unduck-song; if the song isn't playing (or Web Audio is
 * unavailable) the events are harmless no-ops.
 *
 * Every terminal path — `ended`, a mid-playback `error`, or a
 * rejected play() (blocked OR failed load) — funnels through a
 * once-guarded unduck, so exactly one unduck fires per call and the
 * song can never stick quiet. Effects are garnish, never
 * load-bearing — failures are silent.
 *
 * Only two effects exist (first-find chime, 7/7 yay) and they can't
 * overlap, so duck/unduck needs no nesting counter. A third effect
 * that CAN overlap must revisit this (see the design doc).
 */
export function playEffect(src: string): void {
  const audio = new Audio(src)
  let unducked = false
  const unduck = () => {
    if (unducked) return
    unducked = true
    window.dispatchEvent(new CustomEvent('unduck-song'))
  }
  window.dispatchEvent(new CustomEvent('duck-song'))
  audio.addEventListener('ended', unduck, { once: true })
  audio.addEventListener('error', unduck, { once: true })
  audio.play().catch(unduck)
}
